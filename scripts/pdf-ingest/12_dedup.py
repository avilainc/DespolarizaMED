# -*- coding: utf-8 -*-
"""
Etapa 12 - Duplicatas e validacao cruzada.

A mesma prova aparece no acervo em varios cadernos (AZUL, AMARELO, BRANCO) e em
copias em pastas diferentes. Cada copia foi extraida de forma independente, o
que da' uma SEGUNDA OPINIAO de graca sobre cada questao.

O detalhe que importa: entre cadernos, a banca embaralha as alternativas. A
questao 12 do caderno azul pode ser a letra C e a mesma questao no amarelo ser
a letra A — as duas certas. Entao a conferencia nao pode ser pela LETRA, e sim
pelo TEXTO da alternativa correta.

  - textos batem  -> `confirmada_por_duplicata`: duas extracoes independentes
                     chegaram na mesma resposta
  - textos diferem -> `conflito_duplicata`: uma das duas esta' errada, as duas
                     ficam marcadas para revisao

Tambem elege uma copia canonica por grupo, para a plataforma nao mostrar a
mesma questao tres vezes.

Uso: python scripts/pdf-ingest/12_dedup.py
"""
from __future__ import annotations

import collections
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdfx import DATA, norm  # noqa: E402

ARQ = DATA / "questions_final.jsonl"

RE_NUM_INICIAL = re.compile(r"^\s*(?:quest[ãa]o\s*)?\d{1,3}[\s.):–-]*", re.I)
RE_ESPACO = re.compile(r"\s+")


def impressao(texto: str, tamanho: int = 320) -> str | None:
    """Assinatura do enunciado, sem o numero da questao nem variacao de espaco."""
    t = RE_NUM_INICIAL.sub("", texto or "")
    t = RE_ESPACO.sub(" ", norm(t)).strip()
    t = re.sub(r"[^a-z0-9 ]", "", t)
    if len(t) < 60:
        return None
    return hashlib.sha1(t[:tamanho].encode("utf-8")).hexdigest()


def alternativas_normalizadas(q: dict) -> set[str]:
    saida = set()
    for a in q["alternativas"]:
        t = RE_ESPACO.sub(" ", norm(a["texto"])).strip()
        t = re.sub(r"[^a-z0-9 ]", "", t)[:40]
        if t:
            saida.add(t)
    return saida


def mesma_questao(a: dict, b: dict) -> bool:
    """Confirma que duas questoes de enunciado parecido sao mesmo a mesma.

    Enunciado curto e generico colide: "A sequencia correta de preenchimento
    dos parenteses, de cima para baixo, e'" e' identico em provas diferentes,
    com textos-base diferentes. So' o enunciado dava 5 falsos conflitos —
    questoes distintas acusadas de ter respostas divergentes.

    As alternativas desempatam: copias da mesma questao compartilham quase
    todas (mesmo embaralhadas entre cadernos); questoes diferentes, quase
    nenhuma.
    """
    x, y = alternativas_normalizadas(a), alternativas_normalizadas(b)
    if not x or not y:
        return False
    return len(x & y) / max(len(x), len(y)) >= 0.5


def compativel(t1: str, t2: str) -> bool:
    """Mesmo texto a menos de sujeira grudada na ponta."""
    return t1 == t2 or t1.startswith(t2) or t2.startswith(t1)


def texto_correta(q: dict) -> str | None:
    if not q.get("gabarito_letra"):
        return None
    for a in q["alternativas"]:
        if a["letra"] == q["gabarito_letra"]:
            t = RE_ESPACO.sub(" ", norm(a["texto"])).strip()
            t = re.sub(r"[^a-z0-9 ]", "", t)
            return t[:120] or None
    return None


def qualidade(q: dict) -> tuple:
    """Ordena candidatos a copia canonica: melhor primeiro."""
    return (
        0 if not q["problemas"] else 1,
        0 if q.get("gabarito_letra") else 1,
        -len(q["enunciado"]),
        q["rel_path"],
    )


