# -*- coding: utf-8 -*-
"""
Etapa 18 - Tema de cada questao, dentro da disciplina.

A disciplina (etapa 15) diz "isto e' Fisica"; o tema diz "isto e' Optica". E' o
tema que permite montar lista por assunto, que e' o que o modelo de lista pede
no cabecalho.

O tema so' disputa DENTRO da disciplina ja' identificada. Isso muda muito o
problema: "empuxo" e' ambiguo no acervo inteiro, mas dentro de Fisica aponta
Hidrostatica sem hesitar. Por isso a expectativa aqui e' melhor que os 75% da
disciplina — mas expectativa nao e' medida, e este script tambem so' atribui
quando ha' margem, deixando `indefinido` no resto.

Saida: data/topics.jsonl
Uso: python scripts/pdf-ingest/18_classify_topic.py [--amostra 20]
"""
from __future__ import annotations

import argparse
import collections
import json
import random
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, norm  # noqa: E402

QUESTOES = DATA / "questions_final.jsonl"
DISCIPLINAS = DATA / "subjects.jsonl"
OUT = DATA / "topics.jsonl"

MIN_PONTOS = 1.6
MARGEM = 1.5

TEMAS: dict[str, dict[str, list[str]]] = {
    "FISICA": {
        "Cinemática": [
            "velocidade media", "movimento uniforme", "aceleracao", "mru", "mruv",
            "queda livre", "lancamento obliquo", "lancamento vertical", "deslocamento",
            "trajetoria", "movimento retilineo", "velocidade escalar", "km/h", "m/s",
            "movimento circular", "periodo de rotacao", "velocidade angular",
        ],
        "Dinâmica": [
            "forca resultante", "segunda lei de newton", "terceira lei", "atrito",
            "coeficiente de atrito", "plano inclinado", "tracao", "forca normal",
            "forca peso", "forca centripeta", "inercia", "quantidade de movimento",
            "impulso", "colisao", "massa do bloco",
        ],
        "Trabalho e Energia": [
            "energia cinetica", "energia potencial", "energia mecanica", "trabalho da forca",
            "conservacao da energia", "potencia", "rendimento", "dissipada", "joule",
            "energia potencial gravitacional", "energia potencial elastica",
        ],
        "Hidrostática e Estática": [
            "empuxo", "densidade", "pressao hidrostatica", "arquimedes", "stevin",
            "pascal", "vasos comunicantes", "torque", "momento de uma forca", "alavanca",
            "centro de massa", "flutua", "submerso", "prensa hidraulica",
        ],
        "Termologia": [
            "calor especifico", "capacidade termica", "dilatacao", "calor latente",
            "mudanca de estado", "termodinamica", "maquina termica", "gas ideal",
            "transformacao isotermica", "isobarica", "entropia", "caloria",
            "equilibrio termico", "conducao de calor", "irradiacao", "conveccao",
        ],
        "Óptica": [
            "espelho plano", "espelho esferico", "lente", "refracao", "reflexao",
            "indice de refracao", "distancia focal", "imagem virtual", "imagem real",
            "dioptria", "miopia", "hipermetropia", "prisma", "lei de snell",
            "angulo de incidencia", "raio de luz",
        ],
        "Ondulatória e Acústica": [
            "comprimento de onda", "frequencia da onda", "onda sonora", "ressonancia",
            "efeito doppler", "interferencia", "difracao", "harmonico", "amplitude",
            "onda estacionaria", "velocidade de propagacao", "decibel", "ultrassom",
        ],
        "Eletrostática": [
            "carga eletrica", "campo eletrico", "potencial eletrico", "lei de coulomb",
            "capacitor", "eletrizacao", "linhas de campo", "condutor eletrizado",
            "diferenca de potencial entre as placas",
        ],
        "Eletrodinâmica": [
            "corrente eletrica", "resistor", "resistencia eletrica", "primeira lei de ohm",
            "potencia eletrica", "circuito eletrico", "associacao em serie",
            "associacao em paralelo", "gerador", "forca eletromotriz", "f.e.m",
            "amperimetro", "voltimetro", "kwh", "fusivel", "chuveiro eletrico",
        ],
        "Magnetismo": [
            "campo magnetico", "iman", "inducao eletromagnetica", "fluxo magnetico",
            "lei de faraday", "lei de lenz", "bobina", "transformador", "tesla",
            "linhas de inducao", "forca magnetica",
        ],
        "Física Moderna": [
            "efeito fotoeletrico", "foton", "relatividade", "planck", "quantizacao",
            "fissao nuclear", "fusao nuclear", "radioatividade", "meia-vida",
            "dualidade onda-particula",
        ],
    },
    "QUIMICA": {
        "Estrutura Atômica": [
            "numero atomico", "numero de massa", "isotopo", "distribuicao eletronica",
            "camada de valencia", "modelo atomico", "rutherford", "bohr", "protons",
            "neutrons", "eletrons", "nivel de energia",
        ],
        "Tabela Periódica e Ligações": [
            "tabela periodica", "ligacao ionica", "ligacao covalente", "eletronegatividade",
            "geometria molecular", "polaridade", "ligacao metalica", "ligacao de hidrogenio",
            "forca intermolecular", "van der waals", "familia da tabela", "raio atomico",
        ],
        "Estequiometria": [
            "massa molar", "numero de avogadro", "balanceamento", "reagente limitante",
            "rendimento da reacao", "proporcao estequiometrica", "mols de", "quantidade de materia",
        ],
        "Soluções": [
            "concentracao em mol", "molaridade", "diluicao", "solubilidade", "soluto",
            "solvente", "ppm", "titulo em massa", "propriedade coligativa", "osmose",
            "ebulioscopia", "crioscopia", "curva de solubilidade",
        ],
        "Termoquímica": [
            "entalpia", "exotermica", "endotermica", "calor de reacao", "lei de hess",
            "energia de ligacao", "entalpia de combustao", "variacao de entalpia",
        ],
        "Cinética Química": [
            "velocidade da reacao", "catalisador", "energia de ativacao",
            "teoria das colisoes", "ordem de reacao", "complexo ativado",
        ],
        "Equilíbrio e pH": [
            "equilibrio quimico", "constante de equilibrio", "le chatelier", "ph",
            "poh", "acido forte", "base fraca", "hidrolise salina", "tampao",
            "grau de ionizacao", "indicador acido-base", "neutralizacao",
        ],
        "Eletroquímica": [
            "pilha", "eletrolise", "oxidacao", "reducao", "numero de oxidacao",
            "potencial de reducao", "anodo", "catodo", "corrosao", "agente oxidante",
            "agente redutor", "ponte salina",
        ],
        "Química Orgânica": [
            "hidrocarboneto", "alcano", "alceno", "alcino", "alcool", "aldeido",
            "cetona", "acido carboxilico", "ester", "eter", "amina", "amida",
            "benzeno", "aromatico", "isomeria", "polimero", "saponificacao",
            "cadeia carbonica", "funcao organica", "carbono quiral", "esterificacao",
        ],
        "Radioatividade": [
            "particula alfa", "particula beta", "raio gama", "decaimento radioativo",
            "meia-vida", "isotopo radioativo", "transmutacao",
        ],
    },
    "BIOLOGIA": {
        "Citologia": [
            "membrana plasmatica", "mitocondria", "ribossomo", "reticulo endoplasmatico",
            "complexo de golgi", "lisossomo", "citoplasma", "organela", "transporte ativo",
            "difusao", "osmose", "parede celular", "celula procarionte", "celula eucarionte",
            "nucleo celular", "citoesqueleto",
        ],
        "Bioquímica e Metabolismo": [
            "enzima", "substrato", "atp", "glicolise", "respiracao celular", "fermentacao",
            "fotossintese", "ciclo de krebs", "cadeia respiratoria", "clorofila",
            "aminoacido", "ligacao peptidica", "carboidrato", "lipidio", "metabolismo",
        ],
        "Genética": [
            "alelo", "dominante", "recessivo", "heredograma", "mendel", "genotipo",
            "fenotipo", "cromossomo", "dna", "rna", "transcricao", "traducao",
            "codigo genetico", "mutacao", "grupo sanguineo", "daltonismo", "hemofilia",
            "cruzamento", "heterozigoto", "homozigoto", "linkage",
        ],
        "Evolução": [
            "selecao natural", "darwin", "lamarck", "especiacao", "adaptacao",
            "deriva genetica", "ancestral comum", "fossil", "evolucao das especies",
            "isolamento reprodutivo", "orgao homologo", "orgao analogo",
        ],
        "Ecologia": [
            "ecossistema", "cadeia alimentar", "teia alimentar", "nicho ecologico",
            "habitat", "sucessao ecologica", "bioma", "ciclo do carbono",
            "ciclo do nitrogenio", "biodiversidade", "produtor", "consumidor",
            "decompositor", "piramide ecologica", "efeito estufa", "eutrofizacao",
            "relacao ecologica", "predatismo", "mutualismo",
        ],
        "Fisiologia Humana": [
            "sistema digestorio", "sistema circulatorio", "sistema respiratorio",
            "sistema nervoso", "hormonio", "insulina", "glicemia", "rim", "nefron",
            "coracao", "pulmao", "neuronio", "sinapse", "hemacia", "pressao arterial",
            "sistema endocrino", "tireoide", "adrenalina", "excretor", "alveolo",
        ],
        "Imunologia e Microbiologia": [
            "anticorpo", "antigeno", "vacina", "virus", "bacteria", "imunidade",
            "linfocito", "antibiotico", "patogeno", "soro", "infeccao", "protozoario",
            "fungo", "epidemia", "vetor da doenca", "verminose",
        ],
        "Botânica": [
            "xilema", "floema", "estomato", "angiosperma", "gimnosperma", "briofita",
            "pteridofita", "transpiracao vegetal", "auxina", "germinacao", "raiz",
            "caule", "polinizacao", "fruto", "semente", "seiva",
        ],
        "Zoologia": [
            "artropode", "molusco", "anelideo", "vertebrado", "mamifero", "ave",
            "reptil", "anfibio", "peixe", "porifero", "cnidario", "platelminto",
            "nematelminto", "equinodermo", "inseto", "crustaceo",
        ],
        "Reprodução e Embriologia": [
            "gameta", "fecundacao", "embriao", "blastocisto", "gastrulacao", "placenta",
            "meiose", "mitose", "espermatozoide", "ovulo", "ciclo menstrual",
            "folheto embrionario", "ectoderme", "mesoderme", "endoderme",
        ],
    },
    "MATEMATICA": {
        "Funções": [
            "funcao afim", "funcao quadratica", "parabola", "dominio da funcao",
            "imagem da funcao", "funcao exponencial", "funcao logaritmica", "vertice",
            "raiz da funcao", "funcao inversa", "grafico da funcao", "f(x)",
        ],
        "Geometria Plana": [
            "triangulo", "quadrilatero", "circunferencia", "area do", "perimetro",
            "teorema de pitagoras", "semelhanca de triangulos", "poligono", "apotema",
            "angulo interno", "trapezio", "losango", "setor circular",
        ],
        "Geometria Espacial": [
            "volume do", "cilindro", "cone", "esfera", "prisma", "piramide", "poliedro",
            "aresta", "face do solido", "tronco de", "area total do solido", "cubo",
        ],
        "Geometria Analítica": [
            "plano cartesiano", "coeficiente angular", "distancia entre os pontos",
            "ponto medio", "equacao da reta", "equacao da circunferencia", "reta paralela",
            "reta perpendicular",
        ],
        "Trigonometria": [
            "seno", "cosseno", "tangente", "radiano", "lei dos senos", "lei dos cossenos",
            "arco", "circulo trigonometrico", "funcao trigonometrica",
        ],
        "Probabilidade": [
            "probabilidade", "espaco amostral", "evento", "sorteado ao acaso",
            "chance de", "aleatoriamente",
        ],
        "Análise Combinatória": [
            "combinacao", "permutacao", "arranjo", "fatorial", "principio multiplicativo",
            "anagrama", "de quantas maneiras", "quantos numeros distintos",
        ],
        "Estatística": [
            "media aritmetica", "mediana", "moda", "desvio padrao", "variancia",
            "frequencia relativa", "histograma", "amostra", "grafico de setores",
        ],
        "Progressões": [
            "progressao aritmetica", "progressao geometrica", "termo geral", "razao da",
            "soma dos termos", " pa ", " pg ",
        ],
        "Matrizes e Sistemas": [
            "matriz", "determinante", "sistema linear", "escalonamento", "incognita",
        ],
        "Matemática Financeira": [
            "juros simples", "juros compostos", "porcentagem", "desconto", "montante",
            "taxa de juros", "capital inicial", "acrescimo de",
        ],
        "Logaritmos": ["logaritmo", "log ", "propriedade do logaritmo", "base do logaritmo"],
    },
    "PORTUGUES": {
        "Gramática e Sintaxe": [
            "oracao subordinada", "oracao coordenada", "sujeito", "predicado",
            "regencia", "concordancia", "crase", "pronome", "conjuncao", "preposicao",
            "verbo transitivo", "adjunto", "aposto", "vocativo", "voz passiva",
        ],
        "Semântica e Coesão": [
            "coesao", "coerencia", "referente", "ambiguidade", "sinonimo", "antonimo",
            "conector", "retoma um termo", "elemento coesivo", "conotativo", "denotativo",
        ],
        "Figuras de Linguagem": [
            "metafora", "metonimia", "ironia", "hiperbole", "eufemismo", "personificacao",
            "prosopopeia", "antitese", "paradoxo", "pleonasmo", "aliteracao", "sinestesia",
        ],
        "Literatura": [
            "romantismo", "modernismo", "barroco", "arcadismo", "realismo", "naturalismo",
            "parnasianismo", "simbolismo", "trovadorismo", "quinhentismo", "eu lirico",
            "soneto", "estrofe", "verso", "geracao modernista", "semana de arte moderna",
        ],
        "Variação Linguística": [
            "variedade linguistica", "norma culta", "linguagem coloquial", "giria",
            "regionalismo", "registro formal", "modalidade nao padrao",
        ],
        "Interpretação de Texto": [
            "de acordo com o texto", "depreende-se", "o autor defende", "tese do texto",
            "finalidade do texto", "no contexto em que se insere", "infere-se",
        ],
    },
    "HISTORIA": {
        "Brasil Colônia": [
            "capitania", "sesmaria", "bandeirante", "engenho", "quilombo",
            "pacto colonial", "colonizacao portuguesa", "escravidao colonial",
            "inconfidencia", "companhia de jesus",
        ],
        "Brasil Império": [
            "independencia do brasil", "dom pedro", "regencia", "segundo reinado",
            "abolicao", "lei aurea", "guerra do paraguai", "cafe com leite",
            "proclamacao da republica", "imigracao europeia",
        ],
        "Brasil República": [
            "republica velha", "coronelismo", "getulio vargas", "estado novo",
            "ditadura militar", "ai-5", "diretas ja", "constituicao de 1988",
            "tenentismo", "populismo", "revolucao de 1930",
        ],
        "Antiguidade e Idade Média": [
            "mesopotamia", "egito antigo", "grecia antiga", "roma antiga", "feudalismo",
            "idade media", "cruzada", "senhor feudal", "servo", "imperio bizantino",
            "polis", "democracia ateniense",
        ],
        "Idade Moderna": [
            "renascimento", "reforma protestante", "absolutismo", "iluminismo",
            "revolucao francesa", "revolucao industrial", "mercantilismo",
            "grandes navegacoes", "revolucao inglesa",
        ],
        "Século XX e Contemporânea": [
            "primeira guerra", "segunda guerra", "guerra fria", "nazismo", "fascismo",
            "revolucao russa", "imperialismo", "descolonizacao", "muro de berlim",
            "holocausto", "guerra do vietna",
        ],
    },
    "GEOGRAFIA": {
        "Geopolítica e Globalização": [
            "globalizacao", "bloco economico", "mercosul", "uniao europeia", "otan",
            "geopolitica", "conflito territorial", "onu", "brics", "guerra comercial",
        ],
        "Climatologia e Meio Ambiente": [
            "clima tropical", "massa de ar", "efeito estufa", "aquecimento global",
            "desmatamento", "camada de ozonio", "chuva acida", "el nino",
            "mudanca climatica", "inversao termica", "ilha de calor",
        ],
        "Geomorfologia e Hidrografia": [
            "relevo", "placa tectonica", "erosao", "bacia hidrografica", "solo",
            "intemperismo", "planalto", "depressao", "aquifero", "rio",
        ],
        "População e Urbanização": [
            "urbanizacao", "migracao", "densidade demografica", "piramide etaria",
            "taxa de natalidade", "expectativa de vida", "metropole", "favela",
            "êxodo rural", "conurbacao", "idh",
        ],
        "Economia e Produção": [
            "agropecuaria", "agronegocio", "industrializacao", "matriz energetica",
            "setor terciario", "pib", "reforma agraria", "commodity", "energia renovavel",
        ],
        "Cartografia": [
            "escala do mapa", "projecao cartografica", "latitude", "longitude",
            "fuso horario", "curva de nivel", "coordenada geografica",
        ],
    },
}

