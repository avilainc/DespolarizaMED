# -*- coding: utf-8 -*-
"""
Etapa 3 - OCR das paginas sem camada de texto.

Renderiza cada pagina pendente a 300 dpi (escala de cinza) e passa pelo
Tesseract em portugues, em modo TSV para tambem capturar a CONFIANCA por
palavra. O texto reconstruido volta para o mesmo data/text/<sha>.json.gz com:

    "source": "ocr", "ocr_conf": 87.4, "ocr_words": 412

Paginas com confianca baixa ficam marcadas (ocr_conf) para revisao — nao sao
silenciosamente tratadas como corretas.

Uso: python scripts/pdf-ingest/03_ocr.py [--force] [--limit N] [--dpi 300]
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import (  # noqa: E402
    CONTEUDO,
    DATA,
    clean_text,
    compact_blocks,
    join_blocks,
    order_blocks,
    order_score,
    read_json_gz,
    text_path,
    write_json_gz,
)

INVENTORY = DATA / "pdf-inventory.jsonl"

TESS_CANDIDATES = [
    Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Tesseract-OCR" / "tesseract.exe",
    Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Tesseract-OCR" / "tesseract.exe",
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Tesseract-OCR" / "tesseract.exe",
]


def find_tesseract() -> str:
    for c in TESS_CANDIDATES:
        if c.is_file():
            return str(c)
    from shutil import which

    w = which("tesseract")
    if w:
        return w
    raise SystemExit("Tesseract nao encontrado. Instale UB-Mannheim.TesseractOCR.")


TESS = None  # preenchido em cada worker


def ocr_png(png: bytes, lang: str, scale: float) -> tuple[str, list[tuple], float, int]:
    """Roda o Tesseract em modo TSV.

    Devolve (texto_na_ordem_do_tesseract, linhas, confianca_media, n_palavras).
    `linhas` sao tuplas (x0, y0, x1, y1, texto) ja convertidas de pixels para
    pontos do PDF (scale = 72/dpi), no mesmo formato dos blocos nativos.
    """
    global TESS
    if TESS is None:
        TESS = find_tesseract()
    proc = subprocess.run(
        [TESS, "-", "stdout", "-l", lang, "--oem", "1", "--psm", "3", "tsv"],
        input=png,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        return "", [], 0.0, 0
    raw = proc.stdout.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(raw), delimiter="\t", quoting=csv.QUOTE_NONE)

    lines: dict[tuple, dict] = {}
    confs: list[float] = []
    for row in reader:
        try:
            if int(row.get("level") or 0) != 5:
                continue
        except (ValueError, TypeError):
            continue
        word = (row.get("text") or "").strip()
        if not word:
            continue
        try:
            conf = float(row.get("conf") or -1)
            left, top = int(row["left"]), int(row["top"])
            w, h = int(row["width"]), int(row["height"])
        except (ValueError, TypeError, KeyError):
            continue
        if conf >= 0:
            confs.append(conf)
        key = (int(row["block_num"]), int(row["par_num"]), int(row["line_num"]))
        ln = lines.setdefault(
            key, {"words": [], "x0": left, "y0": top, "x1": left + w, "y1": top + h}
        )
        ln["words"].append(word)
        ln["x0"] = min(ln["x0"], left)
        ln["y0"] = min(ln["y0"], top)
        ln["x1"] = max(ln["x1"], left + w)
        ln["y1"] = max(ln["y1"], top + h)

    ordered_keys = sorted(lines.keys())
    tess_text = clean_text("\n".join(" ".join(lines[k]["words"]) for k in ordered_keys))
    boxes = [
        (
            round(lines[k]["x0"] * scale, 1),
            round(lines[k]["y0"] * scale, 1),
            round(lines[k]["x1"] * scale, 1),
            round(lines[k]["y1"] * scale, 1),
            " ".join(lines[k]["words"]),
        )
        for k in ordered_keys
    ]
    mean_conf = round(sum(confs) / len(confs), 1) if confs else 0.0
    return tess_text, boxes, mean_conf, len(confs)


def ocr_document(job: tuple[str, str, list[int], int, str]) -> dict:
    sha, rel_path, page_nums, dpi, lang = job
    tp = text_path(sha)
    try:
        doc_data = read_json_gz(tp)
    except Exception as e:
        return {"sha256": sha, "rel_path": rel_path, "error": f"json: {e!r}"}

    by_n = {p["n"]: p for p in doc_data["pages"]}
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    done = 0
    confs = []
    try:
        with fitz.open(CONTEUDO / rel_path) as pdf:
            if pdf.is_encrypted:
                pdf.authenticate("")
            for n in page_nums:
                page = pdf[n - 1]
                pix = page.get_pixmap(matrix=mat, colorspace=fitz.csGRAY, alpha=False)
                png = pix.tobytes("png")
                tess_text, boxes, conf, nwords = ocr_png(png, lang, 72.0 / dpi)

                # mesma escolha de ordem de leitura usada no texto nativo:
                # ordem do Tesseract x remontagem geometrica das linhas
                ordered, layout = order_blocks(list(boxes), page.rect)
                geo_text = clean_text(join_blocks(ordered))
                if order_score(geo_text) > order_score(tess_text):
                    text, ordem = geo_text, "geometrica"
                else:
                    text, ordem = tess_text, "nativa"

                entry = by_n.get(n)
                if entry is None:
                    continue
                prev = entry.get("text") or ""
                # o pouco texto nativo que existia (cabecalho) e' preservado no fim
                merged = text if not prev.strip() else f"{text}\n\n{prev}"
                entry["text"] = merged
                entry["chars"] = len(merged)
                entry["source"] = "ocr" if text.strip() else "ocr_vazio"
                entry["layout"] = layout
                entry["ordem"] = ordem
                entry["blocks"] = compact_blocks(boxes)
                entry["ocr_conf"] = conf
                entry["ocr_words"] = nwords
                entry["ocr_dpi"] = dpi
                done += 1
                if nwords:
                    confs.append(conf)
    except Exception as e:
        return {"sha256": sha, "rel_path": rel_path, "error": f"ocr: {e!r}"}

    st = doc_data.setdefault("stats", {})
    st["pages_ocr"] = st.get("pages_ocr", 0) + done
    st["pages_pendente_ocr"] = sum(1 for p in doc_data["pages"] if p.get("source") == "pendente_ocr")
    st["chars"] = sum(p.get("chars", 0) for p in doc_data["pages"])
    write_json_gz(tp, doc_data)

    return {
        "sha256": sha,
        "rel_path": rel_path,
        "paginas_ocr": done,
        "paginas_vazias": done - len(confs),
        "conf_media": round(sum(confs) / len(confs), 1) if confs else 0.0,
        "conf_min": min(confs) if confs else 0.0,
    }


def retry_rotacao(job: tuple[str, str, list[int], int, str]) -> dict:
    """Refaz o OCR de paginas mal reconhecidas testando 90 e 270 graus.

    Provas trazem tabela periodica, mapas e cartoes-resposta deitados na
    pagina. O OSD do Tesseract erra a orientacao nesses casos (reporta
    confianca ~8% e script errado), entao a decisao e' por forca bruta:
    reconhece nas tres orientacoes e fica com a de maior confianca.
    """
    sha, rel_path, page_nums, dpi, lang = job
    tp = text_path(sha)
    try:
        doc_data = read_json_gz(tp)
    except Exception as e:
        return {"sha256": sha, "rel_path": rel_path, "error": f"json: {e!r}"}

    by_n = {p["n"]: p for p in doc_data["pages"]}
    melhoradas = 0
    ganho_total = 0.0
    try:
        with fitz.open(CONTEUDO / rel_path) as pdf:
            if pdf.is_encrypted:
                pdf.authenticate("")
            for n in page_nums:
                entry = by_n.get(n)
                if entry is None:
                    continue
                base_conf = entry.get("ocr_conf") or 0.0
                # margem: so' troca o resultado se a melhora for inequivoca,
                # para nao substituir um texto ruim por outro igualmente ruim
                minimo = base_conf + 5.0
                melhor = None
                for rot in (90, 270):
                    mat = fitz.Matrix(dpi / 72.0, dpi / 72.0).prerotate(rot)
                    pix = pdf[n - 1].get_pixmap(matrix=mat, colorspace=fitz.csGRAY, alpha=False)
                    tess_text, boxes, conf, nwords = ocr_png(pix.tobytes("png"), lang, 72.0 / dpi)
                    if nwords and conf >= minimo and (melhor is None or conf > melhor[0]):
                        melhor = (conf, rot, tess_text, boxes, nwords)

                if melhor is None:
                    continue
                conf, rot, tess_text, boxes, nwords = melhor
                ordered, layout = order_blocks(list(boxes), pdf[n - 1].rect)
                geo_text = clean_text(join_blocks(ordered))
                if order_score(geo_text) > order_score(tess_text):
                    texto, ordem = geo_text, "geometrica"
                else:
                    texto, ordem = tess_text, "nativa"

                entry["text"] = texto
                entry["chars"] = len(texto)
                entry["layout"] = layout
                entry["ordem"] = ordem
                entry["blocks"] = compact_blocks(boxes)
                entry["ocr_conf"] = conf
                entry["ocr_words"] = nwords
                entry["ocr_rotacao"] = rot
                melhoradas += 1
                ganho_total += conf - base_conf
    except Exception as e:
        return {"sha256": sha, "rel_path": rel_path, "error": f"rot: {e!r}"}

    if melhoradas:
        doc_data["stats"]["chars"] = sum(p.get("chars", 0) for p in doc_data["pages"])
        write_json_gz(tp, doc_data)
    return {
        "sha256": sha,
        "rel_path": rel_path,
        "paginas_ocr": len(page_nums),
        "melhoradas": melhoradas,
        "ganho_medio": round(ganho_total / melhoradas, 1) if melhoradas else 0.0,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--lang", default="por")
    # a maquina tem 8 GB: 8 workers renderizando a 300 dpi estouraram a memoria
    # e derrubaram o Postgres. 4 e' o padrao seguro aqui.
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument(
        "--retry-rotacao",
        type=float,
        default=0,
        metavar="CONF",
        help="refaz em 90/270 graus as paginas ja OCRadas com confianca abaixo de CONF",
    )
    ap.add_argument(
        "--min-palavras",
        type=int,
        default=30,
        help="ignora no retry paginas com poucas palavras (capas, marcas d'agua)",
    )
    args = ap.parse_args()

    find_tesseract()  # falha cedo se nao houver

    recs = [json.loads(l) for l in INVENTORY.open(encoding="utf-8")]
    first_path: dict[str, str] = {}
    for r in recs:
        if r.get("sha256"):
            first_path.setdefault(r["sha256"], r["rel_path"])

    jobs = []
    for sha, rel in first_path.items():
        tp = text_path(sha)
        if not tp.exists():
            continue
        try:
            d = read_json_gz(tp)
        except Exception:
            continue
        if args.retry_rotacao:
            pend = [
                p["n"]
                for p in d["pages"]
                if p.get("source") == "ocr"
                and (p.get("ocr_conf") or 0) < args.retry_rotacao
                and (p.get("ocr_words") or 0) >= args.min_palavras
            ]
        else:
            pend = [
                p["n"]
                for p in d["pages"]
                if (p.get("source") == "pendente_ocr")
                or (args.force and p.get("source", "").startswith("ocr"))
            ]
        if pend:
            jobs.append((sha, rel, pend, args.dpi, args.lang))

    if args.limit:
        jobs = jobs[: args.limit]
    total_pages = sum(len(j[2]) for j in jobs)
    modo = "retry de rotacao" if args.retry_rotacao else "OCR"
    print(
        f"{len(jobs)} arquivos / {total_pages} paginas para {modo} a {args.dpi} dpi ({args.lang}).",
        flush=True,
    )

    workers = max(1, min(args.workers, (os.cpu_count() or 4)))
    print(f"workers={workers}", flush=True)
    tarefa = retry_rotacao if args.retry_rotacao else ocr_document
    results = []
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(tarefa, j) for j in jobs]
        for i, fut in enumerate(as_completed(futs), 1):
            results.append(fut.result())
            if i % 25 == 0:
                print(f"  {i}/{len(jobs)} arquivos", flush=True)

    err = [r for r in results if r.get("error")]
    ok = [r for r in results if not r.get("error")]
    pgs = sum(r["paginas_ocr"] for r in ok)

    if args.retry_rotacao:
        melhoradas = sum(r.get("melhoradas", 0) for r in ok)
        ganhos = [r["ganho_medio"] for r in ok if r.get("melhoradas")]
        print("\n============ RETRY DE ROTACAO ============")
        print(f"Arquivos            : {len(results)} (erros: {len(err)})")
        print(f"Paginas testadas    : {pgs}")
        print(f"Paginas melhoradas  : {melhoradas}")
        if ganhos:
            print(f"Ganho medio de conf : +{sum(ganhos)/len(ganhos):.1f} pontos")
        for r in err[:15]:
            print(f"  ERRO {r['rel_path']}: {r['error']}")
        return 0

    vazias = sum(r.get("paginas_vazias", 0) for r in ok)
    confs = [r["conf_media"] for r in ok if r.get("conf_media")]
    baixa = [r for r in ok if r.get("conf_media") and r["conf_media"] < 75]

    print("\n================ OCR ================")
    print(f"Arquivos            : {len(results)} (erros: {len(err)})")
    print(f"Paginas OCR         : {pgs}")
    print(f"  em branco (0 palavras): {vazias}")
    if confs:
        print(f"Confianca media     : {sum(confs)/len(confs):.1f}%")
        print(f"Arquivos conf < 75% : {len(baixa)}")
        for r in sorted(baixa, key=lambda r: r["conf_media"])[:15]:
            print(f"   {r['conf_media']:5.1f}%  {r['rel_path']}")
    for r in err[:15]:
        print(f"  ERRO {r['rel_path']}: {r['error']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
