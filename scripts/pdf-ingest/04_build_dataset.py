# -*- coding: utf-8 -*-
"""
Etapa 4 - Consolidacao do dataset (inventario + texto extraido).

Junta data/pdf-inventory.jsonl com data/text/**.json.gz e produz
data/documents.jsonl: uma linha por PDF unico, pronta para carga no Postgres.

O ganho principal aqui e' RECLASSIFICAR o documento pelo CONTEUDO, e nao so'
pelo nome do arquivo — 465 arquivos ficaram como "desconhecido" na etapa 1.
Sinais medidos no texto:
    n_questoes      quantos marcadores "QUESTAO n" / "n)" existem
    n_alternativas  quantas alternativas A)-E) aparecem
    n_respostas     pares "numero -> letra" tipicos de gabarito
    densidade_gab   fracao do texto que sao pares numero->letra

Regra: o conteudo so' sobrepoe o nome quando o sinal e' forte; caso contrario
mantem-se o que veio do nome e `tipo_fonte` registra a origem da decisao.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, norm, read_json_gz, text_path  # noqa: E402

INVENTORY = DATA / "pdf-inventory.jsonl"
OUT = DATA / "documents.jsonl"

# --------------------------------------------------------------------------- #
# sinais de conteudo
# --------------------------------------------------------------------------- #
RE_QUESTAO = re.compile(r"(?im)^[^\S\n]*quest[ãa]o[^\S\n]*n?[º°.:\-]*[^\S\n]*(\d{1,3})\b")
RE_NUM_INICIO = re.compile(r"(?m)^[^\S\n]*(\d{1,3})[^\S\n]*[\.\)–\-][^\S\n]+\S")
# Tres formas de alternativa. A terceira — a letra sozinha numa linha, com o
# texto na linha seguinte — e' a do ENEM, e sem ela 79 provas do ENEM eram
# classificadas como discursivas por "nao ter alternativa".
RE_ALT = re.compile(
    r"(?m)^[^\S\n]*(?:"
    r"\(([A-Ea-e])\)[^\S\n]*(?=\S)"
    r"|([A-Ea-e])[^\S\n]*[\).\-–:][^\S\n]*(?=\S)"
    r"|([A-Ea-e])[^\S\n]*$(?=\n[^\S\n]*\S)"
    r")"
)
# pares tipicos de gabarito: "12 - C", "12) D", "12 C", "QUESTAO 12 ... B"
RE_PAR_GAB = re.compile(r"(?m)^[^\S\n]*(?:quest[ãa]o[^\S\n]*)?(\d{1,3})[^\S\n]*[\.\)\-–:]?[^\S\n]*([A-Ea-e])[^\S\n]*$", re.I)
RE_ANULADA = re.compile(r"(?i)\banulad[ao]s?\b")
# Codigo interno impresso no cabecalho pelas graficas das bancas
# ("FMRP1401", "UNIF2302"): a prova e o gabarito da MESMA aplicacao trazem o
# mesmo codigo. E' o jeito mais direto de saber qual gabarito e' de qual prova.
RE_CODIGO = re.compile(r"\b([A-Z]{3,6}\d{4})\b")

# A banca nao vem declarada em lugar nenhum do PDF — cada uma deixa marcas
# proprias. Detectar UMA vez aqui e gravar no documento evita o que estava
# acontecendo: cada consulta redescobrindo a banca de um jeito diferente.
MARCAS_BANCA = [
    (
        "VUNESP",
        (
            r"\bvunesp\b",
            r"confidencial at[eé] o momento da aplica",
            r"confidencial at[eé] a publica",
        ),
    ),
    ("INEP", (r"\binep\b", r"exame nacional do ensino m[eé]dio", r"\benem\b")),
    ("FUVEST", (r"\bfuvest\b",)),
    ("COMVEST", (r"\bcomvest\b",)),
    ("FGV", (r"\bfgv\b|funda[çc][aã]o get[uú]lio vargas",)),
    ("CEBRASPE", (r"\bcebraspe\b|\bcespe\b",)),
]
RE_GABARITO_PALAVRA = re.compile(r"(?i)\bgabarito\b|\bchave de respostas\b|\brespostas? oficia")
RE_REDACAO = re.compile(r"(?i)\bproposta de reda[çc][ãa]o\b|\bredação\b.{0,40}\bproposta\b")
RE_CRITERIOS = re.compile(r"(?i)crit[ée]rios? de corre[çc][ãa]o|grade de corre[çc][ãa]o|espelho de reda")


def contar_blocos_alternativas(texto: str) -> int:
    """Conta sequencias completas de alternativas (A,B,C,D[,E]).

    E' o sinal mais confiavel para "quantas questoes objetivas ha aqui": nao
    depende de como a banca diagrama o numero da questao. Ha provas em que a
    palavra "QUESTAO" e o numero saem em blocos de texto separados, e outras
    em que o numero aparece sozinho numa linha, sem pontuacao — nenhum padrao
    de numeracao pega todos os casos, mas o bloco de alternativas sim.
    """
    letras = [
        (m.group(1) or m.group(2) or m.group(3)).upper() for m in RE_ALT.finditer(texto)
    ]
    blocos = 0
    i = 0
    while i < len(letras):
        if letras[i] != "A":
            i += 1
            continue
        j = i
        while j + 1 < len(letras) and ord(letras[j + 1]) == ord(letras[j]) + 1:
            j += 1
        if j - i + 1 >= 4:  # A-D ja conta: algumas bancas usam 4 alternativas
            blocos += 1
        i = j + 1
    return blocos


def medir_sinais(texto: str) -> dict:
    n_q = len(RE_QUESTAO.findall(texto))
    n_num = len(RE_NUM_INICIO.findall(texto))
    n_alt = len(RE_ALT.findall(texto))
    n_blocos = contar_blocos_alternativas(texto)
    pares = RE_PAR_GAB.findall(texto)
    linhas = max(1, texto.count("\n") + 1)
    return {
        "n_questoes": n_q,
        "n_num_inicio": n_num,
        "n_alternativas": n_alt,
        "n_blocos_alternativas": n_blocos,
        "n_respostas": len(pares),
        "densidade_gab": round(len(pares) / linhas, 3),
        "tem_palavra_gabarito": bool(RE_GABARITO_PALAVRA.search(texto)),
        "tem_criterios": bool(RE_CRITERIOS.search(texto)),
        "tem_anuladas": bool(RE_ANULADA.search(texto)),
    }


def reclassificar(tipo_nome: str, s: dict) -> tuple[str, str]:
    """Devolve (tipo_final, fonte).

    O sinal de "prova objetiva" e' o BLOCO de alternativas A-E, nao a contagem
    solta de linhas comecadas por letra: gabaritos de discursivas e criterios de
    correcao usam "a)", "b)", "c)" nas respostas e passavam por objetivas —
    eram 270 arquivos classificados errado.
    """
    blocos = s.get("n_blocos_alternativas", 0)
    tem_objetiva = blocos >= 5
    tem_gabarito = s["n_respostas"] >= 10 and s["densidade_gab"] >= 0.10
    marcadores = s["n_questoes"] + s["n_num_inicio"]

    if tem_gabarito and not tem_objetiva:
        return "gabarito", "conteudo"

    if tem_objetiva:
        # prova com gabarito impresso no fim continua sendo prova objetiva
        return "prova_objetiva", "conteudo"

    # Sem blocos A-E nao ha' o que chamar de objetiva. O nome do arquivo volta
    # a ter peso, porque distingue coisas que o texto sozinho nao distingue
    # (criterio de correcao x gabarito de discursiva x proposta de redacao).
    if tipo_nome in ("criterios_redacao", "redacao", "gabarito", "edital", "resultado"):
        return tipo_nome, "nome"

    if s["tem_criterios"]:
        return "criterios_redacao", "conteudo"

    if marcadores >= 5:
        return "prova_discursiva", "conteudo"

    if tipo_nome != "desconhecido":
        return tipo_nome, "nome"

    return "desconhecido", "nome"


# --------------------------------------------------------------------------- #
# taxonomia derivada
# --------------------------------------------------------------------------- #
def slug(s: str | None) -> str | None:
    if not s:
        return None
    t = norm(s)
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t or None


FASE_REGRAS = [
    (r"1[ªa°o]?\s*fase|primeira fase", "1ª FASE"),
    (r"2[ªa°o]?\s*fase|segunda fase", "2ª FASE"),
    (r"prova\s*(?:i{1,3}\b|1\b)", "PROVA I"),
    (r"prova\s*(?:ii\b|2\b)", "PROVA II"),
    (r"prova\s*(?:iii\b|3\b)", "PROVA III"),
    (r"vagas remanescent|remanescent", "VAGAS REMANESCENTES"),
    (r"ver[ãa]o", "VERÃO"),
    (r"inverno|meio de ano|meio do ano", "INVERNO"),
    (r"\b1[ºo]?\s*dia\b|primeiro dia", "1º DIA"),
    (r"\b2[ºo]?\s*dia\b|segundo dia", "2º DIA"),
]

CURSOS = [
    (r"\bmedicin", "MEDICINA"),
    (r"\benfermag", "ENFERMAGEM"),
    (r"\bodontolog", "ODONTOLOGIA"),
    (r"\bdireito\b", "DIREITO"),
    (r"\barquitetur", "ARQUITETURA"),
    (r"\bveterinari|medicina veterin", "VETERINARIA"),
    (r"\bpsicolog", "PSICOLOGIA"),
    (r"\bnutri[çc]", "NUTRICAO"),
    (r"\bfisioterap", "FISIOTERAPIA"),
    (r"\bfarmac", "FARMACIA"),
    (r"\badministra[çc]", "ADMINISTRACAO"),
]


def detectar_banca(texto: str, codigos: list[str]) -> tuple[str | None, str | None]:
    """Devolve (banca, evidencia). Sem marca reconhecida, devolve (None, None).

    O codigo da grafica no cabecalho ("FMRP1401") e' assinatura da VUNESP, mas
    so' vale como evidencia secundaria: sozinho ele nao prova, entao entra
    depois das marcas textuais.
    """
    t = norm(texto)
    for banca, padroes in MARCAS_BANCA:
        for p in padroes:
            if re.search(p, t):
                return banca, p
    if codigos:
        return "VUNESP", "codigo_da_gafica"
    return None, None


def derivar(campo: str, regras) -> str | None:
    n = norm(campo)
    for pat, val in regras:
        if re.search(pat, n):
            return val
    return None


def main() -> int:
    recs = [json.loads(l) for l in INVENTORY.open(encoding="utf-8")]
    by_sha: dict[str, list[dict]] = {}
    for r in recs:
        if r.get("sha256"):
            by_sha.setdefault(r["sha256"], []).append(r)

    out_rows = []
    faltando_texto = 0
    for sha, group in by_sha.items():
        base = sorted(group, key=lambda r: r["rel_path"])[0]
        tp = text_path(sha)
        if not tp.exists():
            faltando_texto += 1
            continue
        d = read_json_gz(tp)
        pages = d["pages"]
        texto_total = "\n\n".join(p.get("text", "") for p in pages)

        sinais = medir_sinais(texto_total)
        tipo, fonte = reclassificar(base.get("tipo", "desconhecido"), sinais)

        # codigos so' das primeiras paginas: e' onde fica o cabecalho da grafica
        cabecalho = "\n".join((p.get("text") or "") for p in pages[:3])
        codigos = sorted(set(RE_CODIGO.findall(cabecalho)))
        banca, banca_evidencia = detectar_banca(texto_total[:60000], codigos)

        confs = [p["ocr_conf"] for p in pages if p.get("source") == "ocr" and p.get("ocr_conf")]
        contexto = " / ".join(base.get("subpasta") or []) + " / " + base["filename"]

        out_rows.append(
            {
                "sha256": sha,
                "rel_path": base["rel_path"],
                "all_paths": sorted(r["rel_path"] for r in group),
                "filename": base["filename"],
                "categoria": base.get("categoria"),
                "instituicao": base.get("instituicao"),
                "instituicao_slug": slug(base.get("instituicao")),
                "ano": base.get("ano"),
                "ano_fonte": base.get("ano_fonte"),
                "subpasta": base.get("subpasta") or [],
                "fase": derivar(contexto, FASE_REGRAS),
                "curso": derivar(contexto, CURSOS),
                "tipo": tipo,
                "tipo_fonte": fonte,
                "sinais": sinais,
                "codigos": codigos,
                "banca": banca,
                "banca_evidencia": banca_evidencia,
                "pdf_metadata": base.get("pdf_metadata") or None,
                "size_bytes": base.get("size_bytes", 0),
                "pages": len(pages),
                "chars": sum(p.get("chars", 0) for p in pages),
                "pages_nativas": sum(1 for p in pages if p.get("source") == "pdf"),
                "pages_ocr": sum(1 for p in pages if str(p.get("source", "")).startswith("ocr")),
                "pages_sem_texto": sum(
                    1 for p in pages if p.get("source") in ("pendente_ocr", "ocr_vazio")
                ),
                "ocr_conf_media": round(sum(confs) / len(confs), 1) if confs else None,
            }
        )

    out_rows.sort(key=lambda r: r["rel_path"])
    with OUT.open("w", encoding="utf-8") as f:
        for r in out_rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # -------- relatorio --------
    import collections

    tipos = collections.Counter(r["tipo"] for r in out_rows)
    fontes = collections.Counter(r["tipo_fonte"] for r in out_rows)
    print("================ DATASET ================")
    print(f"Documentos unicos    : {len(out_rows)}  (sem texto: {faltando_texto})")
    print(f"Paginas              : {sum(r['pages'] for r in out_rows)}")
    print(f"  nativas            : {sum(r['pages_nativas'] for r in out_rows)}")
    print(f"  via OCR            : {sum(r['pages_ocr'] for r in out_rows)}")
    print(f"  ainda sem texto    : {sum(r['pages_sem_texto'] for r in out_rows)}")
    print(f"Caracteres           : {sum(r['chars'] for r in out_rows):,}")
    print("\nTipo (apos conteudo):")
    for t, c in tipos.most_common():
        print(f"  {t:22s} {c}")
    bancas = collections.Counter(r.get("banca") or "(desconhecida)" for r in out_rows)
    print("\nBanca:")
    for b, c in bancas.most_common():
        print(f"  {b:22s} {c}")
    print(f"\nDecisao por conteudo: {fontes.get('conteudo', 0)} | por nome: {fontes.get('nome', 0)}")
    print(f"Com fase identificada: {sum(1 for r in out_rows if r['fase'])}")
    print(f"Com curso identificado: {sum(1 for r in out_rows if r['curso'])}")
    print(f"\nEscrito em: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
