# -*- coding: utf-8 -*-
"""
Etapa 15 - Disciplina de cada questao.

Classificar 24 mil questoes a mao nao e' viavel, e chutar disciplina e' pior que
nao ter: uma questao de Biologia num simulado de Fisica queima a confianca do
aluno. A saida aqui e' um classificador por evidencia, que so' decide quando ha'
margem, e ADMITE nao saber no resto.

Como funciona:
  - cada disciplina tem um lexico de termos que praticamente so' aparecem nela
    ("mitocondria", "estequiometria", "barroco", "mais-valia");
  - conta as ocorrencias no enunciado + alternativas, com peso maior para termo
    raro (aparece em poucas disciplinas);
  - so' atribui se a melhor pontuacao passar de um minimo E for pelo menos 60%
    maior que a segunda. Empate tecnico vira `indefinida`.

Dois sinais de contexto entram como reforco, nao como decisao:
  - o nome do arquivo/pasta ("PROVA DE BIOLOGIA", "..._MAT.pdf");
  - a vizinhanca: provas agrupam questoes por materia, entao as duas questoes
    anteriores e as duas seguintes votam.

Saida: data/subjects.jsonl. Uso: python scripts/pdf-ingest/15_classify_subject.py
"""
from __future__ import annotations

import collections
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, norm  # noqa: E402

QUESTOES = DATA / "questions_final.jsonl"
OUT = DATA / "subjects.jsonl"

# Limiar escolhido por medicao. A referencia sao provas monodisciplinares — o
# nome do arquivo declara a materia — descontando os cadernos grandes, cujo
# nome so' indica a lingua estrangeira escolhida ("Prova Tipo 3 Lingua
# Inglesa.pdf" tem 60 questoes de tudo). Com a referencia limpa: 96,5% de
# acuracia e 49,4% de cobertura.
MIN_PONTOS = 2.0
MARGEM = 1.6  # a melhor tem que ser 60% maior que a segunda

# A acuracia medida NAO autoriza usar isso como rotulo definitivo. E' sugestao
# para quem for curar as questoes — por isso a saida vai para um campo
# `disciplina_sugerida`, separado de qualquer coisa marcada como validada.
ACURACIA_MEDIDA = 0.965