def main() -> int:
    questoes = [json.loads(l) for l in ARQ.open(encoding="utf-8")]

    grupos: dict[str, list[int]] = collections.defaultdict(list)
    for i, q in enumerate(questoes):
        h = impressao(q["enunciado"])
        q["impressao"] = h
        q["duplicata_de"] = None
        q["copias"] = 1
        q["confirmada_por_duplicata"] = False
        q["conflito_duplicata"] = False
        if h:
            grupos[h].append(i)

    repetidas = 0
    confirmadas = 0
    conflitos = 0
    grupos_multi = 0
    exemplos_conflito = []

    falsos_grupos = 0
    for h, todos in grupos.items():
        if len(todos) < 2:
            continue

        # o enunciado agrupou; as alternativas confirmam (ou desmentem)
        blocos: list[list[int]] = []
        for i in todos:
            for bloco in blocos:
                if mesma_questao(questoes[i], questoes[bloco[0]]):
                    bloco.append(i)
                    break
            else:
                blocos.append([i])
        if len(blocos) > 1:
            falsos_grupos += 1

        for idxs in blocos:
            if len(idxs) < 2:
                continue
            grupos_multi += 1
            membros = [questoes[i] for i in idxs]

            respostas: dict[str, list[int]] = {}
            for i in idxs:
                t = texto_correta(questoes[i])
                if t is None:
                    continue
                for existente in respostas:
                    if compativel(existente, t):
                        respostas[existente].append(i)
                        break
                else:
                    respostas[t] = [i]

            com_resposta = sum(len(v) for v in respostas.values())
            if len(respostas) == 1 and com_resposta >= 2:
                confirmadas += com_resposta
                for i in idxs:
                    if texto_correta(questoes[i]):
                        questoes[i]["confirmada_por_duplicata"] = True
            elif len(respostas) > 1:
                conflitos += com_resposta
                for i in idxs:
                    if texto_correta(questoes[i]):
                        questoes[i]["conflito_duplicata"] = True
                if len(exemplos_conflito) < 5:
                    exemplos_conflito.append(
                        {
                            "enunciado": membros[0]["enunciado"][:90],
                            "respostas": {k[:52]: len(v) for k, v in respostas.items()},
                            "arquivos": [questoes[i]["rel_path"][-46:] for i in idxs][:3],
                        }
                    )

            canonica = min(idxs, key=lambda i: qualidade(questoes[i]))
            for i in idxs:
                questoes[i]["copias"] = len(idxs)
                if i != canonica:
                    questoes[i]["duplicata_de"] = (
                        questoes[canonica]["rel_path"] + "#" + str(questoes[canonica]["numero"])
                    )
                    repetidas += 1

    with ARQ.open("w", encoding="utf-8") as f:
        for q in questoes:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    validadas = [q for q in questoes if not q["problemas"] and q.get("gabarito_letra")]
    unicas = [q for q in validadas if not q["duplicata_de"]]

    print("================ DUPLICATAS ================")
    print(f"Questoes                  : {len(questoes)}")
    print(f"Grupos com mais de 1 copia: {grupos_multi}")
    print(f"  desfeitos pelas alternativas: {falsos_grupos} (enunciado generico)")
    print(f"Copias redundantes        : {repetidas}")
    print(f"\nValidacao cruzada (pelo TEXTO da alternativa correta):")
    print(f"  confirmadas por duplicata: {confirmadas}")
    print(f"  em conflito              : {conflitos}")
    print(f"\nValidadas: {len(validadas)}  |  validadas distintas: {len(unicas)}")
    for e in exemplos_conflito:
        print(f"\n  conflito: {e['enunciado']!r}")
        for t, n in e["respostas"].items():
            print(f"     {n}x -> {t!r}")
        for a in e["arquivos"]:
            print(f"     {a}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
