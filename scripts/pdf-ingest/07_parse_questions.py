# -*- coding: utf-8 -*-
"""
Etapa 7 - Quebra das provas em questoes individuais.

Estrategia: a ANCORA e' o bloco de alternativas, nao o numero da questao.

Cada banca diagrama o numero de um jeito ("QUESTAO 07", "07.", "07" sozinho
numa linha, ou a palavra e o numero em blocos de texto separados), mas toda
questao objetiva termina numa sequencia A-B-C-D(-E). Ancorando ai:

    [ ...enunciado... ]  (A) ... (B) ... (C) ... (D) ... (E) ...
    ^-- tudo entre o fim do bloco anterior e o "(A)" deste

O numero e' procurado DEPOIS, de tras para frente a partir do "(A)", e serve
para validar (a sequencia tem que ser crescente), nao para segmentar.

Saida: data/questions.jsonl + relatorio de cobertura.
Uso: python scripts/pdf-ingest/07_parse_questions.py [--limit N] [--amostra 5]
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import statistics
import sys
from pathlib import Path  # noqa: F401

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, order_blocks, read_json_gz, text_path  # noqa: E402

DOCS = DATA / "documents.jsonl"
OUT = DATA / "questions.jsonl"

TIPOS_PROVA = {"prova_objetiva", "prova"}

# Marcador de alternativa, com a posicao no texto. Tres formas:
#   "(A) texto"  "A) texto"  e  "A" sozinha numa linha, texto na linha seguinte.
# A terceira e' a do ENEM: sem ela, 79 provas do ENEM nao produziam nenhuma
# questao e ainda eram classificadas como discursivas.
RE_ALT = re.compile(
    r"(?m)^[^\S\n]*(?:"
    r"\(([A-Ea-e])\)[^\S\n]*(?=\S)"
    r"|([A-Ea-e])[^\S\n]*[\).\-–:][^\S\n]*(?=\S)"
    r"|([A-Ea-e])[^\S\n]*$(?=\n[^\S\n]*\S)"
    r")"
)


def letra_da_marca(m: re.Match) -> str:
    return (m.group(1) or m.group(2) or m.group(3)).upper()
# Numero da questao em duas forcas. O marcador FRACO (numero sozinho numa
# linha) tambem casa com o numero da pagina, entao so' e' usado quando nao ha
# marcador forte na regiao da questao.
# `[\s|¦│]*` no lugar de `[^\S\n]*`: borda de tabela vira "|" no texto e fica
# antes do marcador ("| | QUESTAO 40"). Sem tolerar isso, o corte da ultima
# alternativa nao via a questao seguinte e a engolia inteira.
RE_NUM_FORTE = re.compile(
    r"(?im)^[ \t|¦│]*(?:quest[ãa]o|quest\.)[^\S\n]*n?[º°.:\-]*[^\S\n]*(\d{1,3})\b"
    r"|^[ \t|¦│]*(\d{1,3})[^\S\n]*[\.\)–\-][^\S\n]+(?=\S)"
)
# lixo de borda de tabela que sobra colado no fim da alternativa: "( (", "| |"
RE_LIXO_BORDA = re.compile(r"[\s(|¦│]+$")
# ...e no comeco do enunciado: "| | QUESTAO 39 Ao entrar no banheiro..."
RE_LIXO_INICIO = re.compile(r"^[\s|¦│•·]+")
RE_NUM_FRACO = re.compile(r"(?m)^[^\S\n]*(\d{1,3})[^\S\n]*$")
# usado so' para delimitar onde termina a ultima alternativa
RE_NUM = re.compile(RE_NUM_FORTE.pattern, re.I | re.M)

MIN_ENUNCIADO = 25
MAX_ENUNCIADO = 6000
# tamanho a partir do qual um bloco orfao pode ser um texto de apoio
TAM_BASE_MINIMO = 200

# Algumas bancas imprimem a palavra "QUESTAO" como elemento grafico separado do
# numero. Ela chega ao texto como uma linha solta, sem numero, e gruda no fim da
# alternativa anterior. Descoberto pela validacao cruzada entre copias: duas
# extracoes da mesma questao davam "finalidade" e "finalidade questao questao".
RE_ORFA_QUESTAO = re.compile(r"(?im)^[^\S\n]*quest[ãa]o[^\S\n]*$\n?")


def limpar_orfas(texto: str) -> str:
    return RE_ORFA_QUESTAO.sub("", texto).strip()


def blocos_de_alternativas(texto: str) -> list[list[tuple[str, int, int]]]:
    """Agrupa marcadores de alternativa em blocos A-B-C-D(-E) consecutivos.

    Cada item: (letra, inicio_do_marcador, fim_do_marcador).
    """
    marcas = [(letra_da_marca(m), m.start(), m.end()) for m in RE_ALT.finditer(texto)]
    blocos: list[list[tuple[str, int, int]]] = []
    i = 0
    while i < len(marcas):
        if marcas[i][0] != "A":
            i += 1
            continue
        j = i
        while j + 1 < len(marcas) and ord(marcas[j + 1][0]) == ord(marcas[j][0]) + 1:
            j += 1
        if j - i + 1 >= 4:  # A-D basta: algumas bancas usam 4 alternativas
            blocos.append(marcas[i : j + 1])
            i = j + 1
        else:
            i += 1
    return blocos


def posicoes_de_numero_de_pagina(texto: str, limites: list[tuple[int, int]]) -> set[int]:
    """Posicoes de linhas que sao o numero impresso da pagina, nao de questao.

    Provas do padrao VUNESP imprimem o numero da pagina sozinho numa linha no
    topo — igualzinho ao numero da questao. Sem separar os dois, uma questao
    herda o numero da pagina e, com ele, a resposta de OUTRA questao no
    gabarito. Foi assim que a questao 05 da Famerp virou "questao 4".

    Criterio conservador: so' descarta o candidato que esta no inicio da pagina
    E vale exatamente o numero daquela pagina.
    """
    fora = set()
    for idx, (inicio, numero_pagina) in enumerate(limites):
        fim = limites[idx + 1][0] if idx + 1 < len(limites) else len(texto)
        cabecalho = texto[inicio : min(fim, inicio + 160)]
        for m in RE_NUM_FRACO.finditer(cabecalho):
            if int(m.group(1)) == numero_pagina:
                fora.add(inicio + m.start())
    return fora


def numero_antes(
    texto: str,
    ini: int,
    fim: int,
    esperado: int | None = None,
    excluir: set[int] | None = None,
    validos: set[int] | None = None,
) -> tuple[int | None, int, str]:
    """Numero da questao dentro da regiao [ini, fim).

    Devolve (numero, posicao_do_marcador, forca). O marcador delimita o inicio
    do enunciado — o que vem antes dele pertence ao texto-base compartilhado
    ("Leia o texto para responder as questoes de 7 a 9").

    Havendo mais de um candidato na regiao (o numero da pagina tambem e' uma
    linha so' com digitos), prefere-se o que continua a sequencia. Isso escolhe
    entre numeros que ESTAO no texto — nao inventa numero nenhum.
    """
    fortes = [
        (int(m.group(1) or m.group(2)), m.start())
        for m in RE_NUM_FORTE.finditer(texto, ini, fim)
        if (m.group(1) or m.group(2))
    ]
    excluir = excluir or set()
    fracos = [
        (int(m.group(1)), m.start())
        for m in RE_NUM_FRACO.finditer(texto, ini, fim)
        if m.start() not in excluir
    ]

    # Quando o documento revelou quais numeros sao de questao (pela fonte),
    # candidatos FRACOS fora dessa lista sao ruido — rotulo de grafico, numero
    # de pagina, ano no meio do enunciado. Candidato forte e' explicito no
    # texto ("QUESTAO 20", "20.") e nao se descarta por isso.
    if validos:
        fracos_filtrados = [c for c in fracos if c[0] in validos]
        if fracos_filtrados:
            fracos = fracos_filtrados

    for candidatos, forca in ((fortes, "forte"), (fracos, "fraco")):
        if not candidatos:
            continue
        if esperado is not None:
            for n, pos in candidatos:
                if n == esperado:
                    return n, pos, forca
        return candidatos[-1][0], candidatos[-1][1], forca

    return None, -1, "nenhum"


RE_LINHA_NUMERO = re.compile(r"^[^\S\n]*(?:quest[ãa]o[^\S\n]*)?(\d{1,3})[.\)]?[^\S\n]*$", re.I)


def maior_sequencia_crescente(valores: list[int]) -> int:
    """Comprimento da maior corrida estritamente crescente e sem saltos grandes."""
    melhor = atual = 1 if valores else 0
    for a, b in zip(valores, valores[1:]):
        if a < b <= a + 3:
            atual += 1
            melhor = max(melhor, atual)
        else:
            atual = 1
    return melhor


def numeros_por_assinatura(paginas: list[dict]) -> tuple[tuple | None, list[int]]:
    """Descobre a assinatura tipografica do numero de questao no documento.

    Numero de questao e numero de pagina sao ambos "uma linha so' com digitos" —
    indistinguiveis no texto puro. Mas a banca imprime cada um com sua fonte:
    na Famerp o numero da questao e' Swiss721BT-BoldCondensed 9pt negrito e o da
    pagina e' Swiss721BT-RomanCondensed 9pt sem negrito.

    Agrupa os candidatos por (fonte, tamanho, negrito) e fica com o grupo cujos
    valores formam a maior sequencia crescente — que e' o que uma numeracao de
    prova faz e um numero de pagina repetido nao faz.

    Devolve (assinatura, numeros_em_ordem_de_leitura).
    """
    grupos: dict[tuple, list[int]] = collections.defaultdict(list)
    for p in paginas:
        linhas = p.get("linhas") or []
        if not linhas:
            continue
        tuplas = [(l[0], l[1], l[2], l[3], l[4]) for l in linhas]
        ordenadas, _layout = order_blocks(tuplas)
        indice = {id(t): i for i, t in enumerate(tuplas)}
        for t in ordenadas:
            i = indice.get(id(t))
            if i is None:
                continue
            l = linhas[i]
            m = RE_LINHA_NUMERO.match(l[4] or "")
            if not m:
                continue
            assinatura = (l[5], l[6], l[7])  # fonte, tamanho, negrito
            grupos[assinatura].append(int(m.group(1)))

    melhor = None
    for assinatura, valores in grupos.items():
        corrida = maior_sequencia_crescente(valores)
        if corrida < 5:
            continue
        if melhor is None or corrida > melhor[0]:
            melhor = (corrida, assinatura, valores)

    if melhor is None:
        return None, []
    return melhor[1], melhor[2]


def parse_documento(doc: dict) -> dict:
    data = read_json_gz(text_path(doc["sha256"]))
    pages = data["pages"]

    # texto continuo + mapa de posicao -> pagina, para manter a proveniencia
    partes = []
    limites = []  # (pos_inicial, numero_da_pagina)
    pos = 0
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

    fora = posicoes_de_numero_de_pagina(texto, limites)
    blocos = blocos_de_alternativas(texto)

    # Numeros tipograficamente identificados como "numero de questao". Quando a
    # contagem bate com a de blocos de alternativas, cada bloco recebe o seu por
    # posicao — sem depender de encontrar o marcador no texto corrido.
    _assinatura, numeros_tipograficos = numeros_por_assinatura(pages)
    por_posicao = (
        numeros_tipograficos
        if len(numeros_tipograficos) == len(blocos) and blocos
        else None
    )
    validos = set(numeros_tipograficos)

    questoes = []
    fim_anterior = 0
    ultimo_numero = None

    for b_idx, bloco in enumerate(blocos):
        ini_alt = bloco[0][1]
        # a questao seguinte comeca, no maximo, no "(A)" do proximo bloco
        limite = blocos[b_idx + 1][0][1] if b_idx + 1 < len(blocos) else len(texto)
        esperado = ultimo_numero + 1 if ultimo_numero is not None else None
        num, pos_num, forca = numero_antes(
            texto, fim_anterior, ini_alt, esperado, fora, validos
        )
        # A tipografia PREENCHE lacuna, nunca sobrepoe marcador explicito:
        # sobrescrever um "20." lido no texto por um numero deduzido da posicao
        # trocava numeros certos por errados na PUC-PR.
        if num is None and por_posicao is not None:
            num, forca = por_posicao[b_idx], "tipografica"
        if num is not None:
            ultimo_numero = num

        # o enunciado comeca no marcador do numero; sem marcador, comeca onde a
        # questao anterior terminou
        inicio = pos_num if pos_num >= fim_anterior else fim_anterior
        enunciado = RE_LIXO_INICIO.sub("", limpar_orfas(texto[inicio:ini_alt]))

        # O que sobra ENTRE o fim da questao anterior e o numero desta e' o
        # texto de apoio do grupo — ele vem impresso antes do numero, e era
        # descartado aqui. Recuperado assim, o apoio e' um fato geometrico do
        # PDF, nao um palpite: esta' fisicamente antes da questao, na ordem de
        # leitura. Foi o que substituiu a ligacao por proximidade, que errava.
        base = ""
        if pos_num > fim_anterior:
            base = limpar_orfas(texto[fim_anterior:pos_num])

        alternativas = []
        fim_bloco = ini_alt
        for k, (letra, _s, e) in enumerate(bloco):
            if k + 1 < len(bloco):
                fim = bloco[k + 1][1]
            else:
                # A ultima alternativa nao tem marcador depois dela, entao seu
                # fim precisa ser inferido. O sinal mais forte sao as
                # alternativas irmas: dentro de uma questao elas tem tamanhos
                # parecidos, e a ultima nao e' varias vezes maior que as outras.
                # Sem esse limite, ela avanca e engole o enunciado da questao
                # seguinte — era o que deixava 3.800 enunciados vazios.
                resto = texto[e:limite]

                # Limites DUROS: passar deles invade a proxima questao.
                duro = len(resto)
                mm = RE_NUM.search(resto)
                if mm and mm.start() > 0:
                    duro = min(duro, mm.start())
                # Bancas do padrao VUNESP (Famerp, Santa Casa, PUC-SP, FMABC...)
                # imprimem so' o numero numa linha — "01" — porque a palavra
                # "questao" e' um elemento grafico a' parte. Sem cortar aqui, a
                # ultima alternativa passa por cima do numero e a questao
                # seguinte fica sem identificacao.
                for mf in RE_NUM_FRACO.finditer(resto):
                    if mf.start() > 0:
                        duro = min(duro, mf.start())
                        break

                # Limites MOLES: palpites de onde a alternativa acaba. A quebra
                # de paragrafo era usada como corte fixo, e cortava a alternativa
                # no meio quando ela seguia para a proxima coluna ou pagina —
                # 1.775 questoes ficaram com a ultima alternativa truncada, em
                # 265 delas justamente a alternativa correta. Agora so' vale o
                # palpite que devolve um texto de tamanho compativel com as
                # alternativas irmas.
                irmas = [len(a["texto"]) for a in alternativas]
                moles = [900]
                if irmas:
                    moles.append(int(2.5 * max(irmas)) + 60)
                par = resto.find("\n\n")
                if par > 0:
                    moles.append(par)
                alvo = 0.6 * statistics.median(irmas) if irmas else 0

                escolhido = duro
                for c in sorted(moles):
                    if c >= alvo:
                        escolhido = min(duro, c)
                        break
                fim = e + escolhido
            alternativas.append(
                {"letra": letra, "texto": RE_LIXO_BORDA.sub("", limpar_orfas(texto[e:fim]))}
            )
            fim_bloco = fim

        questoes.append(
            {
                "numero": num,
                "numero_forca": forca,
                "enunciado": enunciado,
                "texto_base": base,
                "alternativas": alternativas,
                "pagina": pagina_de(ini_alt),
                "pos": ini_alt,
            }
        )
        fim_anterior = fim_bloco

    ligar_contexto(questoes)
    return {"doc": doc, "questoes": questoes, "texto_len": len(texto)}


# Referencias a algo que nao esta no proprio enunciado: "de acordo com o texto",
# "no segundo paragrafo", "na tirinha", "linha 12".
RE_ANAFORA = re.compile(
    r"(?i)\b(?:o|no|do|ao|da|na|nesse|neste|desse|deste|segundo o|de acordo com o|"
    r"com base n[oa])\s+"
    r"(?:texto|excerto|trecho|poema|fragmento|artigo|cr[oô]nica|conto|soneto|"
    r"gr[áa]fico|tabela|tirinha|tira|charge|quadrinho|imagem|figura|mapa|esquema|"
    r"infogr[áa]fico|cartaz|an[úu]ncio|di[áa]logo|reportagem|not[íi]cia|obra)\b"
    r"|\b(?:primeiro|segundo|terceiro|quarto|quinto|[úu]ltimo)\s+par[áa]grafo\b"
    r"|\blinhas?\s*\d{1,3}\b"
    r"|\b\d{1,2}[ºo]\s*par[áa]grafo\b"
    # Referencia a dados que estao noutra questao, sem citar "texto" nem
    # "grafico". O conjunto de referencia pegou uma questao de gases que abre
    # com "A partir das informacoes apresentadas" e nao era marcada como
    # dependente — sem os dados, ela nao tem resposta.
    r"|\b(?:a partir d|com base n|de acordo com |considerando |segundo )"
    r"[oa]s?\s+(?:informa[çc][õo]es|dados|resultados|valores)\b"
    r"|\b(?:informa[çc][õo]es|dados|resultados)\s+"
    r"(?:apresentad[oa]s|acima|a seguir|fornecid[oa]s|do enunciado)\b"
    r"|\bno\s+(?:experimento|estudo|quadro|esquema)\s+"
    r"(?:descrit[oa]|apresentad[oa]|acima|anterior)\b"
    # A prova de ingles enuncia em ingles. Sem estes padroes, "The main purpose
    # of the text is to" nao era reconhecida como dependente e a questao ia
    # para o caderno sem o texto que ela discute.
    r"|\bthe\s+(?:text|excerpt|passage|article|author|fragment|comic|cartoon|"
    r"advertisement|chart|graph|table|image)\b"
    r"|\baccording to the\b|\bin the (?:first|second|third|fourth|last) paragraph\b"
    r"|\bthe underlined\b|\bline[s]?\s*\d{1,3}\b|\bparagraph\b"
)
RE_FAIXA = re.compile(
    r"(?i)quest[õo]es?\s*(?:de\s*)?(?:n[uú]meros?\s*)?(\d{1,3})\s*(?:a|e|at[ée]|à|-|–)\s*(\d{1,3})"
    # A prova de ingles declara a faixa em ingles: "Read the text to answer
    # questions 17 to 20". Sem isto, a ligacao provada virava palpite.
    r"|questions?\s*(\d{1,3})\s*(?:to|and|through|-|–)\s*(\d{1,3})"
)
# A coluna estreita da prova quebra palavras com hifen: "para responder as
# ques-\ntoes 09 e 10". Sem juntar de volta, a faixa declarada nao e' vista e a
# ligacao vira palpite quando na verdade estava escrita na prova.
RE_HIFEN_QUEBRA = re.compile(r"(\w)-\s*\n\s*(\w)")


def juntar_hifenizadas(texto: str) -> str:
    return RE_HIFEN_QUEBRA.sub(r"\1\2", texto)


# Nem todo bloco impresso antes de uma questao e' texto de apoio. Aviso de
# copyright, instrucoes de preenchimento e cabecalho da grafica ocupam o mesmo
# lugar na pagina — e um deles chegou a ser anexado a uma questao como se fosse
# o texto que ela discute.
RE_BUROCRACIA = re.compile(
    r"(?i)expressamente proibida|reproducao (?:total|parcial)|responsabilidade civil"
    r"|propriedade d[ao] (?:funda[çc][ãa]o|institui)|confidencial at[eé]"
    r"|n[ãa]o assine esta folha|aguarde a ordem|dura[çc][ãa]o (?:total )?d[ae] prova"
    r"|verifique se (?:este|o) caderno|folha de respostas|caderno de quest[õo]es"
    r"|assinatura do candidato|uso exclusivo do fiscal"
    r"|confira seus dados|esta prova cont[eé]m|quando for permitido abrir"
    r"|proposta de reda[çc][ãa]o\b.{0,40}\bquest[õo]es|preencha.{0,20}alveolo"
    r"|transcrever.{0,30}folha de|tempo (?:total )?de (?:prova|dura)"
)


# cabecalho da grafica no topo de cada pagina: "3 CLRE2201 | 002-Prova-II"
RE_CABECALHO_PAGINA = re.compile(r"^\s*\d{0,3}\s*[A-Z]{3,6}\d{4}\s*\|.*$", re.M)


def limpar_base(base: str) -> str:
    """Tira do bloco a papelada da prova, preservando o material de estudo.

    Rejeitar o bloco inteiro por conter "Confidencial ate' o momento da
    aplicacao" descartava textos de apoio legitimos: essa linha e' o cabecalho
    de TODA pagina VUNESP e vem colada no texto que interessa.
    """
    linhas = [
        l
        for l in base.split("\n")
        if not RE_BUROCRACIA.search(l) and not RE_CABECALHO_PAGINA.match(l)
    ]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(linhas)).strip()


def eh_texto_de_apoio(base: str) -> bool:
    """O bloco antes da questao e' material de estudo, nao papelada da prova.

    Tambem nao pode ser OUTRA QUESTAO: quando as alternativas de uma questao
    saem como imagem, o texto dela fica orfao e cai nesta posicao. Uma delas
    virou "texto de apoio" de um problema de trigonometria — era um problema
    de dados com as cinco alternativas juntas.
    """
    limpo = limpar_base(base)
    if len(limpo) < TAM_BASE_MINIMO:
        return False
    if len(_alt_letters_base(limpo)) >= 4:
        return False
    # Tem que ser texto corrido. Uma grade de numeros do cartao-resposta
    # ("2. 23. 24. 25. 26...") passava por texto de apoio de uma questao de
    # ingles sobre tecnicas de pintura.
    palavras = [p for p in re.findall(r"[^\W\d_]+", limpo) if len(p) >= 3]
    return len(palavras) >= 25


def _alt_letters_base(texto: str) -> list[str]:
    return [(m.group(1) or m.group(2) or m.group(3)) for m in RE_ALT.finditer(texto)]

# um enunciado a partir deste tamanho provavelmente carrega o texto-base do grupo
TAM_LIDER = 600
# ...mas tamanho sozinho e' criterio grosseiro: 501 questoes ficaram sem apoio
# porque o texto-base tinha entre 300 e 599 caracteres. Abaixo do corte, exige-se
# evidencia de que aquilo E' um texto-base: a fonte citada entre parenteses no
# fim ("(Machado de Assis. Dom Casmurro, 1899.)") ou a instrucao de leitura.
TAM_LIDER_COM_EVIDENCIA = 320
RE_FONTE_CITADA = re.compile(r"\([^)\n]{6,90}\)\s*$", re.M)
RE_INSTRUCAO_LEITURA = re.compile(
    r"(?i)\b(?:leia|considere|analise|observe|examine)\b[^.\n]{0,70}"
    r"\b(?:texto|excerto|trecho|poema|tira|tirinha|charge|gr[áa]fico|tabela|"
    r"imagem|figura|fragmento|cr[oô]nica|conto|soneto|an[úu]ncio|cartaz|"
    r"reportagem|not[íi]cia|quadrinho|infogr[áa]fico|mapa|esquema)\b"
)


def eh_lider(enunciado: str) -> bool:
    """Este enunciado carrega o texto de apoio de um grupo de questoes?

    Baixar o corte para 320 caracteres com "evidencia de texto-base" pareceu
    boa ideia e rendeu 1.075 ligacoes novas — todas as 5 que conferi estavam
    ERRADAS, ligando questoes sem relacao nenhuma. O criterio de tamanho volta
    a ser o unico, e o problema real (questao marcada como dependente sem ser)
    e' tratado em `carrega_material_proprio`.
    """
    return len(enunciado) >= TAM_LIDER


def carrega_material_proprio(enunciado: str) -> bool:
    """A questao traz o proprio material — imagem, charge, texto com fonte.

    "Analise a imagem", "Examine a charge", ou uma fonte citada entre
    parenteses indicam que o apoio esta' ali mesmo. Sem isso, questoes assim
    eram marcadas como dependentes e acabavam ligadas ao texto de um grupo
    vizinho, com o qual nao tem relacao.
    """
    return bool(RE_FONTE_CITADA.search(enunciado) or RE_INSTRUCAO_LEITURA.search(enunciado))
# abaixo disto, um enunciado com anafora quase certamente depende de outro texto
TAM_DEPENDENTE = 400
# Ate quantas questoes atras procurar o texto-base. Oito era largo demais: uma
# questao de ingles chegou a ser ligada a um texto sobre Rosa Parks sete
# questoes antes. Um texto de apoio serve a um grupo pequeno e contiguo.
JANELA_CONTEXTO = 4


def ligar_contexto(questoes: list[dict]) -> None:
    """Liga cada questao ao texto-base de que ela depende, sem alterar enunciados.

    Numa prova, o texto de apoio aparece uma vez e serve a um grupo de questoes.
    Ele acaba dentro do enunciado da PRIMEIRA questao do grupo; as seguintes
    ficam curtas e cheias de referencia a algo que nao esta ali ("de acordo com
    o segundo paragrafo"). Nada se perdeu na extracao — falta amarrar.

    Nao recorta nem reescreve nada: aponta qual questao guarda o texto-base e
    registra se a ligacao foi PROVADA (a prova declara "questoes 7 a 9") ou
    apenas inferida pela proximidade.
    """
    # O texto de apoio vigente e' o ultimo bloco orfao encontrado antes de um
    # numero de questao. Ele vale para as questoes seguintes ate' aparecer
    # outro — que e' exatamente como a prova esta' diagramada.
    # Sem faixa declarada, o alcance e' curto: conferindo a olho, a ligacao
    # acerta em distancia 0-1 e erra a partir de 3 — texto sobre patogenos
    # ligado a questao de braco robotico, poetas romanticos ligados a triangulo
    # retangulo. O texto de apoio serve as questoes imediatamente abaixo dele.
    # O texto de apoio vale ate' aparecer MATERIAL NOVO — nao ate' esgotar uma
    # contagem de questoes. Era isso que produzia os erros de distancia: entre
    # o texto e a questao havia surgido outro bloco (uma legenda, um trecho
    # curto, outra questao orfa) que o invalidava, e eu seguia aplicando o
    # anterior. Invalidando corretamente, o alcance pode ser largo de novo.
    # Conferindo por distancia: sem faixa declarada, a ligacao acerta 3 de 3 em
    # distancia 0-1 e 1 de 3 em distancia 3-6. Faixa declarada nao tem limite —
    # a prova disse a quem o texto serve.
    ALCANCE_BASE = 2
    TAM_MATERIAL_NOVO = 80
    vigente: dict | None = None
    for i, q in enumerate(questoes):
        base = q.get("texto_base") or ""
        if eh_texto_de_apoio(base):
            limpo = limpar_base(base)
            faixa = None
            for m in RE_FAIXA.finditer(juntar_hifenizadas(base)):
                numeros = [g for g in m.groups() if g]
                if len(numeros) == 2:
                    faixa = (int(numeros[0]), int(numeros[1]))
            vigente = {"texto": limpo, "desde": i, "faixa": faixa}
        elif len(limpar_base(base)) >= TAM_MATERIAL_NOVO:
            # apareceu algo novo entre as questoes, mas nao serve de apoio:
            # seja o que for, encerra o grupo anterior
            vigente = None
        q["_base_vigente"] = vigente

    for i, q in enumerate(questoes):
        q["depende_de_contexto"] = False
        q["contexto_numero"] = None
        q["contexto_fonte"] = None
        q["contexto_texto"] = None

        curto = len(q["enunciado"]) < TAM_DEPENDENTE
        if not (curto and RE_ANAFORA.search(q["enunciado"])):
            continue
        if carrega_material_proprio(q["enunciado"]):
            continue
        q["depende_de_contexto"] = True

        # 1. faixa declarada numa questao anterior: ligacao provada
        if q["numero"] is not None:
            for j in range(max(0, i - JANELA_CONTEXTO), i):
                for m in RE_FAIXA.finditer(questoes[j]["enunciado"]):
                    ini, fim = int(m.group(1)), int(m.group(2))
                    if ini <= q["numero"] <= fim:
                        q["contexto_numero"] = questoes[j]["numero"]
                        q["contexto_fonte"] = "faixa_declarada"
                        break
                if q["contexto_fonte"]:
                    break
        if q["contexto_fonte"]:
            continue

        # 1b. o texto de apoio impresso logo antes desta questao
        vig = q.get("_base_vigente")
        if vig:
            # Se o texto declara a quem serve ("para responder as questoes 67 e
            # 68"), ele NAO vale fora disso. Cair na proximidade nesse caso
            # ligou um texto declarado para 67-68 a' questao 74, e uma letra de
            # musica declarada para 02-03 a' questao 05.
            if vig["faixa"] and q["numero"] is not None:
                ini_f, fim_f = vig["faixa"]
                dentro_da_faixa = ini_f <= q["numero"] <= fim_f
                perto = False
            else:
                dentro_da_faixa = False
                perto = i - vig["desde"] <= ALCANCE_BASE
            if dentro_da_faixa or perto:
                q["contexto_texto"] = vig["texto"]
                q["contexto_fonte"] = (
                    "faixa_no_texto_base" if dentro_da_faixa else "texto_base_precedente"
                )
                continue

        # 2. NAO ha' passo 2. A ligacao por proximidade — "o texto-base e' o
        #    enunciado longo mais proximo para tras" — foi construida, medida e
        #    descartada: das 6 ligacoes que conferi, 6 estavam erradas. Ligou
        #    questao de pilha eletroquimica a um texto sobre futebol, questao de
        #    ingles a um texto sobre a Constituinte de 1946, e uma delas apontou
        #    para uma questao POSTERIOR. Imprimir um texto de apoio errado acima
        #    da questao e' pior que nao imprimir nenhum: o aluno le' um texto
        #    que nao responde nada e conclui que a questao esta' quebrada.
        #
        #    Fica so' a ligacao provada, quando a prova declara a faixa
        #    ("para responder as questoes de 7 a 9"). Sem prova, a questao segue
        #    marcada como dependente e sem apoio — e o gerador a mantem fora do
        #    caderno, a menos que ela tenha figura propria.


# Dois defeitos que so' aparecem quando as alternativas VERDADEIRAS sao imagem
# ou formula: sem texto para ancorar, o parser pega o bloco A-E da questao
# SEGUINTE, e o enunciado de uma questao fica com as alternativas de outra.
# O resultado passava por validado — resposta errada colada em questao certa.
# Borda de tabela vira "|" no texto e fica ANTES do marcador: "11 | | QUESTAO
# 39". Exigir o marcador no inicio da linha deixava passar questoes fundidas —
# uma delas trazia a questao 39 e o comeco da 40 no mesmo enunciado, com as
# alternativas embaralhadas, e foi dada por validada.
# Sem ancora de inicio de linha: o marcador aparece no MEIO dela quando a
# pagina tem borda de tabela ("11 | | QUESTAO 39 Ao entrar no banheiro..."), e
# a questao fundida escapava. Em compensacao o padrao e' sensivel a maiuscula —
# a prova imprime "QUESTAO", a prosa escreve "questao" — para nao confundir com
# um enunciado que apenas MENCIONA outra questao.
RE_DOIS_MARCADORES = re.compile(r"\bQUEST[ÃA]O[^\S\n]*N?[º°.:\-]*[^\S\n]*\d{1,3}\b")
# "(A) (B) (C) (D)" em sequencia dentro do enunciado: as alternativas reais
# estavam ali, como imagem, e o que foi capturado veio de outro lugar
RE_ALTERNATIVAS_EM_IMAGEM = re.compile(r"\(A\)\s*\(B\)\s*\(C\)\s*\(D\)", re.I)

# A capa da prova comeca com o codigo do caderno — "002. PROVA II" — que o
# padrao de numeracao le' como "questao 2". A capa entao vira uma questao com
# numero 2 e recebe do gabarito a resposta da questao 2 de verdade.
RE_CAPA_DE_PROVA = re.compile(
    r"(?i)^\s*0*\d{1,3}\s*\.\s*prova\b"
    r"|processo seletivo"
    r"|vestibular\s+(?:de\s+)?(?:medicina|unificado)"
    r"|caderno de quest"
    r"|prova de conhecimentos gerais"
)


def validar(q: dict, anterior: dict | None) -> list[str]:
    """Lista de motivos para NAO confiar nesta questao. Vazia = aprovada."""
    problemas = []
    if len(q["enunciado"]) < MIN_ENUNCIADO:
        problemas.append("enunciado_curto")
    if len(q["enunciado"]) > MAX_ENUNCIADO:
        problemas.append("enunciado_longo")
    if len(q["alternativas"]) < 4:
        problemas.append("poucas_alternativas")
    if len(RE_DOIS_MARCADORES.findall(q["enunciado"])) >= 2:
        problemas.append("questoes_fundidas")
    if RE_ALTERNATIVAS_EM_IMAGEM.search(q["enunciado"]):
        problemas.append("alternativas_em_imagem")
    if RE_CAPA_DE_PROVA.search(" ".join(q["enunciado"].split())[:130]):
        problemas.append("capa_de_prova")
    if any(len(a["texto"]) < 1 for a in q["alternativas"]):
        problemas.append("alternativa_vazia")
    if q["numero"] is None:
        problemas.append("sem_numero")
    elif anterior and anterior.get("numero") is not None:
        if q["numero"] <= anterior["numero"]:
            # Cadernos que juntam duas provas ("Provas I e II") reiniciam a
            # numeracao — legitimo. Mas so' vale como reinicio se a numeracao
            # volta ao comeco DEPOIS de ter avancado: aceitar qualquer numero
            # baixo deixava passar rotulo de grafico como numero de questao, e
            # a questao herdava a resposta de outra.
            reinicio = q["numero"] <= 2 and anterior["numero"] >= 10
            if not reinicio:
                problemas.append("numero_nao_crescente")
    return problemas


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--amostra", type=int, default=0, help="imprime N questoes")
    ap.add_argument("--filtro", default="", help="substring do rel_path")
    args = ap.parse_args()

    docs = [json.loads(l) for l in DOCS.open(encoding="utf-8")]
    docs = [d for d in docs if d["tipo"] in TIPOS_PROVA]
    if args.filtro:
        docs = [d for d in docs if args.filtro.lower() in d["rel_path"].lower()]
    if args.limit:
        docs = docs[: args.limit]
    print(f"{len(docs)} provas a processar.", flush=True)

    total = 0
    aprovadas = 0
    dependentes = 0
    ctx_faixa = 0
    ctx_prox = 0
    motivos = collections.Counter()
    por_doc = []
    amostras = []

    with OUT.open("w", encoding="utf-8") as f:
        for i, doc in enumerate(docs, 1):
            r = parse_documento(doc)
            anterior = None
            ok_doc = 0
            for q in r["questoes"]:
                total += 1
                problemas = validar(q, anterior)
                anterior = q
                for p in problemas:
                    motivos[p] += 1
                if not problemas:
                    aprovadas += 1
                    ok_doc += 1
                if q["depende_de_contexto"]:
                    dependentes += 1
                    if q["contexto_fonte"] == "faixa_declarada":
                        ctx_faixa += 1
                    elif q["contexto_fonte"] == "proximidade":
                        ctx_prox += 1
                f.write(
                    json.dumps(
                        {
                            "sha256": doc["sha256"],
                            "rel_path": doc["rel_path"],
                            "instituicao": doc.get("instituicao"),
                            "instituicao_slug": doc.get("instituicao_slug"),
                            "ano": doc.get("ano"),
                            "fase": doc.get("fase"),
                            "curso": doc.get("curso"),
                            "numero": q["numero"],
                            "numero_forca": q["numero_forca"],
                            "pagina": q["pagina"],
                            "enunciado": q["enunciado"],
                            "alternativas": q["alternativas"],
                            "depende_de_contexto": q["depende_de_contexto"],
                            "contexto_numero": q["contexto_numero"],
                            "contexto_fonte": q["contexto_fonte"],
                            "contexto_texto": q["contexto_texto"],
                            "texto_base": q.get("texto_base") or None,
                            "problemas": problemas,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                if args.amostra and len(amostras) < args.amostra and not problemas:
                    amostras.append((doc["rel_path"], q))
            por_doc.append((doc["rel_path"], len(r["questoes"]), ok_doc,
                            doc["sinais"].get("n_blocos_alternativas", 0)))
            if i % 100 == 0:
                print(f"  {i}/{len(docs)}", flush=True)

    sem_nada = [d for d in por_doc if d[1] == 0]
    print("\n================ QUESTOES ================")
    print(
        f"Dependem de contexto : {dependentes} "
        f"(ligadas: faixa declarada {ctx_faixa}, proximidade {ctx_prox}, sem lider {dependentes - ctx_faixa - ctx_prox})"
    )
    print(f"Provas processadas   : {len(docs)}  (sem nenhuma questao: {len(sem_nada)})")
    print(f"Questoes detectadas  : {total}")
    print(f"  aprovadas          : {aprovadas} ({aprovadas / total * 100:.1f}%)" if total else "")
    print("\nMotivos de reprovacao:")
    for m, c in motivos.most_common():
        print(f"  {m:24s} {c}")

    for rel, q in amostras:
        print(f"\n{'=' * 90}\n{rel} | questao {q['numero']} | p.{q['pagina']}")
        print(q["enunciado"][:600])
        for a in q["alternativas"]:
            print(f"   ({a['letra']}) {a['texto'][:130]}")

    print(f"\nEscrito em: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
