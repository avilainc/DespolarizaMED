# -*- coding: utf-8 -*-
"""
Etapa 6 - Validacao da extracao.

Duas coisas, porque "estar correto" precisa ser verificavel:

1. METRICAS agregadas (data/validacao.json)
   - paginas por origem (nativa / OCR / sem texto)
   - distribuicao da confianca do OCR
   - ordem de leitura escolhida por pagina
   - cruzamento prova x gabarito: o gabarito tem tantas respostas quanto a
     prova tem questoes? divergencias viram lista de revisao.

2. AMOSTRA VISUAL (data/validacao.html)
   Pagina renderizada lado a lado com o texto que foi extraido dela, para
   conferencia a olho. A amostra e' estratificada (nativa/OCR, 1 e 2 colunas)
   e deterministica (semente fixa), para dar para repetir a conferencia.

Uso: python scripts/pdf-ingest/06_validate.py [--amostra 24]
"""
from __future__ import annotations

import argparse
import base64
import collections
import html
import json
import random
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import CONTEUDO, DATA, read_json_gz, text_path  # noqa: E402

DOCS = DATA / "documents.jsonl"
OUT_JSON = DATA / "validacao.json"
OUT_HTML = DATA / "validacao.html"


def carregar_docs() -> list[dict]:
    return [json.loads(l) for l in DOCS.open(encoding="utf-8")]


def metricas(docs: list[dict]) -> dict:
    origem = collections.Counter()
    layout = collections.Counter()
    ordem = collections.Counter()
    conf_bins = collections.Counter()
    confs: list[float] = []
    paginas_vazias: list[dict] = []

    for d in docs:
        data = read_json_gz(text_path(d["sha256"]))
        for p in data["pages"]:
            src = p.get("source", "?")
            origem[src] += 1
            layout[p.get("layout") or "?"] += 1
            ordem[p.get("ordem") or "?"] += 1
            if src == "ocr" and p.get("ocr_conf"):
                c = p["ocr_conf"]
                confs.append(c)
                conf_bins[f"{int(c // 10) * 10}-{int(c // 10) * 10 + 9}%"] += 1
            if p.get("chars", 0) < 40:
                paginas_vazias.append(
                    {"rel_path": d["rel_path"], "pagina": p["n"], "source": src}
                )

    confs.sort()

    def pct(q: float):
        return round(confs[int(q * (len(confs) - 1))], 1) if confs else None

    # ------- cruzamento prova x gabarito, por (instituicao, ano, fase) -------
    grupos: dict[tuple, dict] = {}
    for d in docs:
        key = (d.get("instituicao_slug"), d.get("ano"), d.get("fase"))
        g = grupos.setdefault(key, {"provas": [], "gabaritos": []})
        if d["tipo"] in ("prova_objetiva", "prova"):
            g["provas"].append(d)
        elif d["tipo"] == "gabarito":
            g["gabaritos"].append(d)

    divergencias = []
    conferidos = 0
    batem = 0
    for key, g in grupos.items():
        if not g["provas"] or not g["gabaritos"]:
            continue
        # Um grupo (instituicao, ano, fase) pode conter duas coisas diferentes:
        #  - a MESMA prova em varios cadernos (AZUL/AMARELO/BRANCO) -> comparar
        #    o gabarito com o maior arquivo;
        #  - a prova FATIADA por materia (…_BIO.pdf, …_MAT.pdf) -> comparar com
        #    a soma.
        # Nao da para saber qual e' o caso so' pelo nome, entao aceita-se o
        # grupo como consistente se qualquer uma das duas leituras fechar.
        por_prova = [
            max(
                p["sinais"]["n_questoes"],
                p["sinais"]["n_num_inicio"],
                p["sinais"].get("n_blocos_alternativas", 0),
            )
            for p in g["provas"]
        ]
        n_max, n_soma = max(por_prova), sum(por_prova)
        n_r = max(x["sinais"]["n_respostas"] for x in g["gabaritos"])
        if n_max == 0 or n_r == 0:
            continue
        conferidos += 1
        tol = max(2, round(0.10 * n_r))
        if abs(n_max - n_r) <= tol or abs(n_soma - n_r) <= tol:
            batem += 1
        else:
            divergencias.append(
                {
                    "instituicao": key[0],
                    "ano": key[1],
                    "fase": key[2],
                    "questoes_na_prova": n_max,
                    "questoes_somadas": n_soma,
                    "respostas_no_gabarito": n_r,
                    "prova": g["provas"][0]["rel_path"],
                    "gabarito": g["gabaritos"][0]["rel_path"],
                }
            )

    return {
        "documentos": len(docs),
        "paginas_por_origem": dict(origem),
        "paginas_por_layout": dict(layout),
        "ordem_de_leitura": dict(ordem),
        "ocr": {
            "paginas": len(confs),
            "conf_media": round(sum(confs) / len(confs), 1) if confs else None,
            "conf_p10": pct(0.10),
            "conf_mediana": pct(0.50),
            "conf_p90": pct(0.90),
            "faixas": dict(sorted(conf_bins.items())),
        },
        "paginas_com_menos_de_40_chars": len(paginas_vazias),
        "cruzamento_prova_gabarito": {
            "grupos_conferidos": conferidos,
            "consistentes": batem,
            "divergentes": len(divergencias),
            "taxa": round(batem / conferidos * 100, 1) if conferidos else None,
        },
        "divergencias": sorted(
            divergencias,
            key=lambda d: -abs(d["questoes_na_prova"] - d["respostas_no_gabarito"]),
        )[:50],
        "exemplos_paginas_vazias": paginas_vazias[:30],
    }