LEXICO: dict[str, list[str]] = {
    "BIOLOGIA": [
        "celula", "mitocondria", "cloroplasto", "ribossomo", "dna", "rna", "gene",
        "cromossomo", "mitose", "meiose", "enzima", "proteina", "fotossintese",
        "respiracao celular", "ecossistema", "cadeia alimentar", "bioma", "especie",
        "evolucao", "selecao natural", "bacteria", "virus", "fungo", "protozoario",
        "tecido epitelial", "sistema nervoso", "hormonio", "insulina", "glicemia",
        "anticorpo", "antigeno", "vacina", "sangue", "hemacia", "leucocito",
        "reino", "filo", "artropode", "vertebrado", "angiosperma", "gimnosperma",
        "fenotipo", "genotipo", "alelo", "heredograma", "mutacao", "clorofila",
        "membrana plasmatica", "osmose", "atp", "metabolismo", "parasita",
    ],
    "QUIMICA": [
        "atomo", "eletron", "proton", "neutron", "isotopo", "ligacao ionica",
        "ligacao covalente", "tabela periodica", "mol ", "molar", "estequiometria",
        "reagente", "solucao aquosa", "ph", "acido", "base ", "sal ", "oxidacao",
        "reducao", "eletrolise", "entalpia", "termoquimica", "cinetica quimica",
        "equilibrio quimico", "hidrocarboneto", "alcano", "alceno", "alcool",
        "ester", "amida", "polimero", "isomeria", "concentracao molar", "titulacao",
        "numero de oxidacao", "gas ideal", "pressao parcial", "catalisador",
        "molecula", "composto organico", "grupo funcional", "massa molar",
    ],
    "FISICA": [
        "velocidade", "aceleracao", "forca resultante", "newton", "energia cinetica",
        "energia potencial", "trabalho", "potencia", "momento linear", "impulso",
        "atrito", "gravitacao", "campo eletrico", "corrente eletrica", "resistor",
        "capacitor", "circuito", "tensao eletrica", "campo magnetico", "inducao",
        "onda", "frequencia", "comprimento de onda", "refracao", "reflexao",
        "lente", "espelho", "termodinamica", "calor especifico", "dilatacao",
        "pressao hidrostatica", "empuxo", "movimento uniforme", "queda livre",
        "energia mecanica", "joule", "watt", "ampere", "ohm", "efeito fotoeletrico",
    ],
    "MATEMATICA": [
        "funcao quadratica", "equacao", "inequacao", "logaritmo", "progressao",
        "matriz", "determinante", "sistema linear", "polinomio", "probabilidade",
        "combinacao", "permutacao", "arranjo", "media aritmetica", "mediana",
        "desvio padrao", "porcentagem", "juros", "triangulo", "quadrilatero",
        "circunferencia", "area do", "volume do", "perimetro", "seno", "cosseno",
        "tangente", "teorema de pitagoras", "reta", "plano cartesiano", "vetor",
        "conjunto", "razao", "proporcao", "grafico da funcao", "raiz da equacao",
        "cm2", "cm3", "angulo",
    ],
    "PORTUGUES": [
        "oracao", "sujeito", "predicado", "verbo", "substantivo", "adjetivo",
        "adverbio", "pronome", "conjuncao", "preposicao", "crase", "regencia",
        "concordancia", "coesao", "coerencia", "figura de linguagem", "metafora",
        "metonimia", "ironia", "conotativo", "denotativo", "paragrafo", "narrador",
        "eu lirico", "estrofe", "verso", "soneto", "romantismo", "modernismo",
        "barroco", "arcadismo", "realismo", "naturalismo", "parnasianismo",
        "simbolismo", "trovadorismo", "quinhentismo", "texto", "linguagem",
        "variedade linguistica", "ambiguidade", "intertextualidade",
    ],
    "HISTORIA": [
        "imperio", "revolucao francesa", "revolucao industrial", "feudalismo",
        "absolutismo", "iluminismo", "colonizacao", "escravidao", "abolicao",
        "republica", "getulio vargas", "ditadura militar", "estado novo",
        "primeira guerra", "segunda guerra", "guerra fria", "nazismo", "fascismo",
        "idade media", "antiguidade", "mesopotamia", "grecia antiga", "roma antiga",
        "renascimento", "reforma protestante", "independencia do brasil",
        "proclamacao", "coronelismo", "capitania", "bandeirante", "quilombo",
        "revolta", "tratado de", "seculo xix", "seculo xviii", "imperialismo",
    ],
    "GEOGRAFIA": [
        "relevo", "clima", "vegetacao", "hidrografia", "bacia hidrografica",
        "urbanizacao", "migracao", "densidade demografica", "populacao", "ibge",
        "globalizacao", "blocos economicos", "mercosul", "agropecuaria",
        "industrializacao", "recursos naturais", "desmatamento", "efeito estufa",
        "aquecimento global", "placas tectonicas", "erosao", "solo", "latitude",
        "longitude", "fuso horario", "cartografia", "escala do mapa", "regiao",
        "amazonia", "cerrado", "caatinga", "pantanal", "pampa", "mata atlantica",
        "pib", "idh", "setor terciario", "matriz energetica",
    ],
    "INGLES": [
        "the word", "in the text", "according to the", "underlined", "paragraph",
        "can be replaced by", "the author", "means", "in english", "the excerpt",
    ],
    "FILOSOFIA_SOCIOLOGIA": [
        "filosofia", "socrates", "platao", "aristoteles", "kant", "nietzsche",
        "descartes", "etica", "moral", "epistemologia", "metafisica",
        "sociologia", "durkheim", "weber", "karl marx", "mais-valia",
        "classe social", "estratificacao", "cidadania", "movimento social",
        "industria cultural", "senso comum", "contrato social", "alienacao",
    ],
}

# termos que aparecem em varias disciplinas valem menos
_ocorrencias: dict[str, int] = collections.Counter()
for termos in LEXICO.values():
    for t in termos:
        _ocorrencias[t] += 1

PESOS = {
    disciplina: {t: 1.0 / _ocorrencias[t] for t in termos}
    for disciplina, termos in LEXICO.items()
}

