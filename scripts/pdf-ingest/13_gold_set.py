# -*- coding: utf-8 -*-
"""
Etapa 13 - Conjunto de referencia (gold set).

Todas as metricas do pipeline ate' aqui sao PROXIES: "90,9% aprovadas" mede
quantas passaram nas minhas proprias regras, nao quantas estao certas. Um proxy
nao detecta uma regressao que agrada as regras — foi o que aconteceu quando a
atribuicao tipografica trocou numeros certos por errados e o proxy nao mudou.

Este script faz duas coisas:

  amostrar  monta uma amostra estratificada e determinista e gera
            data/gold-review.html — a pagina do PDF renderizada ao lado do que
            o pipeline extraiu, com o veredito a preencher.

  medir     compara data/gold.jsonl (vereditos) com a extracao atual e imprime
            acuracia por dimensao: enunciado, alternativas, numero, gabarito.

Uso:
    python scripts/pdf-ingest/13_gold_set.py amostrar --n 40
    python scripts/pdf-ingest/13_gold_set.py medir
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
from pdfx import CONTEUDO, DATA  # noqa: E402

QUESTOES = DATA / "questions_final.jsonl"
GOLD = DATA / "gold.jsonl"
REVIEW = DATA / "gold-review.html"

DIMENSOES = ["enunciado", "alternativas", "numero", "gabarito"]


def carregar() -> list[dict]:
    return [json.loads(l) for l in QUESTOES.open(encoding="utf-8")]


def chave(q: dict) -> str:
    return f"{q['sha256']}#{q['pagina']}#{q['numero']}#{len(q['enunciado'])}"


def amostrar(n: int) -> list[dict]:
    """Amostra estratificada por instituicao e por situacao da questao."""
    questoes = carregar()
    rnd = random.Random(20260815)

    def situacao(q: dict) -> str:
        if q["problemas"]:
            return "com_problema"
        if q.get("gabarito_letra"):
            return "validada"
        return "sem_gabarito"

    # Estratifica em DOIS niveis: primeiro a situacao (para a amostra ter
    # validadas, sem gabarito e com problema em proporcao parecida), depois a
    # instituicao dentro de cada situacao. Percorrer um unico dicionario de
    # (situacao, instituicao) fazia as 40 primeiras cairem todas na mesma
    # situacao, porque ha' dezenas de instituicoes por situacao.
    por_situacao: dict[str, dict[str | None, list[dict]]] = collections.defaultdict(
        lambda: collections.defaultdict(list)
    )
    for q in questoes:
        por_situacao[situacao(q)][q.get("instituicao_slug")].append(q)

    situacoes = sorted(por_situacao)
    escolhidas: list[dict] = []
    cursor = {s: 0 for s in situacoes}
    i = 0
    while len(escolhidas) < n and any(
        any(v for v in por_situacao[s].values()) for s in situacoes
    ):
        s = situacoes[i % len(situacoes)]
        i += 1
        insts = sorted(k for k, v in por_situacao[s].items() if v)
        if not insts:
            continue
        inst = insts[cursor[s] % len(insts)]
        cursor[s] += 1
        balde = por_situacao[s][inst]
        escolhidas.append(balde.pop(rnd.randrange(len(balde))))
    return escolhidas


def render_pagina(rel_path: str, pagina: int, dpi: int = 120) -> str | None:
    try:
        with fitz.open(CONTEUDO / rel_path) as doc:
            p = doc[pagina - 1]
            pix = p.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), alpha=False)
            return base64.b64encode(pix.tobytes("png")).decode("ascii")
    except Exception:
        return None


def gerar_review(amostra: list[dict]) -> str:
    cartoes = []
    for i, q in enumerate(amostra, 1):
        png = render_pagina(q["rel_path"], q["pagina"] or 1)
        img = (
            f"<img src='data:image/png;base64,{png}' alt='pagina'>"
            if png
            else "<div class='erro'>nao foi possivel renderizar</div>"
        )
        alts = "".join(
            f"<li{' class=cert' if a['letra'] == q.get('gabarito_letra') else ''}>"
            f"<b>({html.escape(a['letra'])})</b> {html.escape(a['texto'][:400])}</li>"
            for a in q["alternativas"]
        )
        marcas = []
        if q["problemas"]:
            marcas.append("problemas: " + ", ".join(q["problemas"]))
        if q.get("depende_de_contexto"):
            marcas.append(f"depende de contexto ({q.get('contexto_fonte') or 'sem líder'})")
        if q.get("duplicata_de"):
            marcas.append("duplicata")
        if q.get("confirmada_por_duplicata"):
            marcas.append("confirmada por cópia")
        if q.get("conflito_duplicata"):
            marcas.append("CONFLITO entre cópias")

        cartoes.append(
            f"""<section class='q'>
 <h3>#{i} · {html.escape(q['rel_path'])} <span class='pg'>p.{q['pagina']}</span></h3>
 <div class='meta'>questão {q['numero']} · gabarito <b>{html.escape(str(q.get('gabarito_letra') or '—'))}</b>
   · {html.escape(str(q.get('instituicao')))} {q.get('ano') or ''}
   {(' · ' + html.escape('; '.join(marcas))) if marcas else ''}</div>
 <div class='chave'>{html.escape(chave(q))}</div>
 <div class='cols'>{img}
  <div><div class='enun'>{html.escape(q['enunciado'][:2500])}</div><ol class='alts'>{alts}</ol></div>
 </div>
