# -*- coding: utf-8 -*-
"""
Etapa 17 - Geracao das listas de exercicio no modelo da DespolarizaMED.

Monta um PDF de lista a partir do banco de questoes, usando o modelo enviado
(`assets/modelo-lista.pdf`) como FUNDO de cada pagina. Desenhar por cima do
modelo, em vez de recriar o layout, garante que marca d'agua, regua, logo e
rodape fiquem identicos ao original — e que uma futura troca do modelo nao
exija mexer neste script.

So' entram questoes de multipla escolha VALIDADAS e nao duplicadas: extracao
sem defeito, gabarito confirmado contra as alternativas lidas e nenhuma copia
da mesma questao apontando resposta diferente.

Uso:
    python scripts/pdf-ingest/17_gerar_lista.py --titulo "Cinemática" \
        --disciplina FISICA --banca vunesp --ano-min 2020 --n 10
"""
from __future__ import annotations

import argparse
import collections
import html
import json
import re
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, norm  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MODELO = ROOT / "assets" / "modelo-lista.pdf"
QUESTOES = DATA / "questions_final.jsonl"
DISCIPLINAS = DATA / "subjects.jsonl"
TEMAS = DATA / "topics.jsonl"
DOCUMENTOS = DATA / "documents.jsonl"
FIGURAS = DATA / "figures.jsonl"
SAIDA_PADRAO = DATA / "listas"

# ---- geometria do modelo (medida no proprio PDF) ----
TITULO_POS = fitz.Point(17, 33)          # linha de base do "assunto"
TITULO_TAM = 23
TITULO_AREA = fitz.Rect(14, 6, 525, 40)  # sem invadir os circulos do logo (x>=531)
AREA = fitz.Rect(40, 58, 556, 800)       # area util entre a regua e o rodape
CALHA = 18                                # espaco entre as duas colunas
LARGURA_COLUNA = (AREA.width - CALHA) / 2
COLUNAS = [
    fitz.Rect(AREA.x0, AREA.y0, AREA.x0 + LARGURA_COLUNA, AREA.y1),
    fitz.Rect(AREA.x1 - LARGURA_COLUNA, AREA.y0, AREA.x1, AREA.y1),
]
ESPACO_ENTRE = 14
LARGURA_FIGURA_MAX = LARGURA_COLUNA * 0.95
ALTURA_FIGURA_MAX = 200

CSS = """
* { font-family: sans-serif; text-align: justify; }
.cab { font-size: 9.5pt; color: #5c6470; margin: 0 0 3pt 0; text-align: left; }
.enun { font-size: 10.5pt; line-height: 1.35; margin: 0; }
.enun p { margin: 0 0 3pt 0; }
.apoio { font-size: 9.5pt; line-height: 1.3; margin: 0 0 5pt 0; padding: 0 0 0 7pt;
         border-left: 2pt solid #c8ccd2; color: #333333; }
.alts { font-size: 10.5pt; line-height: 1.3; margin: 5pt 0 0 0; }
.alt { margin: 0 0 1.5pt 0; }
.letra { font-weight: bold; }
"""


def carregar_questoes() -> list[dict]:
    """Questoes com todas as tags ja' anexadas: banca, disciplina e tema.

    A classificacao acontece uma vez, no pipeline; aqui so' se le. Antes a
    banca era redescoberta a cada geracao, procurando o codigo da grafica —
    e o mesmo filtro dava contagens diferentes em lugares diferentes.
    """
    qs = [json.loads(l) for l in QUESTOES.open(encoding="utf-8") if l.strip()]

    disc: dict[tuple, dict] = {}
    if DISCIPLINAS.exists():
        for l in DISCIPLINAS.open(encoding="utf-8"):
            if l.strip():
                s = json.loads(l)
                disc[(s["sha256"], s["numero"], s["pagina"])] = s

    temas: dict[tuple, dict] = {}
    if TEMAS.exists():
        for l in TEMAS.open(encoding="utf-8"):
            if l.strip():
                t = json.loads(l)
                temas[(t["sha256"], t["numero"], t["pagina"])] = t

    bancas: dict[str, str | None] = {}
    if DOCUMENTOS.exists():
        for l in DOCUMENTOS.open(encoding="utf-8"):
            if l.strip():
                d = json.loads(l)
                bancas[d["sha256"]] = d.get("banca")

    for q in qs:
        chave = (q["sha256"], q["numero"], q["pagina"])
        d = disc.get(chave)
        t = temas.get(chave)
        # o texto de apoio vem extraido da propria pagina (etapa 07), nao mais
        # copiado do enunciado de outra questao
        q["_contexto"] = q.get("contexto_texto")
        q["disciplina"] = d["disciplina"] if d else None
        q["disciplina_pontos"] = d["pontos"] if d else 0.0
        q["disciplina_fonte"] = d["fonte"] if d else None
        q["tema"] = t["tema"] if t else None
        q["tema_pontos"] = t["pontos"] if t else 0.0
        q["banca"] = bancas.get(q["sha256"])
    return qs