PISTA_NOME = [
    (r"\bbiolog", "BIOLOGIA"),
    (r"\bquimic|\bqui\b|_qui", "QUIMICA"),
    (r"\bfisic|\bfis\b|_fis", "FISICA"),
    (r"\bmatemat|\bmat\b|_mat", "MATEMATICA"),
    (r"\bportugu|linguagem|\bpor\b|_por|redac", "PORTUGUES"),
    (r"\bhistor|\bhis\b|_his", "HISTORIA"),
    (r"\bgeograf|\bgeo\b|_geo", "GEOGRAFIA"),
    (r"\bingles|\bing\b|_ing|\benglish", "INGLES"),
    (r"\bfilosof|\bsociolog", "FILOSOFIA_SOCIOLOGIA"),
]


# nome que anuncia mais de uma materia nao serve como rotulo:
# "MAT. E C.HUMANAS,C.NATUREZA" tem tres provas dentro
RE_NOME_MISTO = re.compile(
    r"humanas|natureza|geral|conhecimentos|linguagens|\be\b|,|\+|multi"
)


def pistas_do_nome(rel_path: str, fase: str | None) -> str | None:
    """Materia declarada no nome do arquivo, quando ele declara UMA so'."""
    nome = norm(rel_path.rsplit("/", 1)[-1])
    if RE_NOME_MISTO.search(nome):
        return None
    alvo = norm(rel_path + " " + (fase or ""))
    achados = {d for pat, d in PISTA_NOME if re.search(pat, alvo)}
    return achados.pop() if len(achados) == 1 else None


# Questao de ingles com texto sobre ciencia caia em BIOLOGIA/QUIMICA: os termos
# tecnicos sao os mesmos nas duas linguas. Idioma se detecta por palavra
# funcional, nao por lexico tematico.
_STOP_EN = {
    "the", "of", "and", "to", "in", "that", "is", "was", "for", "it", "with",
    "as", "his", "her", "they", "this", "have", "has", "been", "are", "which",
    "you", "not", "but", "from", "their", "would", "there", "what", "about",
}
_STOP_PT = {
    "de", "que", "para", "com", "uma", "dos", "das", "nao", "por", "como",
    "mais", "sobre", "esse", "essa", "pelo", "pela", "seus", "suas", "entre",
}


def parece_ingles(texto: str) -> bool:
    """Questao de ingles e' curta: o texto de apoio esta' em OUTRA questao.

    Exigir 25 palavras deixava passar justamente as curtas — "In the excerpt
    from the third paragraph, the word in bold can be replaced by" — e elas
    caiam na materia do assunto do texto (Quimica, Biologia). O limite baixo
    e' seguro porque a comparacao e' relativa: so' vale ingles se as palavras
    funcionais inglesas superarem as portuguesas com folga.
    """
    palavras = re.findall(r"[a-z]+", norm(texto))
    if len(palavras) < 12:
        return False
    en = sum(1 for p in palavras if p in _STOP_EN)
    pt = sum(1 for p in palavras if p in _STOP_PT)
    return en >= 4 and en > 1.5 * pt


# Contar substring casava termo dentro de outra palavra: "rna" em
# "governamental", "gene" em "generalizado", "reino" em "Reino Unido", "ester"
# em "Western". Uma questao sobre a ferrovia britanica virava BIOLOGIA por
# causa disso. Agora termo de uma palavra e' comparado com a palavra inteira, e
# termo composto casa com limite de palavra.
_UMA_PALAVRA: dict[str, dict[str, float]] = {}
_COMPOSTO: dict[str, list[tuple[re.Pattern, float]]] = {}
for _disciplina, _pesos in PESOS.items():
    _UMA_PALAVRA[_disciplina] = {}
    _COMPOSTO[_disciplina] = []
    for _termo, _peso in _pesos.items():
        _limpo = _termo.strip()
        if " " in _limpo or "-" in _limpo:
            _COMPOSTO[_disciplina].append(
                (re.compile(rf"\b{re.escape(_limpo)}\b"), _peso)
            )
        else:
            _UMA_PALAVRA[_disciplina][_limpo] = _peso

_PALAVRAS = re.compile(r"[a-z0-9]+")


