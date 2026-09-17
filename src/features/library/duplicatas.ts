/**
 * Agrupamento de duplicatas do acervo — a parte sem banco, para ser testável.
 *
 * A mesma questão aparece em vários cadernos. Uma das linhas é a canônica
 * (`duplicataDe === null`) e as outras apontam para ela. Quando as cópias
 * discordam do gabarito, todas entram na fila de revisão marcadas com
 * `conflitoDuplicata` — as cópias **e** a canônica.
 *
 * Daí a regra: o grupo é identificado pela raiz (`duplicataDe ?? id`), nunca
 * pelo id da linha exibida. Procurar por "quem aponta para este id" só acha
 * alguma coisa quando o item exibido é a canônica.
 */

export type MembroDoGrupo = {
  id: string;
  duplicataDe: string | null;
};

/** A questão que identifica o grupo: ela mesma, se for a canônica. */
export function raizDoGrupo(item: MembroDoGrupo): string {
  return item.duplicataDe ?? item.id;
}

/**
 * Para cada item, as **outras** linhas do seu grupo. O próprio item sai da
 * lista: a tela já mostra o gabarito dele, e o que o revisor precisa ver é o
 * contraste.
 */
export function agruparPorRaiz<T extends MembroDoGrupo>(
  itens: MembroDoGrupo[],
  linhas: T[],
): Map<string, T[]> {
  const porRaiz = new Map<string, T[]>();
  for (const linha of linhas) {
    const raiz = raizDoGrupo(linha);
    const lista = porRaiz.get(raiz) ?? [];
    lista.push(linha);
    porRaiz.set(raiz, lista);
  }

  const resultado = new Map<string, T[]>();
  for (const item of itens) {
    const grupo = porRaiz.get(raizDoGrupo(item)) ?? [];
    resultado.set(
      item.id,
      grupo.filter((linha) => linha.id !== item.id),
    );
  }
  return resultado;
}