# termo que aparece em varios temas da MESMA disciplina vale menos
PESOS: dict[str, dict[str, dict[str, float]]] = {}
for disciplina, temas in TEMAS.items():
    freq: dict[str, int] = collections.Counter()
    for termos in temas.values():
        for t in termos:
            freq[t] += 1
    PESOS[disciplina] = {
        tema: {t: 1.0 / freq[t] for t in termos} for tema, termos in temas.items()
    }


# Mesmo defeito que havia na disciplina, e aqui pior: contar substring fazia
# "esfera" casar em "atmosfera", "onda" em "redonda", "ave" em "chave", "reta"
# em "correta", "cone" em "silicone". Um enunciado sobre atmosfera virava
# Geometria Espacial. Termo de uma palavra agora compara com a palavra inteira.
_UMA: dict[str, dict[str, dict[str, float]]] = {}
_COMP: dict[str, dict[str, list[tuple[re.Pattern, float]]]] = {}
for _disc, _temas in PESOS.items():
    _UMA[_disc] = {}
    _COMP[_disc] = {}
    for _tema, _termos in _temas.items():
        _UMA[_disc][_tema] = {}
        _COMP[_disc][_tema] = []
        for _termo, _peso in _termos.items():
            _limpo = _termo.strip()
            if not _limpo:
                continue
            if " " in _limpo or "-" in _limpo:
                _COMP[_disc][_tema].append(
                    (re.compile(rf"\b{re.escape(_limpo)}\b"), _peso)
                )
            else:
                _UMA[_disc][_tema][_limpo] = _peso

