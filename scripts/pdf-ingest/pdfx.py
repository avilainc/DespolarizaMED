# -*- coding: utf-8 -*-
"""Helpers compartilhados do pipeline de ingestao de PDFs.

O ponto delicado aqui e' a ORDEM DE LEITURA. Provas de vestibular sao quase
sempre diagramadas em duas colunas; `page.get_text("text")` devolve os blocos na
ordem do content stream, o que costuma intercalar coluna esquerda e direita e
destruir o enunciado. `reflow_page` detecta a calha (gutter) entre colunas e
remonta o texto na ordem em que um humano le:

    [faixa de largura total]        <- cabecalho / figura que cruza a calha
    [col. esq. de cima a baixo]
    [col. dir. de cima a baixo]
    [faixa de largura total]
    ...

Qual das duas versoes vai para o banco e' decidido por medicao, nao por regra
fixa: ver `order_score` e `page_text`.
"""
from __future__ import annotations

import gzip
import json
import re
import unicodedata
from pathlib import Path

import fitz  # PyMuPDF

MIN_CHARS_PER_PAGE = 120  # mesmo limiar do inventario

import os

ROOT = Path(__file__).resolve().parents[2]
# O acervo de PDFs vive FORA do repositorio (nao e' versionado nem regeneravel
# a partir dele). O caminho e' configuravel por ACERVO_DIR para a maquina que
# roda o pipeline apontar para onde os PDFs realmente estao.
CONTEUDO = Path(os.environ.get("ACERVO_DIR", r"D:/projetos/conteudo"))
DATA = ROOT / "data"
TEXT_DIR = DATA / "text"


# --------------------------------------------------------------------------- #
# util
# --------------------------------------------------------------------------- #
def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def norm(s: str) -> str:
    return strip_accents(s).lower()


def text_path(sha256: str) -> Path:
    return TEXT_DIR / sha256[:2] / f"{sha256}.json.gz"


