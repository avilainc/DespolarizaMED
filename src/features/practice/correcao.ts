/**
 * Motor de correção (roadmap §6.2), puro e sem banco: recebe as questões de
 * uma prova e as respostas dadas, devolve nota e o diagnóstico por tema.
 *
 * Regras:
 * - acerto = resposta registrada com `correta = true`; em branco não é erro.
 * - o tema de uma questão é `temaSugerido`, caindo para `disciplinaSugerida`
 *   e por fim para "Sem classificação".
 * - forte  = aproveitamento ≥ 70% com pelo menos 2 questões no tema.
 * - revisar = aproveitamento < 50% (qualquer quantidade).
 */

export type QuestaoCorrigivel = {
  id: string;
  disciplinaSugerida: string | null;
  temaSugerido: string | null;
};

export type RespostaDada = { correta: boolean };

export type TemaAvaliado = { nome: string; total: number; acertos: number; pct: number };

export type ResultadoCorrecao = {
  total: number;
  acertos: number;
  erros: number;
  emBranco: number;
  percentual: number;
  temas: TemaAvaliado[];
  fortes: TemaAvaliado[];
  revisar: TemaAvaliado[];
};

export const LIMIAR_FORTE = 0.7;
export const LIMIAR_REVISAR = 0.5;
export const MINIMO_PARA_FORTE = 2;

export function nomeDoTema(q: QuestaoCorrigivel) {
  return q.temaSugerido ?? q.disciplinaSugerida ?? "Sem classificação";
}

export function classificarTemas(temas: TemaAvaliado[]) {
  const fortes = temas
    .filter((t) => t.total >= MINIMO_PARA_FORTE && t.pct >= LIMIAR_FORTE)
    .sort((a, b) => b.pct - a.pct || b.total - a.total);
  const revisar = temas.filter((t) => t.pct < LIMIAR_REVISAR).sort((a, b) => a.pct - b.pct || b.total - a.total);
  return { fortes, revisar };
}

export function corrigirTentativa(
  questoes: QuestaoCorrigivel[],
  respostas: ReadonlyMap<string, RespostaDada>,
): ResultadoCorrecao {
  const total = questoes.length;
  let acertos = 0;
  let emBranco = 0;
  const porTema = new Map<string, { total: number; acertos: number }>();

  for (const q of questoes) {
    const r = respostas.get(q.id);
    const nome = nomeDoTema(q);
    const agg = porTema.get(nome) ?? { total: 0, acertos: 0 };
    agg.total += 1;
    if (!r) emBranco += 1;
    else if (r.correta) {
      acertos += 1;
      agg.acertos += 1;
    }
    porTema.set(nome, agg);
  }

  const temas = [...porTema.entries()].map(([nome, a]) => ({
    nome,
    ...a,
    pct: a.total ? a.acertos / a.total : 0,
  }));
  const { fortes, revisar } = classificarTemas(temas);

  return {
    total,
    acertos,
    erros: total - acertos - emBranco,
    emBranco,
    percentual: total ? Math.round((acertos / total) * 100) : 0,
    temas,
    fortes,
    revisar,
  };
}