_PALAVRAS = re.compile(r"[a-z0-9]+")


def pontuar(texto: str, disciplina: str) -> dict[str, float]:
    if disciplina not in PESOS:
        return {}
    t = norm(texto)
    palavras = collections.Counter(_PALAVRAS.findall(t))
    pontos: dict[str, float] = {}
    for tema in PESOS[disciplina]:
        soma = 0.0
        for termo, peso in _UMA[disciplina][tema].items():
            n = palavras.get(termo, 0)
            if n:
                soma += peso * (1 + 0.4 * (min(n, 4) - 1))
        for padrao, peso in _COMP[disciplina][tema]:
            n = len(padrao.findall(t))
            if n:
                soma += peso * (1 + 0.4 * (min(n, 4) - 1))
        if soma:
            pontos[tema] = round(soma, 3)
    return pontos


def decidir(pontos: dict[str, float]) -> tuple[str | None, float, float]:
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
    ap = argparse.ArgumentParser()
    ap.add_argument("--amostra", type=int, default=0, help="imprime N classificacoes para conferir")
    args = ap.parse_args()

    questoes = [json.loads(l) for l in QUESTOES.open(encoding="utf-8") if l.strip()]
    disc = {}
    for l in DISCIPLINAS.open(encoding="utf-8"):
        if l.strip():
            s = json.loads(l)
            disc[(s["sha256"], s["numero"], s["pagina"])] = s.get("disciplina")

    # o texto de apoio mora no enunciado de outra questao (etapa 07)
    enunciados = {}
    for q in questoes:
        if q["numero"] is not None:
            enunciados.setdefault((q["rel_path"], q["numero"]), q["enunciado"])

    saida = []
    for q in questoes:
        disciplina = disc.get((q["sha256"], q["numero"], q["pagina"]))
        texto = q["enunciado"] + " " + " ".join(a["texto"] for a in q["alternativas"])
        # texto de apoio extraido na etapa 07; o campo antigo fica de reserva
        ctx = q.get("contexto_texto")
        if not ctx and q.get("contexto_numero") is not None:
            ctx = enunciados.get((q["rel_path"], q["contexto_numero"]))
        if ctx:
            texto = ctx + " " + texto
        tema, p1, p2 = (None, 0.0, 0.0)
        if disciplina:
            tema, p1, p2 = decidir(pontuar(texto, disciplina))
        saida.append(
            {
                "sha256": q["sha256"],
                "numero": q["numero"],
                "pagina": q["pagina"],
                "disciplina": disciplina,
                "tema": tema,
                "pontos": p1,
                "segunda": p2,
            }
        )

    with OUT.open("w", encoding="utf-8") as f:
        for r in saida:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    com_disc = [r for r in saida if r["disciplina"]]
    com_tema = [r for r in saida if r["tema"]]
    validas = [
        r for r, q in zip(saida, questoes)
        if r["tema"] and not q["problemas"] and q.get("gabarito_letra")
        and not q.get("duplicata_de") and not q.get("conflito_duplicata")
    ]
    por_disc = collections.Counter(r["disciplina"] for r in com_tema)
    por_tema = collections.Counter(f"{r['disciplina']} / {r['tema']}" for r in validas)

    print("================ TEMA ================")
    print(f"Questoes                 : {len(saida)}")
    print(f"  com disciplina         : {len(com_disc)}")
    print(f"  com tema               : {len(com_tema)} ({len(com_tema)/max(1,len(com_disc))*100:.1f}% das que tem disciplina)")
    print(f"  com tema E utilizaveis : {len(validas)}")
    print("\nTemas atribuidos por disciplina:")
    for d, n in por_disc.most_common():
        print(f"  {d:22s} {n}")
    print("\nTemas com mais questoes utilizaveis:")
    for t, n in por_tema.most_common(20):
        print(f"  {t:44s} {n}")

    if args.amostra:
        rnd = random.Random(20260820)
        indices = [i for i, r in enumerate(saida) if r["tema"]]
        print("\n================ AMOSTRA PARA CONFERIR ================")
        for i in rnd.sample(indices, min(args.amostra, len(indices))):
            q, r = questoes[i], saida[i]
            texto = " ".join(q["enunciado"].split())[:210]
            print(f"\n[{r['disciplina']} / {r['tema']}] pontos={r['pontos']} (2a={r['segunda']})")
            print(f"  {texto}")
    print(f"\nEscrito em: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