def write_json_gz(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with gzip.open(tmp, "wt", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
    tmp.replace(path)


def read_json_gz(path: Path):
    with gzip.open(path, "rt", encoding="utf-8") as f:
        return json.load(f)


# --------------------------------------------------------------------------- #
# limpeza do texto
# --------------------------------------------------------------------------- #
_LIG = {
    "ﬀ": "ff",
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
    "−": "-",
    "‐": "-",
    "‑": "-",
    "­": "",
}

# Provas diagramadas em InDesign usam espaco fino/EN/EM no lugar do espaco
# comum: o texto real e' "QUESTAO  01". Sem normalizar isso, nenhum
# padrao que espere " " encontra a numeracao das questoes — foi exatamente o
# que fez a conferencia prova x gabarito acusar 1 questao em provas de 90.
_ESPACOS = re.compile("[   -​    　﻿]")
# Glifos de marcador (bullet) chegam como caracteres de controle no texto.
# A faixa inclui \x00, que o Postgres rejeita em colunas text.
_CONTROLE = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def clean_text(t: str) -> str:
    for k, v in _LIG.items():
        t = t.replace(k, v)
    t = _ESPACOS.sub(" ", t)
    t = _CONTROLE.sub(" ", t)
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


# --------------------------------------------------------------------------- #
# spans: fonte, tamanho, sobrescrito/subscrito
# --------------------------------------------------------------------------- #
# Extrair "text" puro achata expoente e indice: "R = sigma T4" onde o PDF diz
# T elevado a 4. Sao coisas diferentes numa prova de exatas. O modo "dict" traz
# tamanho e linha de base de cada span, o que permite remontar o que era.
_SUP = str.maketrans("0123456789+-=()n", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ")
_SUB = str.maketrans("0123456789+-=()", "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎")

FLAG_SOBRESCRITO = 1
FLAG_NEGRITO = 16

_MENOS_EXPOENTE = re.compile(r"[-–−][ \t]?(?=[⁰¹²³⁴⁵⁶⁷⁸⁹])")


def _converter(texto: str, tabela) -> str | None:
    """Converte se TODO caractere tiver equivalente; senao devolve None."""
    conv = texto.translate(tabela)
    if conv == texto and texto.strip():
        return None
    for original, convertido in zip(texto, conv):
        if original == convertido and not original.isspace():
            return None
    return conv


def _spans_da_linha(linha: dict) -> tuple[str, str | None, float, bool]:
    """Monta o texto de uma linha, marcando expoentes e indices.

    Devolve (texto, fonte_dominante, tamanho_dominante, negrito).
    """
    spans = [s for s in linha.get("spans", []) if s.get("text")]
    if not spans:
        return "", None, 0.0, False

    # o corpo da linha e' o tamanho que cobre mais caracteres
    peso: dict[float, int] = {}
    for s in spans:
        peso[round(s["size"], 1)] = peso.get(round(s["size"], 1), 0) + len(s["text"])
    tamanho = max(peso, key=lambda k: peso[k])
    base = [s["origin"][1] for s in spans if round(s["size"], 1) == tamanho]
    base_y = sum(base) / len(base) if base else 0.0

    partes = []
    fontes: dict[str, int] = {}
    negrito = False
    for s in spans:
        t = s["text"]
        fontes[s["font"]] = fontes.get(s["font"], 0) + len(t)
        if s.get("flags", 0) & FLAG_NEGRITO:
            negrito = True

        menor = round(s["size"], 1) <= 0.82 * tamanho
        acima = s["origin"][1] < base_y - 0.5
        abaixo = s["origin"][1] > base_y + 0.5
        eh_sup = bool(s.get("flags", 0) & FLAG_SOBRESCRITO) or (menor and acima)
        eh_sub = menor and abaixo and not eh_sup

        convertido = None
        if eh_sup:
            convertido = _converter(t, _SUP)
        elif eh_sub:
            convertido = _converter(t, _SUB)
        partes.append(convertido if convertido is not None else t)

    fonte = max(fontes, key=lambda k: fontes[k]) if fontes else None
    texto = "".join(partes)
    # O sinal do expoente negativo costuma vir num span de tamanho normal, fora
    # do sobrescrito: "10" + "-" + "³" viraria "10-³". Um hifen colado a um
    # expoente e' o sinal do expoente.
    texto = _MENOS_EXPOENTE.sub("⁻", texto)
    return texto, fonte, tamanho, negrito


def page_lines(page: fitz.Page) -> list[dict]:
    """Linhas da pagina com bbox, texto remontado e assinatura de fonte."""
    saida = []
    for b in page.get_text("dict").get("blocks", []):
        if b.get("type") != 0:
            continue
        for i, linha in enumerate(b.get("lines", [])):
            texto, fonte, tamanho, negrito = _spans_da_linha(linha)
            if not texto.strip():
                continue
            x0, y0, x1, y1 = linha["bbox"]
            saida.append(
                {
                    "bbox": (x0, y0, x1, y1),
                    "texto": texto,
                    "fonte": fonte,
                    "tamanho": tamanho,
                    "negrito": negrito,
                    "bloco": b.get("number", 0),
                }
            )
    return saida


def compact_lines(linhas: list[dict]) -> list[list]:
    """Formato enxuto para gravar em disco."""
    return [
        [
            round(l["bbox"][0], 1),
            round(l["bbox"][1], 1),
            round(l["bbox"][2], 1),
            round(l["bbox"][3], 1),
            l["texto"],
            l["fonte"],
            l["tamanho"],
            1 if l["negrito"] else 0,
        ]
        for l in linhas
    ]


# --------------------------------------------------------------------------- #
# ordem de leitura
# --------------------------------------------------------------------------- #
def _text_blocks(page: fitz.Page) -> list[tuple]:
    """(x0, y0, x1, y1, texto) por bloco de texto, montado a partir dos spans.

    Mantem o mesmo agrupamento em blocos que `get_text("blocks")` produz — para
    nao mexer na deteccao de colunas, que ja' esta' aferida — mas o texto vem
    dos spans, com expoentes e indices preservados.
    """
    out = []
    for b in page.get_text("dict").get("blocks", []):
        if b.get("type") != 0:
            continue
        linhas = []
        for linha in b.get("lines", []):
            texto, _f, _t, _n = _spans_da_linha(linha)
            if texto.strip():
                linhas.append(texto)
        if not linhas:
            continue
        x0, y0, x1, y1 = b["bbox"]
        out.append((x0, y0, x1, y1, "\n".join(linhas)))
    return out


def detect_gutter(blocks: list[tuple], page_rect=None) -> float | None:
    """Devolve o x da calha central se a pagina for de duas colunas, senao None.

    Metodo: perfil de projecao horizontal. Blocos largos (cabecalho, figura,
    tabela) sao excluidos do perfil porque atravessam a calha legitimamente.
    Procura-se a maior faixa vertical "vazia" no miolo, tolerando ate 1 bloco
    intruso, e exige-se massa de texto dos dois lados.
    """
    if len(blocks) < 6:
        return None

    xs0 = min(b[0] for b in blocks)
    xs1 = max(b[2] for b in blocks)
    content_w = xs1 - xs0
    if content_w <= 0:
        return None

    body = [b for b in blocks if (b[2] - b[0]) <= 0.62 * content_w]
    if len(body) < 6:
        return None

    NB = 200
    profile = [0] * NB

    def bin_of(x: float) -> int:
        return min(NB - 1, max(0, int((x - xs0) / content_w * NB)))

    for b in body:
        for i in range(bin_of(b[0]), bin_of(b[2]) + 1):
            profile[i] += 1

    tol = 1 if len(body) >= 12 else 0  # tolera 1 bloco intruso em paginas densas
    lo, hi = int(0.34 * NB), int(0.66 * NB)

    best_run = None  # (comprimento, inicio, fim)
    run_start = None
    for i in range(lo, hi + 1):
        if profile[i] <= tol:
            if run_start is None:
                run_start = i
        else:
            if run_start is not None:
                run = (i - run_start, run_start, i - 1)
                if best_run is None or run[0] > best_run[0]:
                    best_run = run
                run_start = None
    if run_start is not None:
        run = (hi + 1 - run_start, run_start, hi)
        if best_run is None or run[0] > best_run[0]:
            best_run = run

    if best_run is None or best_run[0] < int(0.015 * NB):
        return None

    gx = xs0 + ((best_run[1] + best_run[2] + 1) / 2) / NB * content_w

    left = [b for b in body if b[2] <= gx + 1]
    right = [b for b in body if b[0] >= gx - 1]
    if len(left) < 3 or len(right) < 3:
        return None
    cl = sum(len(b[4]) for b in left)
    cr = sum(len(b[4]) for b in right)
    if cl == 0 or cr == 0 or min(cl, cr) / max(cl, cr) < 0.15:
        return None
    return gx


def order_blocks(blocks: list[tuple], page_rect=None) -> tuple[list[tuple], str]:
    """Reordena blocos na ordem de leitura humana. Devolve (blocos, layout)."""
    if not blocks:
        return [], "vazio"

    gutter = detect_gutter(blocks, page_rect)
    if gutter is None:
        ordered = sorted(blocks, key=lambda b: (round(b[1], 1), round(b[0], 1)))
        return ordered, "coluna-unica"

    xs0 = min(b[0] for b in blocks)
    xs1 = max(b[2] for b in blocks)
    content_w = xs1 - xs0

    def is_full_width(b) -> bool:
        return b[0] < gutter - 1 and b[2] > gutter + 1 and (b[2] - b[0]) > 0.62 * content_w

    ordered_out: list[tuple] = []
    band: list[tuple] = []

    def flush_band():
        if not band:
            return
        left = sorted(
            [b for b in band if b[2] <= gutter + 1], key=lambda b: (round(b[1], 1), b[0])
        )
        right = sorted(
            [b for b in band if b[0] >= gutter - 1], key=lambda b: (round(b[1], 1), b[0])
        )
        rest = sorted(
            [b for b in band if b not in left and b not in right],
            key=lambda b: (round(b[1], 1), b[0]),
        )
        ordered_out.extend(left + right + rest)
        band.clear()

    for b in sorted(blocks, key=lambda b: (round(b[1], 1), round(b[0], 1))):
        if is_full_width(b):
            flush_band()
            ordered_out.append(b)
        else:
            band.append(b)
    flush_band()

    return ordered_out, "duas-colunas"


def reflow_page(page: fitz.Page) -> tuple[str, str, list[tuple]]:
    """Devolve (texto_em_ordem_de_leitura, layout, blocos_originais)."""
    blocks = _text_blocks(page)
    if not blocks:
        return "", "vazio", []
    ordered, layout = order_blocks(blocks, page.rect)
    return _join(ordered), layout, blocks


def _join(ordered: list[tuple]) -> str:
    parts = []
    for b in ordered:
        t = b[4].strip("\n")
        if t.strip():
            parts.append(t)
    return "\n\n".join(parts)


def join_blocks(ordered: list[tuple]) -> str:
    """Concatena blocos ja ordenados em texto."""
    return _join(ordered)


def compact_blocks(blocks: list[tuple]) -> list[list]:
    """Blocos com bbox arredondado, para o parser da etapa seguinte."""
    return [
        [round(b[0], 1), round(b[1], 1), round(b[2], 1), round(b[3], 1), b[4]]
        for b in blocks
    ]


# --------------------------------------------------------------------------- #
# escolha da ordem de leitura: nativa (content stream) x geometrica
# --------------------------------------------------------------------------- #
# `[^\S\n]` = qualquer espaco em branco menos a quebra de linha. Usar isso no
# lugar de `[ \t]` protege contra os espacos exoticos que sobrevivem a limpeza.
_Q_RE = re.compile(
    r"(?im)^[^\S\n]*(?:quest[ãa]o|quest\.)[^\S\n]*n?[º°.:\-]*[^\S\n]*(\d{1,3})\b"
    r"|^[^\S\n]*(\d{1,3})[^\S\n]*[\.\)–\-][^\S\n]+\S"
)
# Alternativas aparecem em varios formatos: "(A) texto", "A) texto",
# "A. texto", "A - texto". O primeiro e' o mais comum nas provas brasileiras.
_ALT_RE = re.compile(
    r"(?m)^[^\S\n]*(?:\(([A-Ea-e])\)|([A-Ea-e])[^\S\n]*[\).\-–:])[^\S\n]*\S"
)


def _alt_letters(text: str) -> list[str]:
    return [(m.group(1) or m.group(2)).upper() for m in _ALT_RE.finditer(text)]


def order_score(text: str) -> int:
    """Mede o quanto o texto parece estar em ordem de leitura.

    Nao julga o conteudo: so conta marcadores que aparecem em sequencia
    crescente (QUESTAO 32 -> 33 -> 34; alternativas A -> B -> C -> D -> E).
    Serve para escolher entre a ordem nativa do PDF e a remontagem geometrica.
    """
    nums = []
    for m in _Q_RE.finditer(text):
        g = m.group(1) or m.group(2)
        if g:
            nums.append(int(g))
    q_pairs = sum(1 for a, b in zip(nums, nums[1:]) if b == a + 1)

    letters = _alt_letters(text)
    a_pairs = sum(1 for a, b in zip(letters, letters[1:]) if ord(b) == ord(a) + 1)
    return 3 * q_pairs + a_pairs


def page_text(page: fitz.Page) -> dict:
    """Extrai a pagina escolhendo a melhor ordem de leitura disponivel.

    As duas versoes saem dos mesmos blocos montados a partir dos spans — o que
    muda entre elas e' so' a ORDEM. Antes a versao nativa vinha de
    `get_text("text")`, que achata expoente e indice; como ela vence na maioria
    das paginas, a remontagem de formulas nunca chegava ao banco.
    """
    blocks = _text_blocks(page)
    # ordem nativa = ordem do content stream, blocos separados por uma quebra
    # (mesmo formato que `get_text("text")` produzia)
    naive = clean_text("\n".join(b[4] for b in blocks))
    ordered, layout = order_blocks(blocks, page.rect)
    flow = clean_text(_join(ordered))

    s_naive = order_score(naive)
    s_flow = order_score(flow)

    if s_flow > s_naive:
        chosen, ordem = flow, "geometrica"
    else:
        chosen, ordem = naive, "nativa"

    return {
        "text": chosen,
        "layout": layout,
        "ordem": ordem,
        "score_nativa": s_naive,
        "score_geometrica": s_flow,
        "blocks": blocks,
    }
