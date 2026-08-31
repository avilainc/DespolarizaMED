# -*- coding: utf-8 -*-
"""
Etapa 16 - Provas discursivas.

461 documentos do acervo sao discursivos: tem enunciado numerado, mas nenhuma
alternativa A-E. Toda a etapa 07 se apoia no bloco de alternativas como ancora,
entao esses documentos nao produziam nada.

Aqui a ancora e' o proprio marcador de numero, e o enunciado vai de um marcador
ao seguinte. Sem alternativa nao ha' gabarito de letra para conferir, entao a
validacao possivel e' mais fraca e isso fica declarado: a questao entra com
`tipo = discursiva` e nunca com `validada = true`.

Saida: data/questions_discursivas.jsonl
Uso: python scripts/pdf-ingest/16_parse_discursivas.py
"""
from __future__ import annotations

import collections
import importlib.util
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, read_json_gz, text_path  # noqa: E402

_spec = importlib.util.spec_from_file_location(
    "p07", Path(__file__).resolve().parent / "07_parse_questions.py"
)
p07 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(p07)

DOCS = DATA / "documents.jsonl"
OUT = DATA / "questions_discursivas.jsonl"

TIPOS = {"prova_discursiva"}
MIN_ENUNCIADO = 60
MAX_ENUNCIADO = 8000

RE_MARCADOR = re.compile(
    r"(?im)^[^\S\n]*(?:quest[ãa]o|quest\.)[^\S\n]*n?[º°.:\-]*[^\S\n]*(\d{1,3})\b"
    r"|^[^\S\n]*(\d{1,3})[^\S\n]*[\.\)–\-][^\S\n]+(?=\S)"
)


def parse(doc: dict) -> list[dict]:
    dados = read_json_gz(text_path(doc["sha256"]))
    pages = dados["pages"]

    partes, limites, pos = [], [], 0
    for p in pages:
        t = p.get("text") or ""
        limites.append((pos, p["n"]))
        partes.append(t)
        pos += len(t) + 2
    texto = "\n\n".join(partes)

    def pagina_de(idx: int) -> int:
        pg = limites[0][1] if limites else 1
        for ini, n in limites:
            if ini <= idx:
                pg = n
            else:
                break
        return pg

    fora = p07.posicoes_de_numero_de_pagina(texto, limites)
    _assinatura, numeros_tipograficos = p07.numeros_por_assinatura(pages)
    validos = set(numeros_tipograficos)

    marcas = []
    for m in RE_MARCADOR.finditer(texto):
        n = int(m.group(1) or m.group(2))
        if m.start() in fora:
            continue
        if validos and n not in validos:
            continue
        marcas.append((n, m.start()))

    # so' interessa a corrida crescente: rodape, data e referencia bibliografica
    # tambem casam com "12." e entrariam como questao
    limpo: list[tuple[int, int]] = []
    for n, ini in marcas:
        if limpo and n <= limpo[-1][0]:
            continue
        if limpo and n > limpo[-1][0] + 3:
            continue
        limpo.append((n, ini))
    if len(limpo) < 2:
        return []

    questoes = []
    for i, (n, ini) in enumerate(limpo):
        fim = limpo[i + 1][1] if i + 1 < len(limpo) else min(len(texto), ini + MAX_ENUNCIADO)
        enunciado = p07.limpar_orfas(texto[ini:fim])
        problemas = []
        if len(enunciado) < MIN_ENUNCIADO:
            problemas.append("enunciado_curto")
        if len(enunciado) > MAX_ENUNCIADO:
            problemas.append("enunciado_longo")
        questoes.append(
            {
                "sha256": doc["sha256"],
                "rel_path": doc["rel_path"],
                "instituicao": doc.get("instituicao"),
                "instituicao_slug": doc.get("instituicao_slug"),
                "ano": doc.get("ano"),
                "fase": doc.get("fase"),
                "curso": doc.get("curso"),
                "tipo": "discursiva",
                "numero": n,
                "numero_forca": "forte",
                "pagina": pagina_de(ini),
                "enunciado": enunciado,
                "alternativas": [],
                "gabarito_letra": None,
                "problemas": problemas,
                "depende_de_contexto": False,
                "contexto_numero": None,
                "contexto_fonte": None,
            }
        )
    return questoes


def main() -> int:
    docs = [json.loads(l) for l in DOCS.open(encoding="utf-8")]
    alvos = [d for d in docs if d["tipo"] in TIPOS]
    print(f"{len(alvos)} provas discursivas.", flush=True)

    todas: list[dict] = []
    sem_nada = 0
    for i, d in enumerate(alvos, 1):
        qs = parse(d)
        if not qs:
            sem_nada += 1
        todas.extend(qs)
        if i % 100 == 0:
            print(f"  {i}/{len(alvos)}", flush=True)

    with OUT.open("w", encoding="utf-8") as f:
        for q in todas:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    ok = [q for q in todas if not q["problemas"]]
    motivos = collections.Counter(p for q in todas for p in q["problemas"])
    por_inst = collections.Counter(q["instituicao_slug"] for q in ok)

    print("\n================ DISCURSIVAS ================")
    print(f"Documentos          : {len(alvos)} (sem nenhuma questao: {sem_nada})")
    print(f"Questoes extraidas  : {len(todas)}")
    print(f"  sem defeito       : {len(ok)}")
    for m, c in motivos.most_common():
        print(f"  {m:20s} {c}")
    print("\nTop instituicoes:")
    for k, v in por_inst.most_common(6):
        print(f"  {str(k):24s} {v}")
    print(f"\nEscrito em: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