def pontuar(texto: str) -> dict[str, float]:
    t = norm(texto)
    palavras = collections.Counter(_PALAVRAS.findall(t))
    pontos: dict[str, float] = {}
    for disciplina in PESOS:
        soma = 0.0
        for termo, peso in _UMA_PALAVRA[disciplina].items():
            n = palavras.get(termo, 0)
            if n:
                soma += peso * (1 + 0.35 * (min(n, 4) - 1))
        for padrao, peso in _COMPOSTO[disciplina]:
            n = len(padrao.findall(t))
            if n:
                soma += peso * (1 + 0.35 * (min(n, 4) - 1))
        if soma:
            pontos[disciplina] = round(soma, 3)
    return pontos


def decidir(pontos: dict[str, float], texto: str = "") -> tuple[str | None, float, float]:
    if texto and parece_ingles(texto):
        return "INGLES", 99.0, 0.0
    if not pontos:
        return None, 0.0, 0.0
    ordenado = sorted(pontos.items(), key=lambda kv: -kv[1])
    melhor, p1 = ordenado[0]
    p2 = ordenado[1][1] if len(ordenado) > 1 else 0.0
    if p1 < MIN_PONTOS:
        return None, p1, p2
    if p2 > 0 and p1 < MARGEM * p2:
        return None, p1, p2
    return melhor, p1, p2