def amostra_visual(docs: list[dict], n: int) -> list[dict]:
    rnd = random.Random(20260814)
    estratos: dict[tuple, list] = collections.defaultdict(list)
    for d in docs:
        data = read_json_gz(text_path(d["sha256"]))
        for p in data["pages"]:
            if p.get("chars", 0) < 200:
                continue
            estratos[(p.get("source"), p.get("layout"))].append(
                {
                    "rel_path": d["rel_path"],
                    "instituicao": d.get("instituicao"),
                    "ano": d.get("ano"),
                    "tipo": d["tipo"],
                    "n": p["n"],
                    "source": p.get("source"),
                    "layout": p.get("layout"),
                    "ordem": p.get("ordem"),
                    "ocr_conf": p.get("ocr_conf"),
                    "text": p.get("text", ""),
                }
            )

    escolhidos = []
    chaves = sorted(estratos.keys(), key=str)
    i = 0
    while len(escolhidos) < n and any(estratos[k] for k in chaves):
        k = chaves[i % len(chaves)]
        if estratos[k]:
            escolhidos.append(estratos[k].pop(rnd.randrange(len(estratos[k]))))
        i += 1

    for c in escolhidos:
        try:
            with fitz.open(CONTEUDO / c["rel_path"]) as doc:
                page = doc[c["n"] - 1]
                pix = page.get_pixmap(matrix=fitz.Matrix(110 / 72, 110 / 72), alpha=False)
                c["png"] = base64.b64encode(pix.tobytes("png")).decode("ascii")
        except Exception as e:
            c["png"] = None
            c["erro"] = repr(e)
    return escolhidos