</section>"""
        )

    modelo = json.dumps(
        {"chave": "<cole a chave acima>", **{d: True for d in DIMENSOES}, "nota": ""},
        ensure_ascii=False,
    )
    return f"""<title>Conjunto de Referência</title>
<style>
 :root {{ --bg:#fff; --fg:#1a1a1a; --muted:#5c6470; --line:#e3e6ea; --card:#f7f8fa; --ac:#0f766e; }}
 @media (prefers-color-scheme: dark) {{ :root:not([data-theme=light]) {{
  --bg:#12141a; --fg:#e8eaed; --muted:#9aa3af; --line:#272b33; --card:#191c23; --ac:#5eead4; }} }}
 :root[data-theme=dark] {{ --bg:#12141a; --fg:#e8eaed; --muted:#9aa3af; --line:#272b33; --card:#191c23; --ac:#5eead4; }}
 body {{ background:var(--bg); color:var(--fg); font:15px/1.55 ui-sans-serif,system-ui,sans-serif;
   max-width:1200px; margin:0 auto; padding:28px 18px 70px; }}
 h1 {{ font-size:24px; margin:0 0 6px; }}
 .sub {{ color:var(--muted); margin-bottom:22px; }}
 .q {{ border:1px solid var(--line); border-radius:10px; background:var(--card); padding:14px 16px; margin:16px 0; }}
 .q h3 {{ font-size:13.5px; margin:0 0 4px; word-break:break-all; }}
 .pg {{ color:var(--muted); font-weight:400; }}
 .meta {{ color:var(--muted); font-size:12.5px; margin-bottom:6px; }}
 .chave {{ font:11px ui-monospace,Consolas,monospace; color:var(--muted); margin-bottom:10px;
   user-select:all; padding:3px 6px; border:1px dashed var(--line); border-radius:5px; display:inline-block; }}
 .cols {{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; align-items:start; }}
 @media (max-width:860px) {{ .cols {{ grid-template-columns:1fr; }} }}
 .cols img {{ width:100%; border:1px solid var(--line); border-radius:6px; background:#fff; }}
 .enun {{ white-space:pre-wrap; font:12.5px/1.5 ui-monospace,Consolas,monospace;
   border:1px solid var(--line); border-radius:6px; padding:9px; background:var(--bg); max-height:340px; overflow:auto; }}
 .alts {{ list-style:none; padding:0; margin:10px 0 0; }}
 .alts li {{ padding:4px 7px; border-left:3px solid transparent; font-size:13px; }}
 .alts li.cert {{ border-left-color:var(--ac); background:color-mix(in srgb, var(--ac) 10%, transparent); }}
 pre.modelo {{ background:var(--card); border:1px solid var(--line); border-radius:6px; padding:10px; overflow:auto; font-size:12px; }}
 .erro {{ color:#c0392b; }}
</style>
<h1>Conjunto de referência</h1>
<div class="sub">{len(amostra)} questões sorteadas com semente fixa. Para cada uma: a página do PDF à esquerda,
o que o pipeline extraiu à direita (a alternativa marcada é a do gabarito).</div>
<p>Confira cada uma e escreva uma linha por questão em <code>data/gold.jsonl</code>, usando <code>false</code>
no que estiver errado:</p>
<pre class="modelo">{html.escape(modelo)}</pre>
<p class="sub">Depois rode <code>python scripts/pdf-ingest/13_gold_set.py medir</code>.</p>
{''.join(cartoes)}
"""


def medir() -> int:
    if not GOLD.exists():
        print(f"Nao existe {GOLD}. Rode 'amostrar' e preencha os vereditos.")
        return 1

    vereditos = {}
    for linha in GOLD.open(encoding="utf-8"):
        linha = linha.strip()
        if not linha or linha.startswith("//"):
            continue
        v = json.loads(linha)
        vereditos[v["chave"]] = v

    atual = {chave(q): q for q in carregar()}
    placar = {d: [0, 0] for d in DIMENSOES}  # [certas, total]
    sumidas = 0

    for k, v in vereditos.items():
        if k not in atual:
            sumidas += 1
            continue
        for d in DIMENSOES:
            if d not in v:
                continue
            placar[d][1] += 1
            if v[d] is True:
                placar[d][0] += 1

    print("================ ACURACIA MEDIDA ================")
    print(f"Vereditos             : {len(vereditos)}")
    if sumidas:
        print(f"  fora da extracao atual: {sumidas} (a questao mudou de chave)")
    for d in DIMENSOES:
        certas, total = placar[d]
        if total:
            print(f"  {d:14s} {certas}/{total} ({certas / total * 100:.1f}%)")
    total_c = sum(p[0] for p in placar.values())
    total_t = sum(p[1] for p in placar.values())
    if total_t:
        print(f"\n  geral          {total_c}/{total_t} ({total_c / total_t * 100:.1f}%)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("acao", choices=["amostrar", "medir"])
    ap.add_argument("--n", type=int, default=40)
    args = ap.parse_args()

    if args.acao == "medir":
        return medir()

    amostra = amostrar(args.n)
    REVIEW.write_text(gerar_review(amostra), encoding="utf-8")
    chaves = DATA / "gold-chaves.txt"
    chaves.write_text("\n".join(chave(q) for q in amostra), encoding="utf-8")
    print(f"{len(amostra)} questoes sorteadas.")
    print(f"  {REVIEW}")
    print(f"  {chaves}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
