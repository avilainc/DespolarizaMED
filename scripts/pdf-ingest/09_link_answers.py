# -*- coding: utf-8 -*-
"""
Etapa 9 - Ligacao questao <-> gabarito.

Junta data/questions.jsonl com data/answers.jsonl e produz
data/questions_final.jsonl, onde cada questao pode ou nao ter `gabarito_letra`.

A ligacao e' deliberadamente conservadora. So' vincula quando da' para provar
que o gabarito e' daquela prova:

  1. mesmo (instituicao, ano, fase, curso);
  2. um unico gabarito candidato no grupo — havendo mais de um, tenta-se
     desempatar por quantidade de questoes; sem desempate claro, nao vincula;
  3. os numeros da prova precisam estar contidos no gabarito em pelo menos 80%.

Questao sem resposta continua no banco, com `gabarito_letra` nulo. O que nao
entra e' resposta adivinhada.
"""
from __future__ import annotations

import collections
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, norm  # noqa: E402

QUESTIONS = DATA / "questions.jsonl"
ANSWERS = DATA / "answers.jsonl"
OUT = DATA / "questions_final.jsonl"

COBERTURA_MINIMA = 0.80


def chave(d: dict) -> tuple:
    return (d.get("instituicao_slug"), d.get("ano"), d.get("fase"), d.get("curso"))


def pasta(rel_path: str) -> str:
    return rel_path.rsplit("/", 1)[0] if "/" in rel_path else ""


# Abreviacao usada no nome do arquivo -> raiz da palavra no cabecalho da coluna
MATERIAS = {
    "bio": "biolog",
    "fis": "fisic",
    "mat": "matemat",
    "por": "portugu",
    "his": "histor",
    "geo": "geograf",
    "qui": "quimic",
    "ing": "ingl",
    "esp": "espanhol",
    "lit": "literatur",
    "filo": "filosof",
    "soc": "sociolog",
    "red": "redac",
}


def materia_do_nome(rel_path: str) -> str | None:
    """Matéria declarada no nome do arquivo (…_BIO.pdf, …_2D_ESP.pdf)."""
    nome = norm(rel_path.rsplit("/", 1)[-1])
    achados = {v for k, v in MATERIAS.items() if re.search(rf"[_\-\s]{k}[_\-\s.]", nome)}
    return achados.pop() if len(achados) == 1 else None


def escolher_coluna(gab: dict, numeros: set[int], rel_prova: str) -> dict | None:
    """Escolhe uma das chaves de um gabarito impresso em varias colunas.

    A PUC-RS publica num unico PDF a chave do 1o dia (questoes 1-30: Fisica,
    Biologia, Portugues) ao lado da do 2o dia (1-60: as demais). As duas se
    sobrepoem na faixa 1-30, entao a numeracao sozinha nao decide.

    Duas evidencias resolvem, nesta ordem:
      1. a coluna precisa conter os numeros daquela prova — o arquivo
         `…_2D_ESP.pdf` tem questoes 51 a 60, e so' a coluna do 2o dia chega la';
      2. empatando, a materia declarada no nome do arquivo (`_BIO`) tem que
         aparecer na lista de materias do cabecalho da coluna.
    Sem decisao unica, nao vincula.
    """
    colunas = gab.get("colunas") or []
    if len(colunas) < 2 or not numeros:
        return None

    cobrem = []
    for c in colunas:
        nums = {int(k) for k in c["respostas"]}
        if len(numeros & nums) / len(numeros) >= COBERTURA_MINIMA:
            cobrem.append(c)
    if len(cobrem) == 1:
        return cobrem[0]
    if not cobrem:
        return None

    materia = materia_do_nome(rel_prova)
    if not materia:
        return None
    com_materia = [c for c in cobrem if materia in norm(c.get("cabecalho") or "")]
    return com_materia[0] if len(com_materia) == 1 else None


def escolher_gabarito(
    candidatos: list[dict],
    numeros: set[int],
    pasta_prova: str | None = None,
    codigos_prova: set[str] | None = None,
) -> tuple[dict | None, str]:
    """Devolve (gabarito, motivo)."""
    uteis = [g for g in candidatos if g["n_respostas"] >= 5]
    if not uteis:
        return None, "sem_gabarito"
    if len(uteis) == 1:
        return uteis[0], "unico"

    # Desempate mais forte: o codigo que a grafica imprime no cabecalho e' o
    # mesmo na prova e no gabarito da mesma aplicacao ("FMRP1401").
    if codigos_prova:
        mesmo_codigo = [g for g in uteis if codigos_prova & set(g.get("codigos") or [])]
        if len(mesmo_codigo) == 1:
            return mesmo_codigo[0], "mesmo_codigo"
        if len(mesmo_codigo) > 1:
            uteis = mesmo_codigo

    # No acervo, prova e gabarito da mesma aplicacao ficam na mesma pasta.
    # E' o desempate mais confiavel quando o ano tem varios gabaritos.
    if pasta_prova is not None:
        mesma_pasta = [g for g in uteis if pasta(g["rel_path"]) == pasta_prova]
        if len(mesma_pasta) == 1:
            return mesma_pasta[0], "mesma_pasta"
        if len(mesma_pasta) > 1:
            uteis = mesma_pasta

    # varios candidatos: fica o que cobre melhor os numeros desta prova
    pontuados = []
    for g in uteis:
        nums = {int(k) for k in g["respostas"]}
        cobertura = len(numeros & nums) / len(numeros) if numeros else 0
        pontuados.append((cobertura, g))
    pontuados.sort(key=lambda t: -t[0])
    if pontuados[0][0] >= COBERTURA_MINIMA and (
        len(pontuados) == 1 or pontuados[0][0] > pontuados[1][0] + 0.05
    ):
        return pontuados[0][1], "melhor_cobertura"
    return None, "gabarito_ambiguo"


