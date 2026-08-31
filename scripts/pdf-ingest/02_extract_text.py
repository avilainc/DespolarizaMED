# -*- coding: utf-8 -*-
"""
Etapa 2 - Extracao do texto nativo (camada de texto do PDF).

Le data/pdf-inventory.jsonl e, para cada arquivo unico (por sha256), grava
data/text/<ab>/<sha256>.json.gz com uma entrada por pagina:

    {"n": 1, "layout": "duas-colunas", "source": "pdf",
     "chars": 3120, "text": "...", "w": 595.2, "h": 842.0,
     "blocks": [[x0,y0,x1,y1,"..."], ...]}

Paginas sem camada de texto ficam com source="pendente_ocr" e text="" — a
etapa 3 preenche via OCR. Nada e' inventado: o que nao veio do PDF fica vazio
e marcado.

Uso:  python scripts/pdf-ingest/02_extract_text.py [--force] [--limit N]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import (  # noqa: E402
    CONTEUDO,
    DATA,
    MIN_CHARS_PER_PAGE,
    clean_text,
    compact_lines,
    page_lines,
    page_text,
    read_json_gz,
    text_path,
    write_json_gz,
)

INVENTORY = DATA / "pdf-inventory.jsonl"


def extract_one(job: tuple[str, str, list[str]]) -> dict:
    sha, rel_path, rel_paths = job
    src = CONTEUDO / rel_path

    # Ao reprocessar (--force), as paginas ja reconhecidas por OCR sao mantidas:
    # o texto nativo delas continua inexistente e refazer o OCR custa horas.
    ocr_anterior: dict[int, dict] = {}
    tp = text_path(sha)
    if tp.exists():
        try:
            for p in read_json_gz(tp)["pages"]:
                if str(p.get("source", "")).startswith("ocr"):
                    ocr_anterior[p["n"]] = p
        except Exception:
            ocr_anterior = {}

    out = {
        "sha256": sha,
        "rel_paths": rel_paths,
        "pages": [],
        "stats": {"pages": 0, "pages_pdf": 0, "pages_pendente_ocr": 0, "chars": 0},
    }
    try:
        with fitz.open(src) as doc:
            if doc.is_encrypted:
                doc.authenticate("")
            for i, page in enumerate(doc):
                if (i + 1) in ocr_anterior:
                    entry = ocr_anterior[i + 1]
                    # a limpeza pode ter mudado; reaplica sem refazer o OCR
                    entry["text"] = clean_text(entry.get("text") or "")
                    entry["chars"] = len(entry["text"])
                    out["stats"]["chars"] += entry.get("chars", 0)
                    out["stats"]["pages_ocr"] = out["stats"].get("pages_ocr", 0) + 1
                    out["pages"].append(entry)
                    continue
                r = page_text(page)
                text = r["text"]
                entry = {
                    "n": i + 1,
                    "w": round(page.rect.width, 1),
                    "h": round(page.rect.height, 1),
                    "layout": r["layout"],
                    "ordem": r["ordem"],
                    "score_ordem": [r["score_nativa"], r["score_geometrica"]],
                }
                if len(text) < MIN_CHARS_PER_PAGE:
                    entry["source"] = "pendente_ocr"
                    entry["text"] = text  # pode haver cabecalho solto; preservado
                    entry["chars"] = len(text)
                    out["stats"]["pages_pendente_ocr"] += 1
                else:
                    entry["source"] = "pdf"
                    entry["text"] = text
                    entry["chars"] = len(text)
                    # linhas com fonte/tamanho/negrito: e' o que permite ao
                    # parser distinguir numero de questao de numero de pagina
                    entry["linhas"] = compact_lines(page_lines(page))
                    out["stats"]["pages_pdf"] += 1
                out["stats"]["chars"] += len(text)
                out["pages"].append(entry)
            out["stats"]["pages"] = doc.page_count
    except Exception as e:
        out["error"] = repr(e)
        return out

    write_json_gz(text_path(sha), out)
    return {
        "sha256": sha,
        "rel_path": rel_path,
        "stats": out["stats"],
        "error": out.get("error"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="reprocessa mesmo se ja existir")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    if not INVENTORY.exists():
        print("Rode antes: 01_inventory.py", file=sys.stderr)
        return 1

    recs = [json.loads(l) for l in INVENTORY.open(encoding="utf-8")]
    by_sha: dict[str, list[str]] = {}
    for r in recs:
        if r.get("sha256") and not r.get("error"):
            by_sha.setdefault(r["sha256"], []).append(r["rel_path"])

    jobs = []
    skipped = 0
    for sha, paths in by_sha.items():
        if not args.force and text_path(sha).exists():
            skipped += 1
            continue
        jobs.append((sha, sorted(paths)[0], sorted(paths)))
    if args.limit:
        jobs = jobs[: args.limit]

    print(
        f"{len(by_sha)} arquivos unicos ({len(recs)} caminhos). "
        f"{skipped} ja extraidos, {len(jobs)} a processar.",
        flush=True,
    )

    workers = max(2, min(8, (os.cpu_count() or 4)))
    results = []
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(extract_one, j) for j in jobs]
        for i, fut in enumerate(as_completed(futs), 1):
            results.append(fut.result())
            if i % 100 == 0:
                print(f"  {i}/{len(jobs)}", flush=True)

    err = [r for r in results if r.get("error")]
    ok = [r for r in results if not r.get("error")]
    tot_pages = sum(r["stats"]["pages"] for r in ok)
    tot_pdf = sum(r["stats"]["pages_pdf"] for r in ok)
    tot_pend = sum(r["stats"]["pages_pendente_ocr"] for r in ok)
    tot_ocr = sum(r["stats"].get("pages_ocr", 0) for r in ok)
    tot_chars = sum(r["stats"]["chars"] for r in ok)

    print("\n================ EXTRACAO DE TEXTO ================")
    print(f"Arquivos processados : {len(results)} (erros: {len(err)})")
    print(f"Paginas              : {tot_pages}")
    print(f"  com texto nativo   : {tot_pdf}")
    print(f"  OCR preservado     : {tot_ocr}")
    print(f"  pendentes de OCR   : {tot_pend}")
    print(f"Caracteres extraidos : {tot_chars:,}")
    for r in err[:15]:
        print(f"  ERRO {r['rel_path']}: {r['error']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