def carregar_figuras() -> dict[tuple, list[dict]]:
    """(sha256, numero_da_questao) -> figuras daquela questao."""
    mapa: dict[tuple, list[dict]] = collections.defaultdict(list)
    if not FIGURAS.exists():
        return mapa
    for l in FIGURAS.open(encoding="utf-8"):
        if not l.strip():
            continue
        doc = json.loads(l)
        for f in doc.get("figuras") or []:
            if f.get("numero_questao") is not None:
                mapa[(doc["sha256"], f["numero_questao"])].append(f)
    return mapa


def e_vunesp(rel_path: str) -> bool:
    """A VUNESP nao se declara num campo; identifica-se pelas marcas impressas."""
    return bool(re.search(r"vunesp", norm(rel_path)))


def filtrar(qs: list[dict], args) -> list[dict]:
    com_figura = {
        (doc["sha256"], f["numero_questao"])
        for doc in (
            json.loads(l) for l in FIGURAS.open(encoding="utf-8") if l.strip()
        )
        for f in (doc.get("figuras") or [])
        if f.get("numero_questao") is not None
    } if FIGURAS.exists() else set()

    out = []
    for q in qs:
        if q["problemas"] or not q.get("gabarito_letra") or q.get("duplicata_de"):
            continue
        if q.get("conflito_duplicata"):
            continue
        if len(q["alternativas"]) < 4:
            continue
        # Questao que depende de apoio que nao foi localizado nao tem resposta
        # possivel impressa: fica de fora. Mas o apoio pode ser a FIGURA — quem
        # diz "de acordo com o grafico" e tem o grafico anexado esta' completa.
        if (
            q.get("depende_de_contexto")
            and not q.get("_contexto")
            and (q["sha256"], q["numero"]) not in com_figura
        ):
            continue
        if args.disciplina and q.get("disciplina") != args.disciplina.upper():
            continue
        # A disciplina e' sugerida, nao declarada. Numa amostra de 36 questoes
        # ela acertou 86% — o erro tipico e' questao de "conhecimentos gerais"
        # caindo na materia errada. Exigir uma pontuacao minima corta o caso
        # duvidoso, ao custo de deixar questoes de fora do caderno.
        if args.min_disciplina and q.get("disciplina_pontos", 0) < args.min_disciplina:
            continue
        if args.instituicao and norm(args.instituicao) not in norm(q["instituicao_slug"] or ""):
            continue
        if args.ano_min and (q.get("ano") or 0) < args.ano_min:
            continue
        if args.ano_max and (q.get("ano") or 9999) > args.ano_max:
            continue
        # a banca e' tag do documento, decidida na etapa 04 — nao se redescobre aqui
        if args.banca and (q.get("banca") or "").upper() != args.banca.upper():
            continue
        if args.tema and (q.get("tema") or "") != args.tema:
            continue
        out.append(q)

    out.sort(key=lambda q: (-(q.get("ano") or 0), q["instituicao_slug"] or "", q["numero"] or 0))
    return out


# Uma linha da prova original tem ~55 caracteres (coluna estreita). Abaixo
# disso, a quebra provavelmente e' intencional: verso de poema, item de lista,
# celula de tabela.
LARGURA_LINHA_ORIGINAL = 45