def main() -> int:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--sem-nome",
        action="store_true",
        help="ignora a pista do nome do arquivo. Serve para MEDIR sem "
        "circularidade: o rotulo de referencia vem justamente do nome",
    )
    args = ap.parse_args()

    questoes = [json.loads(l) for l in QUESTOES.open(encoding="utf-8")]

    por_prova: dict[str, list[int]] = collections.defaultdict(list)
    for i, q in enumerate(questoes):
        por_prova[q["rel_path"]].append(i)

    # o texto de apoio vive no enunciado de outra questao (etapa 07). Sem ele,
    # uma questao curta de ingles nao tem ingles suficiente para ser detectada.
    enunciado_por_numero: dict[tuple[str, int], str] = {}
    for q in questoes:
        if q["numero"] is not None:
            enunciado_por_numero.setdefault((q["rel_path"], q["numero"]), q["enunciado"])

    resultado: list[dict] = []
    for i, q in enumerate(questoes):
        texto = q["enunciado"] + " " + " ".join(a["texto"] for a in q["alternativas"])
        # O texto de apoio agora vem extraido da propria pagina (etapa 07). Sem
        # ele, a questao de ingles com enunciado em portugues nao tem ingles
        # suficiente para o detector de idioma disparar, e cai na materia do
        # ASSUNTO do texto. Era o gargalo: Ingles em 70%.
        ctx = q.get("contexto_texto")
        if not ctx and q.get("contexto_numero") is not None:
            ctx = enunciado_por_numero.get((q["rel_path"], q["contexto_numero"]))
        if ctx:
            texto = ctx + " " + texto
        pontos = pontuar(texto)
        disciplina, p1, p2 = decidir(pontos, texto)
        resultado.append(
            {
                "sha256": q["sha256"],
                "numero": q["numero"],
                "pagina": q["pagina"],
                "disciplina": disciplina,
                "fonte": "lexico" if disciplina else None,
                "pontos": p1,
                "segunda": p2,
                "_ingles": parece_ingles(texto),
            }
        )

    # O nome do arquivo SOBREPOE o lexico quando declara uma unica materia.
    # `PUC-RS_2016_1D_ING.pdf` e' uma prova inteira de ingles: se o lexico
    # disse "Quimica" porque o texto fala de moleculas, o lexico esta' errado.
    # Antes o nome so' preenchia o que ficara indefinido, e por isso questao de
    # ingles com enunciado em portugues caia na materia do assunto do texto.
    for rel, idxs in por_prova.items():
        pista = None if args.sem_nome else pistas_do_nome(rel, questoes[idxs[0]].get("fase"))
        if not pista:
            continue

        # O nome e' evidencia, nao prova — e o conteudo pode desmenti-lo.
        # "Prova Tipo 3 Lingua Inglesa.pdf" com 60 questoes nao e' uma prova de
        # ingles: e' o caderno inteiro, e o nome indica apenas a lingua
        # estrangeira ESCOLHIDA. Sobrepondo o lexico sem conferir, 114 questoes
        # de Kant, Fleming e colonia fungica viravam "Ingles".
        decididas = [
            resultado[i]["disciplina"]
            for i in idxs
            if resultado[i]["fonte"] == "lexico" and resultado[i]["disciplina"]
        ]
        if len(decididas) >= 5:
            concordam = sum(1 for d in decididas if d == pista) / len(decididas)
            if concordam < 0.5:
                continue  # o conteudo desmente o nome: o nome perde

        for i in idxs:
            resultado[i]["disciplina"] = pista
            resultado[i]["fonte"] = "nome_do_arquivo"

    # reforco 2: BLOCOS. Uma prova nao intercala materias — ela traz um bloco de
    # Portugues, depois um de Ingles, depois um de Biologia. Isso resolve dois
    # casos que o lexico sozinho erra:
    #   - questao sem termo caracteristico, cercada por questoes de uma materia;
    #   - questao de ingles com enunciado em portugues citando trecho em ingles,
    #     que o lexico manda para a materia do assunto do texto.
    for rel, idxs in por_prova.items():
        idxs = sorted(idxs, key=lambda i: (questoes[i]["pagina"] or 0, questoes[i]["numero"] or 0))
        if len(idxs) < 5:
            continue
        votos = [
            resultado[i]["disciplina"] if resultado[i]["fonte"] == "lexico" else None
            for i in idxs
        ]

        # Bloco de lingua estrangeira. A prova de ingles vem em bloco, mas o
        # enunciado costuma ser em portugues citando um trecho em ingles — o
        # detector de idioma so' dispara em parte das questoes, e o lexico manda
        # o resto para a materia do ASSUNTO do texto (Quimica, Biologia). Aqui a
        # vizinhanca decide: se varias questoes ao redor sao claramente em
        # ingles, esta tambem e' da prova de ingles.
        ingleses = [resultado[i]["_ingles"] for i in idxs]
        for pos, i in enumerate(idxs):
            perto = sum(ingleses[max(0, pos - 3) : pos + 4])
            if perto >= 3 and resultado[i]["disciplina"] != "INGLES":
                resultado[i]["disciplina"] = "INGLES"
                resultado[i]["fonte"] = "bloco_ingles"

        for pos, i in enumerate(idxs):
            janela = collections.Counter(
                v for v in votos[max(0, pos - 3) : pos + 4] if v
            )
            if not janela:
                continue
            dominante, n = janela.most_common(1)[0]
            segunda = janela.most_common(2)[1][1] if len(janela) > 1 else 0

            atual = resultado[i]["disciplina"]
            if atual is None:
                # vazio herda o bloco, se o bloco for coeso
                if n >= 3 and segunda <= 1:
                    resultado[i]["disciplina"] = dominante
                    resultado[i]["fonte"] = "bloco"
            elif atual != dominante and resultado[i]["fonte"] == "lexico":
                # o bloco desmente o lexico: so' vale se o bloco for bem coeso
                # e a propria decisao do lexico tiver sido apertada
                folga = resultado[i]["pontos"] - resultado[i]["segunda"]
                if n >= 4 and segunda == 0 and folga < 3.0:
                    resultado[i]["disciplina"] = dominante
                    resultado[i]["fonte"] = "bloco_corrigiu"

    with OUT.open("w", encoding="utf-8") as f:
        for r in resultado:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    total = len(resultado)
    com = [r for r in resultado if r["disciplina"]]
    porf = collections.Counter(r["fonte"] for r in com)
    pord = collections.Counter(r["disciplina"] for r in com)
    validadas = [
        r for r, q in zip(resultado, questoes)
        if r["disciplina"] and not q["problemas"] and q.get("gabarito_letra")
    ]

    print("================ DISCIPLINA ================")
    print(f"Questoes             : {total}")
    print(f"  classificadas      : {len(com)} ({len(com) / total * 100:.1f}%)")
    print(f"  indefinidas        : {total - len(com)}")
    print(f"  validadas e classificadas: {len(validadas)}")
    print("\nPor origem da decisao:")
    for k, v in porf.most_common():
        print(f"  {str(k):16s} {v}")
    print("\nPor disciplina:")
    for k, v in pord.most_common():
        print(f"  {k:22s} {v}")
    print(f"\nEscrito em: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
