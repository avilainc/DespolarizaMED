# -*- coding: utf-8 -*-
"""
Etapa 1 - Inventario do acervo de PDFs (ver ACERVO_DIR).

Percorre toda a arvore, abre cada PDF com PyMuPDF e registra:
  - taxonomia (categoria / instituicao / ano / subpasta)
  - hash sha256 (deteccao de duplicatas)
  - numero de paginas, presenca de camada de texto por pagina
  - se precisa de OCR (paginas sem texto extraivel)
  - tipo do documento inferido do nome do arquivo

Saida: data/pdf-inventory.jsonl  (1 linha JSON por arquivo)
Nada e' inferido "na marra": campos que nao puderem ser determinados ficam null
e sao contabilizados no relatorio final.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import unicodedata
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
# O acervo de PDFs vive FORA do repositorio (nao e' versionado nem regeneravel
# a partir dele). O caminho e' configuravel por ACERVO_DIR para a maquina que
# roda o pipeline apontar para onde os PDFs realmente estao.
CONTEUDO = Path(os.environ.get("ACERVO_DIR", r"D:/projetos/conteudo"))
OUT_DIR = ROOT / "data"
OUT_FILE = OUT_DIR / "pdf-inventory.jsonl"

# Uma pagina com menos que isso de texto e' tratada como "sem camada de texto"
# (cabecalho/rodape solto num scan gera 20-60 chars de lixo).
MIN_CHARS_PER_PAGE = 120

YEAR_RE = re.compile(r"^(19|20)\d{2}")


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def norm(s: str) -> str:
    return strip_accents(s).lower()


def classify_doc(filename: str, folders: list[str]) -> tuple[str, dict]:
    """Infere o tipo de documento a partir do nome do arquivo + pastas.

    Retorna (tipo, flags). tipo in:
      gabarito | prova_objetiva | prova_discursiva | prova | redacao |
      criterios_redacao | resultado | edital | desconhecido
    """
    n = norm(filename)
    ctx = norm(" / ".join(folders))
    both = n + " || " + ctx

    flags = {
        "mentions_gabarito": bool(re.search(r"gabarit|chave de respostas|respostas oficiais", n)),
        "mentions_redacao": bool(re.search(r"redac|proposta de texto", both)),
        "mentions_criterios": bool(re.search(r"criteri|grade de correc|espelho", n)),
        "mentions_discursiva": bool(re.search(r"discursiv|dissertativ|2\s*[ao]?\s*fase|segunda fase", both)),
        "mentions_objetiva": bool(re.search(r"objetiv|multipla escolha|1\s*[ao]?\s*fase|primeira fase", both)),
        "mentions_resolucao": bool(re.search(r"resoluc|comentad|resolvid", n)),
    }

    if flags["mentions_criterios"]:
        return "criterios_redacao", flags
    if flags["mentions_gabarito"]:
        return "gabarito", flags
    if re.search(r"\bedital\b|manual do candidat", n):
        return "edital", flags
    if re.search(r"resultado|classificad|convocac|aprovad", n):
        return "resultado", flags
    if flags["mentions_redacao"] and not flags["mentions_objetiva"]:
        return "redacao", flags
    if flags["mentions_discursiva"]:
        return "prova_discursiva", flags
    if flags["mentions_objetiva"]:
        return "prova_objetiva", flags
    if re.search(r"\bprova\b|vestibul|\bfase\b|\bdia\b", both):
        return "prova", flags
    return "desconhecido", flags


def parse_taxonomy(rel_parts: list[str]) -> dict:
    """rel_parts = partes do caminho relativo a raiz do acervo, com o arquivo."""
    folders = rel_parts[:-1]
    filename = rel_parts[-1]

    categoria = folders[0] if len(folders) > 0 else None  # Privadas | Publicas
    instituicao = folders[1] if len(folders) > 1 else None

    ano = None
    ano_idx = None
    for i, part in enumerate(folders):
        m = YEAR_RE.match(part.strip())
        if m:
            ano = int(m.group(0))
            ano_idx = i
            break

    # Se nao houver pasta de ano, tenta o nome do arquivo (ex.: "ENEM 2019 dia 1.pdf")
    ano_fonte = "pasta" if ano else None
    if ano is None:
        m = re.search(r"\b(19[89]\d|20[0-3]\d)\b", filename)
        if m:
            ano = int(m.group(1))
            ano_fonte = "arquivo"

    subpasta = folders[ano_idx + 1:] if ano_idx is not None else folders[2:]

    return {
        "categoria": categoria,
        "instituicao": instituicao,
        "ano": ano,
        "ano_fonte": ano_fonte,
        "subpasta": subpasta,
        "filename": filename,
    }


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def inspect(path_str: str) -> dict:
    path = Path(path_str)
    rel = path.relative_to(CONTEUDO)
    rel_parts = list(rel.parts)
    rec: dict = {
        "rel_path": rel.as_posix(),
        "size_bytes": path.stat().st_size,
    }
    rec.update(parse_taxonomy(rel_parts))
    tipo, flags = classify_doc(rec["filename"], rel_parts[:-1])
    rec["tipo"] = tipo
    rec["flags"] = flags

    try:
        rec["sha256"] = sha256_of(path)
    except Exception as e:  # pragma: no cover
        rec["sha256"] = None
        rec["error"] = f"hash: {e!r}"

    try:
        with fitz.open(path) as doc:
            rec["encrypted"] = bool(doc.is_encrypted)
            if doc.is_encrypted and not doc.authenticate(""):
                rec["pages"] = None
                rec["error"] = "encrypted: senha necessaria"
                return rec

            pages = doc.page_count
            rec["pages"] = pages
            rec["pdf_metadata"] = {
                k: v for k, v in (doc.metadata or {}).items()
                if k in ("title", "author", "producer", "creator", "creationDate") and v
            }

            chars_per_page: list[int] = []
            imgs_per_page: list[int] = []
            drawings_hint = 0
            for page in doc:
                txt = page.get_text("text") or ""
                chars_per_page.append(len(txt.strip()))
                try:
                    imgs_per_page.append(len(page.get_images(full=True)))
                except Exception:
                    imgs_per_page.append(0)
            rec["chars_total"] = sum(chars_per_page)
            rec["chars_per_page"] = chars_per_page
            rec["images_total"] = sum(imgs_per_page)
            rec["pages_sem_texto"] = sum(1 for c in chars_per_page if c < MIN_CHARS_PER_PAGE)
            rec["precisa_ocr"] = rec["pages_sem_texto"] > 0
            rec["ocr_total"] = rec["pages_sem_texto"] == pages and pages > 0
            rec["drawings_hint"] = drawings_hint
    except Exception as e:
        rec["pages"] = None
        rec["error"] = f"open: {e!r}"

    return rec


def main() -> int:
    if not CONTEUDO.is_dir():
        print(f"Pasta nao encontrada: {CONTEUDO}", file=sys.stderr)
        return 1

    pdfs = [p for p in CONTEUDO.rglob("*") if p.is_file() and p.suffix.lower() == ".pdf"]
    pdfs.sort()
    print(f"{len(pdfs)} PDFs encontrados. Inspecionando...", flush=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    workers = max(2, min(8, (os.cpu_count() or 4)))
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(inspect, str(p)): p for p in pdfs}
        done = 0
        for fut in as_completed(futs):
            try:
                records.append(fut.result())
            except Exception as e:
                records.append({"rel_path": str(futs[fut]), "error": f"worker: {e!r}"})
            done += 1
            if done % 100 == 0:
                print(f"  {done}/{len(pdfs)}", flush=True)

    records.sort(key=lambda r: r.get("rel_path", ""))
    with OUT_FILE.open("w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # -------- relatorio --------
    ok = [r for r in records if not r.get("error")]
    err = [r for r in records if r.get("error")]
    total_pages = sum(r.get("pages") or 0 for r in ok)
    ocr_parcial = [r for r in ok if r.get("precisa_ocr")]
    ocr_total = [r for r in ok if r.get("ocr_total")]
    pages_ocr = sum(r.get("pages_sem_texto") or 0 for r in ok)

    by_hash: dict[str, list[str]] = {}
    for r in ok:
        if r.get("sha256"):
            by_hash.setdefault(r["sha256"], []).append(r["rel_path"])
    dups = {h: v for h, v in by_hash.items() if len(v) > 1}

    tipos: dict[str, int] = {}
    for r in records:
        tipos[r.get("tipo", "?")] = tipos.get(r.get("tipo", "?"), 0) + 1

    sem_ano = [r for r in records if not r.get("ano")]

    print("\n================ INVENTARIO ================")
    print(f"PDFs                : {len(records)}")
    print(f"  abertos com ok    : {len(ok)}")
    print(f"  com erro          : {len(err)}")
    print(f"Paginas totais      : {total_pages}")
    print(f"Arquivos c/ OCR     : {len(ocr_parcial)} (destes, {len(ocr_total)} 100% escaneados)")
    print(f"Paginas p/ OCR      : {pages_ocr} ({(pages_ocr / total_pages * 100) if total_pages else 0:.1f}%)")
    print(f"Duplicatas (sha256) : {len(dups)} grupos, {sum(len(v) for v in dups.values())} arquivos")
    print(f"Sem ano identificado: {len(sem_ano)}")
    print("\nTipos de documento:")
    for t, c in sorted(tipos.items(), key=lambda kv: -kv[1]):
        print(f"  {t:22s} {c}")
    if err:
        print("\nErros:")
        for r in err[:20]:
            print(f"  {r['rel_path']} -> {r['error']}")
        if len(err) > 20:
            print(f"  ... +{len(err) - 20}")
    print(f"\nEscrito em: {OUT_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