def refluir(texto: str) -> list[str]:
    """Desfaz as quebras de linha da diagramacao original, virando paragrafos.

    O enunciado vem do PDF com uma quebra por linha impressa, feita para uma
    coluna de ~55 caracteres. Repetir essas quebras numa lista de largura
    diferente desperdica metade da linha e deixa o texto picotado. Aqui elas
    viram texto corrido — menos quando a linha e' curta demais para ter sido
    quebra de diagramacao, caso em que ela e' preservada.
    """
    paragrafos: list[str] = []
    atual = ""
    for linha in texto.split("\n"):
        s = linha.strip()
        if not s:
            if atual:
                paragrafos.append(atual)
                atual = ""
            continue
        if not atual:
            atual = s
        elif len(atual) >= LARGURA_LINHA_ORIGINAL:
            if atual.endswith("-") and s[:1].islower():
                atual = atual[:-1] + s  # palavra hifenizada na quebra
            else:
                atual = f"{atual} {s}"
        else:
            paragrafos.append(atual)
            atual = s
    if atual:
        paragrafos.append(atual)
    return paragrafos


def html_do_enunciado(q: dict, ordem: int, contexto: str | None = None) -> str:
    inst = (q.get("instituicao") or q.get("instituicao_slug") or "").upper()
    ano = q.get("ano") or ""
    fase = f" · {q['fase']}" if q.get("fase") else ""
    cab = f"{ordem}. ({html.escape(inst)} {ano}{html.escape(fase)})"

    # o numero original da questao ja' vem no comeco do enunciado; sai fora
    bruto = re.sub(
        r"^\s*(?:QUEST[ÃA]O\s*)?\d{1,3}[\s.):–-]*", "", q["enunciado"], count=1, flags=re.I
    )
    enun = "".join(f"<p>{html.escape(p)}</p>" for p in refluir(bruto))

    # Questao que referencia um texto de apoio ("de acordo com o grafico", "a
    # partir das informacoes apresentadas") nao se responde sozinha. O apoio
    # mora no enunciado de outra questao da mesma prova; sem ele impresso
    # junto, a questao entra no caderno sem ter resposta possivel.
    apoio = ""
    if contexto:
        texto = html.escape(contexto)
        texto = re.sub(r"^\s*(?:QUEST[ÃA]O\s*)?\d{1,3}[\s.):–-]*", "", texto, count=1, flags=re.I)
        apoio = f'<div class="apoio">{texto.replace(chr(10), "<br/>")}</div>'

    return f'<div class="cab">{cab}</div>{apoio}<div class="enun">{enun}</div>'


def html_do_apoio(contexto: str) -> str:
    """O texto de apoio como bloco proprio, impresso uma vez antes do grupo."""
    texto = html.escape(contexto)
    texto = re.sub(r"^\s*(?:QUEST[ÃA]O\s*)?\d{1,3}[\s.):–-]*", "", texto, count=1, flags=re.I)
    return f'<div class="apoio">{texto.replace(chr(10), "<br/>")}</div>'


def html_das_alternativas(q: dict) -> str:
    alts = "".join(
        f'<div class="alt"><span class="letra">({html.escape(a["letra"])})</span> '
        f'{html.escape(a["texto"]).replace(chr(10), " ")}</div>'
        for a in q["alternativas"]
    )
    return f'<div class="alts">{alts}</div>'


def medir(doc_scratch: fitz.Document, corpo: str, largura: float) -> float:
    """Altura que o bloco ocupa, medida sem escrever na pagina final."""
    pagina = doc_scratch.new_page(width=largura + 20, height=3000)
    caixa = fitz.Rect(0, 0, largura, 2950)
    sobra, _ = pagina.insert_htmlbox(caixa, corpo, css=CSS)
    doc_scratch.delete_page(-1)
    if sobra < 0:
        return 2950.0
    return 2950.0 - sobra


def fonte_serve(caminho: Path | None, texto: str) -> bool:
    """A DynaPuff embutida no modelo e' um SUBSET: so' traz os glifos de
    "assunto" e "@despolarizamed". Serve para um titulo qualquer? Depende das
    letras. Usar assim mesmo imprimiria caixas vazias no cabecalho."""
    if not caminho or not caminho.exists():
        return False
    try:
        f = fitz.Font(fontfile=str(caminho))
    except Exception:
        return False
    return all(f.has_glyph(ord(c)) for c in texto if not c.isspace())