def render_html(m: dict, amostra: list[dict]) -> str:
    def linha(k, v):
        return f"<tr><td>{html.escape(str(k))}</td><td class='num'>{html.escape(str(v))}</td></tr>"

    def br(n: int) -> str:
        return f"{n:,}".replace(",", ".")

    origem = "".join(linha(k, br(v)) for k, v in sorted(m["paginas_por_origem"].items()))
    layout = "".join(linha(k, br(v)) for k, v in sorted(m["paginas_por_layout"].items()))
    ordem = "".join(linha(k, br(v)) for k, v in sorted(m["ordem_de_leitura"].items()))
    faixas = "".join(linha(k, br(v)) for k, v in m["ocr"]["faixas"].items())

    divs = "".join(
        f"<tr><td>{html.escape(str(d['instituicao']))}</td><td>{d['ano']}</td>"
        f"<td>{html.escape(str(d['fase'] or '-'))}</td>"
        f"<td class='num'>{d['questoes_na_prova']}</td>"
        f"<td class='num'>{d['respostas_no_gabarito']}</td>"
        f"<td class='path'>{html.escape(d['prova'])}</td></tr>"
        for d in m["divergencias"]
    ) or "<tr><td colspan='6'>Nenhuma divergência.</td></tr>"

    cards = []
    for c in amostra:
        img = (
            f"<img src='data:image/png;base64,{c['png']}' alt='página renderizada'>"
            if c.get("png")
            else f"<div class='erro'>Falha ao renderizar: {html.escape(c.get('erro', ''))}</div>"
        )
        conf = f" · OCR {c['ocr_conf']}%" if c.get("ocr_conf") else ""
        cards.append(
            f"""<section class='par'>
  <h3>{html.escape(c['rel_path'])} <span class='pg'>· p. {c['n']}</span></h3>
  <div class='meta'>{html.escape(str(c['instituicao']))} · {c['ano']} · {html.escape(c['tipo'])}
     · origem: <b>{html.escape(str(c['source']))}</b> · layout: {html.escape(str(c['layout']))}
     · ordem: {html.escape(str(c['ordem']))}{conf}</div>
  <div class='cols'>{img}<pre>{html.escape(c['text'][:6000])}</pre></div>
</section>"""
        )

    cruz = m["cruzamento_prova_gabarito"]
    total_paginas = sum(m["paginas_por_origem"].values())
    return f"""<title>Validação do Acervo</title>
<style>
 :root {{ --bg:#ffffff; --fg:#1a1a1a; --muted:#5c6470; --line:#e3e6ea; --card:#f7f8fa; --accent:#0f766e; }}
 @media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
   --bg:#12141a; --fg:#e8eaed; --muted:#9aa3af; --line:#272b33; --card:#191c23; --accent:#5eead4; }} }}
 :root[data-theme="dark"] {{ --bg:#12141a; --fg:#e8eaed; --muted:#9aa3af; --line:#272b33; --card:#191c23; --accent:#5eead4; }}
 body {{ background:var(--bg); color:var(--fg); font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
        margin:0 auto; padding:32px 20px 80px; max-width:1180px; }}
 h1 {{ font-size:26px; margin:0 0 4px; }} h2 {{ font-size:18px; margin:36px 0 10px; }}
 .sub {{ color:var(--muted); margin-bottom:24px; }}
 .grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:16px; }}
 table {{ border-collapse:collapse; width:100%; font-size:14px; }}
 th,td {{ text-align:left; padding:6px 10px; border-bottom:1px solid var(--line); }}
 td.num {{ text-align:right; font-variant-numeric:tabular-nums; }}
 td.path {{ color:var(--muted); font-size:12px; }}
 .box {{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; }}
 .kpi {{ font-size:30px; font-weight:650; color:var(--accent); font-variant-numeric:tabular-nums; }}
 .kpi small {{ display:block; font-size:13px; font-weight:400; color:var(--muted); }}
 .scroll {{ overflow-x:auto; }}
 .par {{ border:1px solid var(--line); border-radius:10px; padding:14px 16px; margin:18px 0; background:var(--card); }}
 .par h3 {{ font-size:14px; margin:0 0 4px; word-break:break-all; }}
 .pg {{ color:var(--muted); font-weight:400; }}
 .meta {{ color:var(--muted); font-size:12.5px; margin-bottom:10px; }}
 .cols {{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; align-items:start; }}
 @media (max-width:820px) {{ .cols {{ grid-template-columns:1fr; }} }}
 .cols img {{ width:100%; max-width:100%; border:1px solid var(--line); border-radius:6px; background:#fff; }}
 pre {{ white-space:pre-wrap; word-break:break-word; font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;
        background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:10px; margin:0;
        max-height:640px; overflow:auto; }}
 .erro {{ color:#c0392b; }}
</style>
<h1>Validação do acervo de provas</h1>
<div class="sub">{br(m['documentos'])} documentos · conferência da extração de texto (camada nativa e OCR)</div>

<div class="grid">
  <div class="box"><div class="kpi">{br(total_paginas)}<small>páginas processadas</small></div></div>
  <div class="box"><div class="kpi">{m['ocr']['conf_media']}%<small>confiança média do OCR ({br(m['ocr']['paginas'])} págs.)</small></div></div>
  <div class="box"><div class="kpi">{cruz['taxa']}%<small>gabaritos coerentes com a prova ({cruz['consistentes']}/{cruz['grupos_conferidos']})</small></div></div>
  <div class="box"><div class="kpi">{br(m['paginas_com_menos_de_40_chars'])}<small>páginas com quase nenhum texto</small></div></div>
</div>

<h2>Origem do texto</h2>
<div class="scroll"><table><tr><th>origem</th><th>páginas</th></tr>{origem}</table></div>

<h2>Layout detectado e ordem de leitura escolhida</h2>
<div class="grid">
 <div class="scroll"><table><tr><th>layout</th><th>páginas</th></tr>{layout}</table></div>
 <div class="scroll"><table><tr><th>ordem</th><th>páginas</th></tr>{ordem}</table></div>
</div>

<h2>Confiança do OCR</h2>
<div class="scroll"><table><tr><th>faixa</th><th>páginas</th></tr>{faixas}</table></div>
<p class="sub">p10 {m['ocr']['conf_p10']}% · mediana {m['ocr']['conf_mediana']}% · p90 {m['ocr']['conf_p90']}%</p>

<h2>Prova × gabarito ({cruz['divergentes']} divergências)</h2>
<div class="scroll"><table>
<tr><th>instituição</th><th>ano</th><th>fase</th><th>questões</th><th>respostas</th><th>arquivo</th></tr>
{divs}</table></div>

<h2>Amostra visual ({len(amostra)} páginas)</h2>
<p class="sub">Página renderizada à esquerda, texto extraído à direita. Amostra estratificada por origem e layout, com semente fixa — dá para repetir a conferência.</p>
{''.join(cards)}
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--amostra", type=int, default=24)
    args = ap.parse_args()

    docs = carregar_docs()
    print(f"Analisando {len(docs)} documentos...", flush=True)
    m = metricas(docs)
    OUT_JSON.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")

    print("Montando amostra visual...", flush=True)
    amostra = amostra_visual(docs, args.amostra)
    OUT_HTML.write_text(render_html(m, amostra), encoding="utf-8")

    cruz = m["cruzamento_prova_gabarito"]
    print("\n================ VALIDACAO ================")
    print(f"Paginas por origem    : {m['paginas_por_origem']}")
    print(f"Ordem de leitura      : {m['ordem_de_leitura']}")
    print(f"OCR conf media/mediana: {m['ocr']['conf_media']}% / {m['ocr']['conf_mediana']}%")
    print(
        f"Prova x gabarito      : {cruz['consistentes']}/{cruz['grupos_conferidos']} "
        f"consistentes ({cruz['taxa']}%)"
    )
    print(f"Paginas quase vazias  : {m['paginas_com_menos_de_40_chars']}")
    print(f"\n{OUT_JSON}\n{OUT_HTML}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
