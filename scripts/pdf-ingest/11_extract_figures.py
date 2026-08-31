# -*- coding: utf-8 -*-
"""
Etapa 11 - Figuras das questoes.

Uma questao que diz "de acordo com o grafico" nao se responde so' com texto.
Esta etapa recorta o que e' imagem na pagina e descobre a QUAL questao cada
recorte pertence, pela geometria:

    [ numero da questao ]   <- ancora, com bbox conhecido (etapa 02)
    [ enunciado ........ ]
    [ FIGURA ........... ]  <- pertence a questao acima, na mesma coluna
    [ alternativas ..... ]
    [ numero seguinte .. ]  <- limite inferior

Pega tanto imagem embutida (foto, digitalizacao) quanto desenho vetorial
(grafico, esquema, formula estrutural), que e' a maioria em prova.

Saida: data/figures/<sha>/p<pagina>_<i>.png + data/figures.jsonl
Uso: python scripts/pdf-ingest/11_extract_figures.py [--limit N] [--dpi 150]
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import CONTEUDO, DATA, read_json_gz, text_path  # noqa: E402

DOCS = DATA / "documents.jsonl"
QUESTIONS = DATA / "questions.jsonl"
FIG_DIR = DATA / "figures"
OUT = DATA / "figures.jsonl"

TIPOS_PROVA = {"prova_objetiva", "prova"}
# recortes menores que isto sao filete, logotipo, marca d'agua — nao figura
AREA_MINIMA = 4000.0  # pontos quadrados (~1,3 x 1,5 cm)
LADO_MINIMO = 40.0
MAX_DESENHOS = 4000  # acima disso, agrupar vetores custa mais do que rende


def regioes_de_figura(page: fitz.Page) -> list[fitz.Rect]:
    """Retangulos de imagem embutida + aglomerados de desenho vetorial."""
    achados: list[fitz.Rect] = []

    for info in page.get_images(full=True):
        try:
            r = page.get_image_bbox(info)
        except Exception:
            continue
        if r and not r.is_empty:
            achados.append(fitz.Rect(r))

    # `cluster_drawings` custa O(n²) no numero de desenhos. Paginas com dezenas
    # de milhares de vetores (mapas, partituras, fundos decorativos) travam o
    # processo por dezenas de minutos e nao produzem figura util — o resultado
    # seria um aglomerado do tamanho da pagina, que ja' seria descartado abaixo.
    try:
        if len(page.get_drawings()) <= MAX_DESENHOS:
            for r in page.cluster_drawings():
                achados.append(fitz.Rect(r))
    except Exception:
        pass

    uteis = []
    for r in achados:
        r = r & page.rect
        if r.is_empty:
            continue
        if r.width < LADO_MINIMO or r.height < LADO_MINIMO:
            continue
        if r.get_area() < AREA_MINIMA:
            continue
        # quase a pagina inteira = moldura, nao figura
        if r.get_area() > 0.92 * page.rect.get_area():
            continue
        uteis.append(r)

    # funde retangulos que se sobrepoem (um grafico costuma vir em varios
    # aglomerados de desenho: eixos, barras, legenda)
    uteis.sort(key=lambda r: (r.y0, r.x0))
    fundidos: list[fitz.Rect] = []
    for r in uteis:
        juntou = False
        for i, f in enumerate(fundidos):
            if not (f & r).is_empty or f.contains(r) or r.contains(f):
                fundidos[i] = f | r
                juntou = True
                break
        if not juntou:
            fundidos.append(r)
    return fundidos


def ancoras_da_pagina(linhas: list[list], numeros_validos: set[int]) -> list[dict]:
    """Linhas que marcam o inicio de uma questao, com posicao."""
    import re

    padrao = re.compile(r"^[^\S\n]*(?:quest[ãa]o[^\S\n]*)?(\d{1,3})[.\)]?[^\S\n]*$", re.I)
    saida = []
    for l in linhas:
        m = padrao.match(l[4] or "")
        if not m:
            continue
        n = int(m.group(1))
        if numeros_validos and n not in numeros_validos:
            continue
        saida.append({"numero": n, "x0": l[0], "y0": l[1], "x1": l[2]})
    saida.sort(key=lambda a: (a["y0"], a["x0"]))
    return saida


def dono_da_figura(fig: fitz.Rect, ancoras: list[dict], meio_x: float) -> int | None:
    """Questao a que a figura pertence: a ancora acima dela, na mesma coluna."""
    col_fig = 0 if fig.x0 + fig.width / 2 < meio_x else 1
    candidata = None
    for a in ancoras:
        col_a = 0 if a["x0"] < meio_x else 1
        if col_a != col_fig:
            continue
        if a["y0"] <= fig.y0 + 2:
            candidata = a["numero"]
    if candidata is None and ancoras:
        # figura acima da primeira ancora da coluna: pode ser texto-base do grupo
        return None
    return candidata


def processar(job: tuple) -> dict:
    sha, rel_path, numeros_validos, dpi = job
    resultado = {"sha256": sha, "rel_path": rel_path, "figuras": []}
    try:
        dados = read_json_gz(text_path(sha))
    except Exception as e:
        resultado["error"] = f"json: {e!r}"
        return resultado

    linhas_por_pagina = {p["n"]: (p.get("linhas") or []) for p in dados["pages"]}
    destino = FIG_DIR / sha[:2] / sha
    zoom = dpi / 72.0

    try:
        with fitz.open(CONTEUDO / rel_path) as pdf:
            if pdf.is_encrypted:
                pdf.authenticate("")
            for page in pdf:
                n = page.number + 1
                figs = regioes_de_figura(page)
                if not figs:
                    continue
                ancoras = ancoras_da_pagina(linhas_por_pagina.get(n, []), numeros_validos)
                meio_x = page.rect.x0 + page.rect.width / 2
                for i, r in enumerate(figs):
                    numero = dono_da_figura(r, ancoras, meio_x)
                    destino.mkdir(parents=True, exist_ok=True)
                    nome = f"p{n:03d}_{i}.png"
                    caminho = destino / nome
                    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=r, alpha=False)
                    pix.save(caminho)
                    resultado["figuras"].append(
                        {
                            "pagina": n,
                            "indice": i,
                            "numero_questao": numero,
                            "bbox": [round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1)],
                            "arquivo": caminho.relative_to(DATA).as_posix(),
                            "largura_px": pix.width,
                            "altura_px": pix.height,
                        }
                    )
    except Exception as e:
        resultado["error"] = f"pdf: {e!r}"
    return resultado


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--dpi", type=int, default=150)
    ap.add_argument("--filtro", default="")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    docs = [json.loads(l) for l in DOCS.open(encoding="utf-8")]
    provas = [d for d in docs if d["tipo"] in TIPOS_PROVA]
    if args.filtro:
        provas = [d for d in provas if args.filtro.lower() in d["rel_path"].lower()]
    if args.limit:
        provas = provas[: args.limit]

    # numeros de questao conhecidos por documento, para nao ancorar em ruido
    numeros: dict[str, set[int]] = collections.defaultdict(set)
    if QUESTIONS.exists():
        for linha in QUESTIONS.open(encoding="utf-8"):
            q = json.loads(linha)
            if q.get("numero") is not None:
                numeros[q["sha256"]].add(q["numero"])

    jobs = [(d["sha256"], d["rel_path"], numeros.get(d["sha256"], set()), args.dpi) for d in provas]
    print(f"{len(jobs)} provas para extrair figuras a {args.dpi} dpi.", flush=True)

    resultados = []
    workers = max(1, min(args.workers, os.cpu_count() or 4))
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(processar, j) for j in jobs]
        for i, fut in enumerate(as_completed(futs), 1):
            resultados.append(fut.result())
            if i % 50 == 0:
                print(f"  {i}/{len(jobs)}", flush=True)

    with OUT.open("w", encoding="utf-8") as f:
        for r in resultados:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    erros = [r for r in resultados if r.get("error")]
    total = sum(len(r["figuras"]) for r in resultados)
    com_dono = sum(1 for r in resultados for fg in r["figuras"] if fg["numero_questao"])
    docs_com = sum(1 for r in resultados if r["figuras"])

    print("\n================ FIGURAS ================")
    print(f"Provas processadas  : {len(resultados)} (erros: {len(erros)})")
    print(f"  com alguma figura : {docs_com}")
    print(f"Figuras recortadas  : {total}")
    print(f"  ligadas a questao : {com_dono} ({com_dono / total * 100:.1f}%)" if total else "")
    for r in erros[:10]:
        print(f"  ERRO {r['rel_path']}: {r['error']}")
    print(f"\nEscrito em: {OUT} e {FIG_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