class Lista:
    def __init__(self, titulo: str, modelo: fitz.Document, fonte_titulo: Path | None):
        self.titulo = titulo
        self.modelo = modelo
        self.fonte_titulo = fonte_titulo if fonte_serve(fonte_titulo, titulo) else None
        if fonte_titulo and self.fonte_titulo is None:
            faltando = "".join(
                sorted({c for c in titulo if not c.isspace()})
            )
            print(
                "AVISO: a DynaPuff embutida no modelo e' um subset e nao cobre "
                f"'{faltando}'. O titulo sai em Helvetica Bold. Para o cabecalho "
                "ficar igual ao modelo, coloque a fonte completa em "
                "assets/DynaPuff-Regular.ttf.",
                file=sys.stderr,
            )
        self.doc = fitz.open()
        self.pagina: fitz.Page | None = None
        self.coluna = 0
        self.y = AREA.y0
        # texto de apoio ja' impresso nesta pagina: um texto serve a um grupo
        # de questoes e nao precisa aparecer uma vez por questao
        self.contexto_impresso: str | None = None

    @property
    def caixa_coluna(self) -> fitz.Rect:
        return COLUNAS[self.coluna]

    def nova_pagina(self) -> None:
        p = self.doc.new_page(width=self.modelo[0].rect.width, height=self.modelo[0].rect.height)
        p.show_pdf_page(p.rect, self.modelo, 0)
        # o modelo traz "assunto" como marcador; cobre e escreve o assunto real
        p.draw_rect(TITULO_AREA, color=None, fill=(1, 1, 1))
        if self.fonte_titulo:
            p.insert_font(fontname="dyna", fontfile=str(self.fonte_titulo))
            p.insert_text(TITULO_POS, self.titulo, fontname="dyna", fontsize=TITULO_TAM)
        else:
            p.insert_text(TITULO_POS, self.titulo, fontname="hebo", fontsize=TITULO_TAM - 2)
        self.pagina = p
        self.coluna = 0
        self.y = AREA.y0
        # pagina nova: o texto de apoio precisa reaparecer, senao a questao
        # fica orfa do texto que ficou na pagina anterior
        self.contexto_impresso = None

    def cabe(self, altura: float) -> bool:
        return self.pagina is not None and self.y + altura <= AREA.y1

    def abrir_espaco(self, altura: float) -> None:
        """Garante espaco continuo: proxima coluna, senao proxima pagina.

        Uma questao nunca e' partida entre colunas ou paginas — enunciado,
        figura e alternativas ficam juntos.
        """
        if self.cabe(altura):
            return
        if self.pagina is not None and self.coluna == 0:
            self.coluna = 1
            self.y = AREA.y0
            if self.cabe(altura):
                return
        self.nova_pagina()

    def escrever(
        self, corpo: str, altura: float, espaco: float = ESPACO_ENTRE, largo: bool = False
    ) -> None:
        if self.pagina is None:
            self.nova_pagina()
        col = AREA if largo else self.caixa_coluna
        fim = min(self.y + altura + 4, AREA.y1)
        # Caixa degenerada trava o PyMuPDF: sem altura util ele tenta escalar o
        # texto para caber e estoura em OverflowError. Preferivel pular a
        # escrita a produzir uma pagina quebrada.
        if fim - self.y < 8:
            return
        caixa = fitz.Rect(col.x0, self.y, col.x1, fim)
        self.pagina.insert_htmlbox(caixa, corpo, css=CSS)
        self.y = caixa.y1 + espaco

    def pagina_larga(self) -> None:
        """Abre uma pagina limpa para uma questao que ocupa a largura toda.

        Questao com texto de apoio longo — as de ingles, sobretudo — nao cabe
        numa coluna e era simplesmente descartada. Numa pagina de largura
        inteira ela cabe, e o aluno le' o texto seguido.
        """
        # Reaproveita a pagina atual se ela ainda estiver limpa — criar outra
        # deixava uma pagina em branco toda vez que a primeira questao do
        # caderno precisava da largura inteira.
        if self.pagina is None or self.coluna != 0 or self.y > AREA.y0 + 1:
            self.nova_pagina()
        self.coluna = 1  # marca a pagina como consumida: nada mais entra nela

    def figura(self, caminho: Path) -> bool:
        tam = dimensoes_da_figura(caminho)
        if tam is None:
            return False
        lw, lh = tam
        if not self.cabe(lh + 8):
            return False
        col = self.caixa_coluna
        x0 = col.x0 + (col.width - lw) / 2
        self.pagina.insert_image(fitz.Rect(x0, self.y, x0 + lw, self.y + lh), filename=str(caminho))
        self.y += lh + 8
        return True