def main() -> int:
    questoes = [json.loads(l) for l in QUESTIONS.open(encoding="utf-8")]
    gabaritos = [json.loads(l) for l in ANSWERS.open(encoding="utf-8")]
    codigos_por_prova = {
        d["rel_path"]: d.get("codigos") or []
        for d in (json.loads(l) for l in (DATA / "documents.jsonl").open(encoding="utf-8"))
    }

    por_chave: dict[tuple, list[dict]] = collections.defaultdict(list)
    for g in gabaritos:
        por_chave[chave(g)].append(g)
    # gabarito sem fase serve de reserva para o grupo inteiro daquele ano
    por_ano: dict[tuple, list[dict]] = collections.defaultdict(list)
    for g in gabaritos:
        por_ano[(g.get("instituicao_slug"), g.get("ano"))].append(g)

    questoes_por_prova: dict[str, list[dict]] = collections.defaultdict(list)
    for q in questoes:
        questoes_por_prova[q["rel_path"]].append(q)

    motivos = collections.Counter()
    com_resposta = 0
    anuladas = 0
    saida = []

    for rel, qs in questoes_por_prova.items():
        base = qs[0]
        numeros = {q["numero"] for q in qs if q["numero"] is not None}

        dir_prova = pasta(rel)
        codigos_prova = set(codigos_por_prova.get(rel) or [])
        cands = por_chave.get(chave(base), [])
        gab, motivo = escolher_gabarito(cands, numeros, dir_prova, codigos_prova)
        if gab is None and motivo in ("sem_gabarito", "gabarito_ambiguo"):
            gab, motivo2 = escolher_gabarito(
                por_ano.get((base.get("instituicao_slug"), base.get("ano")), []),
                numeros,
                dir_prova,
                codigos_prova,
            )
            motivo = motivo2 if gab is not None else motivo

        respostas = {int(k): v for k, v in gab["respostas"].items()} if gab else {}
        anuladas_gab = set(gab["anuladas"]) if gab else set()

        cobertura = (
            len(numeros & set(respostas)) / len(numeros) if numeros and respostas else 0.0
        )
        vincula = bool(gab) and cobertura >= COBERTURA_MINIMA

        # a chave inteira nao serve, mas o gabarito pode ter mais de uma coluna
        if gab and not vincula:
            coluna = escolher_coluna(gab, numeros, rel)
            if coluna:
                respostas = {int(k): v for k, v in coluna["respostas"].items()}
                cobertura = len(numeros & set(respostas)) / len(numeros)
                vincula = True
                motivo = "coluna_do_gabarito"

        if gab and not vincula:
            motivo = "cobertura_insuficiente"
        motivos[motivo if not vincula else f"ok_{motivo}"] += len(qs)

        for q in qs:
            letra = None
            anulada = False
            if vincula and q["numero"] is not None:
                if q["numero"] in anuladas_gab:
                    anulada = True
                    anuladas += 1
                letra = respostas.get(q["numero"])
                if letra:
                    # a letra tem que existir entre as alternativas lidas
                    if letra not in {a["letra"] for a in q["alternativas"]}:
                        letra = None
                    else:
                        com_resposta += 1
            saida.append(
                {
                    **q,
                    "gabarito_letra": letra,
                    "gabarito_rel_path": gab["rel_path"] if vincula else None,
                    "gabarito_sha256": gab["sha256"] if vincula else None,
                    "anulada": anulada,
                    "cobertura_gabarito": round(cobertura, 3),
                    "motivo_ligacao": motivo if not vincula else f"ok_{motivo}",
                }
            )

    with OUT.open("w", encoding="utf-8") as f:
        for q in saida:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    aprovadas = [q for q in saida if not q["problemas"]]
    completas = [q for q in aprovadas if q["gabarito_letra"]]

    print("================ LIGACAO ================")
    print(f"Questoes             : {len(saida)}")
    print(f"  aprovadas na etapa 7: {len(aprovadas)}")
    print(f"  com gabarito        : {com_resposta}")
    print(f"  APROVADAS + GABARITO: {len(completas)}")
    print(f"Anuladas marcadas    : {anuladas}")
    print("\nMotivo da ligacao (por questao):")
    for m, c in motivos.most_common():
        print(f"  {m:26s} {c}")
    print(f"\nEscrito em: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
