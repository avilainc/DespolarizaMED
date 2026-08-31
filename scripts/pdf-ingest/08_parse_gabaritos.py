# -*- coding: utf-8 -*-
"""
Etapa 8 - Leitura dos gabaritos (numero da questao -> letra).

O cuidado principal aqui e' com gabarito de prova com VARIAS VERSOES de
caderno. A PUC-CAMP, por exemplo, imprime:

    1 D      <- versao 1
    1 D      <- versao 2
    1 D      ...
    1 B      <- versao 7

O mesmo numero aparece varias vezes com letras diferentes. Escolher uma delas
seria inventar a resposta. Quando as letras de um numero divergem, o numero e'
marcado como `conflito` e NAO vira resposta — some do banco em vez de entrar
errado.

Saida: data/answers.jsonl (uma linha por gabarito).
Uso: python scripts/pdf-ingest/08_parse_gabaritos.py [--filtro texto]
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, read_json_gz, text_path  # noqa: E402

DOCS = DATA / "documents.jsonl"
OUT = DATA / "answers.jsonl"

# "1 - D" / "1. D" / "01 D" / "QUESTAO 1: D", um par por linha
RE_PAR_LINHA = re.compile(
    r"(?im)^[^\S\n]*(?:quest[ãa]o[^\S\n]*)?(\d{1,3})[^\S\n]*[-–.):]?[^\S\n]*([A-E])[^\S\n]*$"
)
# mesma coisa, mas varios pares na mesma linha: "1-A  2-C  3-E"
RE_PAR_INLINE = re.compile(r"(?i)\b(\d{1,3})[^\S\n]*[-–.):][^\S\n]*([A-E])\b")
RE_ANULADA = re.compile(
    r"(?im)^[^\S\n]*(?:quest[ãa]o[^\S\n]*)?(\d{1,3})[^\S\n]*[-–.):]?[^\S\n]*"
    r"(?:anulad[ao]|todas as alternativas|questao anulada)"
)


# mesma coisa que RE_PAR_LINHA, mas para casar uma linha isolada
RE_PAR_UNICA = re.compile(
    r"^[^\S\n]*(?:quest[ãa]o[^\S\n]*)?(\d{1,3})[^\S\n]*[-–.):]?[^\S\n]*([A-E])[^\S\n]*$", re.I
)
TOLERANCIA_COLUNA = 30.0  # pontos: quanto dois x0 podem diferir e ser a mesma coluna


def colunas_de_respostas(pages: list[dict]) -> list[dict]:
    """Separa gabaritos impressos em mais de uma coluna independente.

    A PUC-RS publica um unico PDF com DUAS chaves lado a lado — 1o dia e 2o dia
    — cada uma numerada de 1 a 30. Lido como texto corrido, o resultado e'
    "1 - E / 1 - E / 2 - C / 2 - A": o mesmo numero com letras diferentes. O
    detector de conflito evitava a resposta errada, mas descartava as duas.

    Com o bbox de cada linha da' para separar as colunas por x e recuperar as
    duas chaves inteiras, cada uma com o cabecalho que a identifica.
    """
    itens = []
    for p in pages:
        for l in p.get("linhas") or []:
            m = RE_PAR_UNICA.match(l[4] or "")
            if m:
                itens.append(
                    {
                        "x0": l[0],
                        "y": l[1],
                        "pag": p["n"],
                        "num": int(m.group(1)),
                        "letra": m.group(2).upper(),
                    }
                )
    if len(itens) < 10:
        return []

    faixas: list[list[float]] = []
    for x in sorted(i["x0"] for i in itens):
        if faixas and x - faixas[-1][-1] <= TOLERANCIA_COLUNA:
            faixas[-1].append(x)
        else:
            faixas.append([x])
    if len(faixas) < 2:
        return []

    # limites de cada coluna: o meio do caminho ate' a coluna vizinha. Sem isso
    # o cabecalho de uma coluna captura a lista de materias da coluna ao lado, e
    # a desambiguacao por materia decide errado.
    centros = [(min(f) + max(f)) / 2 for f in faixas]
    bordas = []
    for k, f in enumerate(faixas):
        esq = (centros[k - 1] + centros[k]) / 2 if k > 0 else min(f) - 200
        dir_ = (centros[k] + centros[k + 1]) / 2 if k + 1 < len(faixas) else max(f) + 400
        bordas.append((esq, dir_))

    colunas = []
    for faixa, (borda_esq, borda_dir) in zip(faixas, bordas):
        lo, hi = min(faixa), max(faixa)
        proprios = [i for i in itens if lo - 1 <= i["x0"] <= hi + 1]
        if len(proprios) < 5:
            continue
        proprios.sort(key=lambda i: (i["pag"], i["y"]))

        votos: dict[int, list[str]] = collections.defaultdict(list)
        for i in proprios:
            votos[i["num"]].append(i["letra"])
        respostas = {n: v[0] for n, v in votos.items() if len(set(v)) == 1}
        if len(respostas) < 5:
            continue

        # cabecalho: o que estiver escrito acima do primeiro par, nesta coluna
        primeiro = proprios[0]
        cabecalho = []
        for p in pages:
            if p["n"] != primeiro["pag"]:
                continue
            for l in p.get("linhas") or []:
                centro_linha = (l[0] + l[2]) / 2
                if l[1] < primeiro["y"] and borda_esq <= centro_linha <= borda_dir:
                    texto = (l[4] or "").strip()
                    if texto and not RE_PAR_UNICA.match(texto):
                        cabecalho.append(texto)
        colunas.append(
            {
                "x0": round(lo, 1),
                # a lista de materias costuma ocupar varias linhas quebradas
                "cabecalho": " | ".join(cabecalho[-6:]),
                "respostas": {str(k): v for k, v in sorted(respostas.items())},
                "n_respostas": len(respostas),
            }
        )
    return colunas if len(colunas) >= 2 else []


def ler_gabarito(doc: dict) -> dict:
    data = read_json_gz(text_path(doc["sha256"]))
    texto = "\n".join(p.get("text") or "" for p in data["pages"])

    votos: dict[int, list[str]] = collections.defaultdict(list)
    for m in RE_PAR_LINHA.finditer(texto):
        votos[int(m.group(1))].append(m.group(2).upper())
    if len(votos) < 5:  # provavelmente e' layout em linha unica
        for m in RE_PAR_INLINE.finditer(texto):
            votos[int(m.group(1))].append(m.group(2).upper())

    anuladas = {int(m.group(1)) for m in RE_ANULADA.finditer(texto)}

    respostas: dict[int, str] = {}
    conflitos: dict[int, list[str]] = {}
    for num, letras in votos.items():
        unicas = sorted(set(letras))
        if len(unicas) == 1:
            respostas[num] = unicas[0]
        else:
            conflitos[num] = unicas

    colunas = colunas_de_respostas(data["pages"]) if conflitos else []

    # Colunas com faixas de numero DISJUNTAS sao partes de uma unica chave
    # (uma coluna por materia): juntar e' seguro e recupera o que o detector de
    # conflito tinha descartado. Colunas com faixas sobrepostas sao versoes
    # diferentes do caderno — juntar ali seria escolher resposta no chute.
    disjuntas = False
    if colunas:
        vistos: set[int] = set()
        disjuntas = True
        for c in colunas:
            nums = {int(k) for k in c["respostas"]}
            if nums & vistos:
                disjuntas = False
                break
            vistos |= nums
        if disjuntas:
            for c in colunas:
                for k, v in c["respostas"].items():
                    respostas.setdefault(int(k), v)
            conflitos = {n: l for n, l in conflitos.items() if n not in respostas}

    numeros = sorted(respostas)
    # a numeracao de um gabarito deve ser continua; buracos sao sinal de leitura
    # incompleta e ficam registrados
    faltando = []
    if numeros:
        faltando = [n for n in range(min(numeros), max(numeros) + 1) if n not in respostas]

    return {
        "sha256": doc["sha256"],
        "rel_path": doc["rel_path"],
        "colunas": colunas,
        "instituicao_slug": doc.get("instituicao_slug"),
        "instituicao": doc.get("instituicao"),
        "codigos": doc.get("codigos") or [],
        "ano": doc.get("ano"),
        "fase": doc.get("fase"),
        "curso": doc.get("curso"),
        "respostas": {str(k): v for k, v in sorted(respostas.items())},
        "conflitos": {str(k): v for k, v in sorted(conflitos.items())},
        "anuladas": sorted(anuladas),
        "faltando": faltando,
        "n_respostas": len(respostas),
        "n_conflitos": len(conflitos),
        "multiversao": bool(conflitos) and len(conflitos) >= 0.3 * max(1, len(votos)),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--filtro", default="")
    args = ap.parse_args()

    docs = [json.loads(l) for l in DOCS.open(encoding="utf-8")]
    gabs = [d for d in docs if d["tipo"] == "gabarito"]
    if args.filtro:
        gabs = [d for d in gabs if args.filtro.lower() in d["rel_path"].lower()]

    print(f"{len(gabs)} gabaritos.", flush=True)
    linhas = [ler_gabarito(d) for d in gabs]

    with OUT.open("w", encoding="utf-8") as f:
        for r in linhas:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    com = [r for r in linhas if r["n_respostas"] >= 5]
    vazios = [r for r in linhas if r["n_respostas"] == 0]
    multiv = [r for r in linhas if r["multiversao"]]
    total_resp = sum(r["n_respostas"] for r in com)
    total_conf = sum(r["n_conflitos"] for r in linhas)
    com_buraco = [r for r in com if r["faltando"]]

    print("\n================ GABARITOS ================")
    print(f"Gabaritos            : {len(linhas)}")
    print(f"  com >=5 respostas  : {len(com)}")
    print(f"  sem nenhuma        : {len(vazios)}  (gabaritos de discursiva)")
    print(f"  multiversao        : {len(multiv)}  (numeros com letras divergentes)")
    print(f"Respostas confiaveis : {total_resp}")
    print(f"Numeros em conflito  : {total_conf}  (descartados)")
    print(f"Gabaritos com buraco : {len(com_buraco)}")
    print(f"Questoes anuladas    : {sum(len(r['anuladas']) for r in linhas)}")
    multicol = [r for r in linhas if r.get("colunas")]
    recuperadas = sum(sum(c["n_respostas"] for c in r["colunas"]) for r in multicol)
    print(f"Gabaritos multicoluna: {len(multicol)} -> {recuperadas} respostas recuperadas")
    for r in multicol[:4]:
        print(f"   {r['rel_path'][-52:]}")
        for c in r["colunas"]:
            print(f"      x={c['x0']:>6} {c['n_respostas']:>3} respostas | {c['cabecalho'][:64]}")
    print(f"\nEscrito em: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