def dimensoes_da_figura(caminho: Path) -> tuple[float, float] | None:
    """Tamanho ja' reduzido para caber na coluna, ou None se nao abrir."""
    try:
        pix = fitz.Pixmap(str(caminho))
        w, h = float(pix.width), float(pix.height)
    except Exception:
        return None
    if not w or not h:
        return None
    escala = min(LARGURA_FIGURA_MAX / w, ALTURA_FIGURA_MAX / h, 1.0)
    return w * escala, h * escala


NOME_MATERIA = {
    "BIOLOGIA": "Biologia",
    "QUIMICA": "Química",
    "FISICA": "Física",
    "MATEMATICA": "Matemática",
    "PORTUGUES": "Português",
    "HISTORIA": "História",
    "GEOGRAFIA": "Geografia",
    "INGLES": "Inglês",
    "FILOSOFIA_SOCIOLOGIA": "Filosofia e Sociologia",
}


def montar(qs: list[dict], titulo: str, figuras: dict, destino: Path, com_gabarito: bool) -> tuple[int, int]:
    """Escreve um PDF com as questoes dadas. Devolve (questoes, paginas)."""
    modelo = fitz.open(MODELO)
    lista = Lista(titulo, modelo, ROOT / "assets" / "DynaPuff-Regular.ttf")
    lista.nova_pagina()
    scratch = fitz.open()

    usadas = []
    for i, q in enumerate(qs, 1):
        # O texto de apoio serve a um GRUPO de questoes. Reimprimi-lo a cada
        # uma inflou o caderno de Ingles de 195 para 552 paginas, com o mesmo
        # texto repetido dez vezes. Sai uma vez por pagina; pagina nova o
        # reimprime, para a questao nunca ficar orfa do texto.
        # O texto de apoio vai como BLOCO PROPRIO, uma vez, e as questoes do
        # grupo fluem embaixo dele. Grudado no enunciado de cada questao, ele
        # forcava uma pagina por questao: o caderno de Ingles ficou com 432
        # paginas para 707 questoes, com o mesmo texto repetido pagina apos
        # pagina.
        contexto = q.get("_contexto")
        if contexto and contexto != lista.contexto_impresso:
            bloco = html_do_apoio(contexto)
            h_ctx = medir(scratch, bloco, LARGURA_COLUNA)
            if h_ctx <= AREA.height * 0.8:
                lista.abrir_espaco(min(h_ctx + 80, AREA.height))
                lista.escrever(bloco, h_ctx, espaco=6)
                lista.contexto_impresso = contexto

        repetido = contexto is not None and contexto == lista.contexto_impresso
        enunciado = html_do_enunciado(q, i, None if repetido else contexto)
        alternativas = html_das_alternativas(q)
        h_enun = medir(scratch, enunciado, LARGURA_COLUNA)
        h_alts = medir(scratch, alternativas, LARGURA_COLUNA)

        caminho_fig = None
        h_fig = 0.0
        for f in figuras.get((q["sha256"], q["numero"]), [])[:1]:
            c = DATA / f["arquivo"]
            tam = dimensoes_da_figura(c) if c.exists() else None
            if tam:
                caminho_fig, h_fig = c, tam[1] + 8

        total = h_enun + h_fig + h_alts + 6
        if total <= AREA.height:
            antes = lista.pagina
            lista.abrir_espaco(total)
            if lista.pagina is not antes and repetido:
                # mudou de pagina: o texto de apoio ficou para tras, reimprime
                enunciado = html_do_enunciado(q, i, contexto)
                h_enun = medir(scratch, enunciado, LARGURA_COLUNA)
                novo_total = h_enun + h_fig + h_alts + 6
                if novo_total > AREA.height:
                    continue  # com o apoio nao cabe mais na coluna
                lista.abrir_espaco(novo_total)
            lista.escrever(enunciado, h_enun, espaco=4)
            if caminho_fig:
                lista.figura(caminho_fig)
            lista.escrever(alternativas, h_alts)
            if contexto:
                lista.contexto_impresso = contexto
            usadas.append(q)
            continue

        # Nao coube numa coluna: tenta a pagina inteira. Questao com texto de
        # apoio longo (as de ingles, principalmente) era descartada aqui — o
        # caderno de Ingles saiu com 1 questao de 4 pedidas.
        hl_enun = medir(scratch, enunciado, AREA.width)
        hl_alts = medir(scratch, alternativas, AREA.width)
        if hl_enun + h_fig + hl_alts + 6 > AREA.height:
            continue
        lista.pagina_larga()
        if repetido:  # pagina nova: o apoio precisa reaparecer
            enunciado = html_do_enunciado(q, i, contexto)
            hl_enun = medir(scratch, enunciado, AREA.width)
            if hl_enun + h_fig + hl_alts + 6 > AREA.height:
                continue
        lista.escrever(enunciado, hl_enun, espaco=4, largo=True)
        if caminho_fig:
            lista.figura(caminho_fig)
        lista.escrever(alternativas, hl_alts, largo=True)
        if contexto:
            lista.contexto_impresso = contexto
        usadas.append(q)

    if com_gabarito and usadas:
        lista.nova_pagina()
        # O gabarito precisa FLUIR entre colunas e paginas como as questoes.
        # Jogar tudo numa caixa so' fazia o insert_htmlbox encolher o texto ate'
        # ficar ilegivel: num caderno de 676 questoes, a pagina saia com dois
        # tracinhos verticais no lugar das respostas.
        POR_BLOCO = 30
        titulo_gab = '<div class="cab">GABARITO</div>'
        for inicio in range(0, len(usadas), POR_BLOCO):
            bloco = usadas[inicio : inicio + POR_BLOCO]
            pares = "".join(
                f'<div class="alt"><span class="letra">{inicio + k + 1}.</span> '
                f'{q["gabarito_letra"]} '
                f'<span style="color:#5c6470">{html.escape((q.get("instituicao") or "").upper())} '
                f'{q.get("ano") or ""}</span></div>'
                for k, q in enumerate(bloco)
            )
            corpo = (titulo_gab if inicio == 0 else "") + f'<div class="alts">{pares}</div>'
            altura = medir(scratch, corpo, LARGURA_COLUNA)
            lista.abrir_espaco(altura)
            lista.escrever(corpo, altura, espaco=6)

    destino.parent.mkdir(parents=True, exist_ok=True)
    lista.doc.save(destino, garbage=4, deflate=True)
    paginas = lista.doc.page_count
    scratch.close()
    modelo.close()
    lista.doc.close()
    return len(usadas), paginas


def gerar_cadernos(args, por: str = "materia") -> int:
    """Um caderno por materia (ou por tema), com as questoes utilizaveis.

    Agrupar aqui e' so' uma consulta sobre tags que ja' estao gravadas na
    questao — nada e' reclassificado na hora de gerar.
    """
    qs = filtrar(carregar_questoes(), args)
    figuras = {} if args.sem_figuras else carregar_figuras()

    grupos: dict[str, list[dict]] = collections.defaultdict(list)
    for q in qs:
        if por == "tema":
            if q.get("disciplina") and q.get("tema"):
                grupos[f"{q['disciplina']}|{q['tema']}"].append(q)
        elif q.get("disciplina"):
            grupos[q["disciplina"]].append(q)

    if not grupos:
        print(f"Nenhuma questao com {por} identificado nos filtros.", file=sys.stderr)
        return 1

    minimo = 8 if por == "tema" else 1
    destino_base = Path(args.saida) if args.saida else SAIDA_PADRAO / f"cadernos-por-{por}"
    print(f"================ CADERNOS POR {por.upper()} ================")
    total_q = 0
    gerados = 0
    for chave, lista_q in sorted(grupos.items(), key=lambda kv: -len(kv[1])):
        if len(lista_q) < minimo:
            continue
        if por == "tema":
            disciplina, tema = chave.split("|", 1)
            nome = f"{NOME_MATERIA.get(disciplina, disciplina.title())} · {tema}"
        else:
            nome = NOME_MATERIA.get(chave, chave.title())
        limite = args.n if args.n > 0 else len(lista_q)
        selecao = lista_q[:limite]
        arquivo = destino_base / f"caderno-{re.sub(r'[^a-z0-9]+', '-', norm(nome)).strip('-')}.pdf"
        n, pags = montar(selecao, nome, figuras, arquivo, not args.sem_gabarito)
        total_q += n
        gerados += 1
        anos = collections.Counter(q.get("ano") for q in selecao)
        faixa = f"{min(anos)}-{max(anos)}" if anos else "-"
        print(f"  {nome[:38]:40s} {n:>5} questoes | {pags:>3} pag | {faixa}")
    print(f"\nTotal: {total_q} questoes em {gerados} cadernos")
    print(f"Pasta: {destino_base}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--titulo", required=True, help="texto do cabecalho (o 'assunto')")
    ap.add_argument("--disciplina", default="", help="BIOLOGIA, FISICA, QUIMICA...")
    ap.add_argument("--instituicao", default="")
    ap.add_argument("--banca", default="", help="VUNESP, INEP, FUVEST, COMVEST, FGV...")
    ap.add_argument("--tema", default="", help="tema exato, ex.: 'Genética'")
    ap.add_argument("--por-tema", action="store_true", help="um caderno por tema")
    ap.add_argument("--ano-min", type=int, default=0)
    ap.add_argument("--ano-max", type=int, default=0)
    ap.add_argument("--n", type=int, default=10)
    # Medido: exigir 3.0 corta o caderno pela metade (4.735 -> 2.489 questoes) e
    # a acuracia da disciplina sobe so' de 86% para 87,5% numa amostra de 24
    # conferida a mao. Os erros do classificador nao sao de baixa confianca —
    # sao erros confiantes em questao interdisciplinar, que limiar nao pega.
    # Por isso o filtro vem desligado; existe para quem preferir menos volume.
    ap.add_argument(
        "--min-disciplina",
        type=float,
        default=0.0,
        help="pontuacao minima da disciplina sugerida (0 = sem filtro)",
    )
    ap.add_argument("--sem-figuras", action="store_true")
    ap.add_argument("--sem-gabarito", action="store_true")
    ap.add_argument("--saida", default="")
    ap.add_argument(
        "--por-materia",
        action="store_true",
        help="gera um caderno por disciplina, em vez de uma lista so'",
    )
    args = ap.parse_args()

    if args.por_materia or args.por_tema:
        return gerar_cadernos(args, por="tema" if args.por_tema else "materia")

    if not MODELO.exists():
        print(f"Modelo nao encontrado: {MODELO}", file=sys.stderr)
        return 1

    qs = filtrar(carregar_questoes(), args)
    if not qs:
        print("Nenhuma questao atende aos filtros.", file=sys.stderr)
        return 1
    escolhidas = qs[: args.n] if args.n > 0 else qs
    figuras = {} if args.sem_figuras else carregar_figuras()

    destino = Path(args.saida) if args.saida else SAIDA_PADRAO / (
        re.sub(r"[^a-z0-9]+", "-", norm(args.titulo)).strip("-") + ".pdf"
    )
    usados, paginas = montar(
        escolhidas, args.titulo, figuras, destino, not args.sem_gabarito
    )

    print("================ LISTA GERADA ================")
    print(f"Titulo     : {args.titulo}")
    print(f"Questoes   : {usados} de {len(qs)} disponiveis no filtro")
    print(f"Paginas    : {paginas}")
    print(f"Arquivo    : {destino}")
    anos = collections.Counter(q.get("ano") for q in escolhidas[:usados])
    inst = collections.Counter(q.get("instituicao") for q in escolhidas[:usados])
    print(f"Anos       : {dict(sorted(anos.items(), key=lambda kv: str(kv[0])))}")
    print(f"Instituicoes: {dict(inst.most_common(6))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
