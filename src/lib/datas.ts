/**
 * Dia de calendário × instante.
 *
 * O projeto tem dois tipos de "data" e confundi-los é a origem do bug de fuso
 * documentado no roadmap (seção 3):
 *
 * - **Instante**: um ponto na linha do tempo (início de um plantão, quando um
 *   pagamento foi processado). Vai para o Postgres como `timestamptz` e para o
 *   TypeScript como `Date`. Sem ambiguidade de fuso.
 * - **Dia de calendário**: a data da prova, a chave de um dia no plano de
 *   estudos. "2026-12-01" é o mesmo dia inteiro em qualquer fuso, não tem hora.
 *   Vai para o Postgres como `date` e para o TypeScript como a string ISO
 *   `"YYYY-MM-DD"` — nunca como `Date`, que sempre carrega uma hora junto.
 *
 * Os dois helpers aqui são a fronteira entre os dois mundos. A armadilha que
 * eles existem para evitar: `new Date("2026-12-01")` é lido pelo V8 como
 * meia-noite **UTC**, então em qualquer fuso a oeste de Greenwich (o Brasil
 * inteiro) ele volta como 30/11 ao ser exibido em hora local.
 */

/** Data sem hora, na forma ISO `"YYYY-MM-DD"`. */
export type DiaCalendario = string;

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

export function ehDiaCalendario(valor: string): valor is DiaCalendario {
  // A ida e volta rejeita data inexistente ("2026-02-31", "2026-13-01"), que o
  // construtor do Date aceita calado, rolando para o mês seguinte.
  return FORMATO.test(valor) && chaveDia(diaParaData(valor)) === valor;
}

/** O dia de calendário em que um instante cai, no fuso local de quem lê. */
export function chaveDia(d: Date): DiaCalendario {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * O `Date` da meia-noite **local** do dia informado. Use sempre isto em vez de
 * `new Date(dia)`, que ancora em UTC e volta um dia no Brasil.
 */
export function diaParaData(dia: DiaCalendario): Date {
  const [ano, mes, d] = dia.split("-").map(Number);
  return new Date(ano, mes - 1, d);
}

/** Quantos dias de calendário faltam de hoje até `dia` (0 se já passou). */
export function diasAte(dia: DiaCalendario, hoje = new Date()): number {
  const inicio = diaParaData(chaveDia(hoje));
  const fim = diaParaData(dia);
  return Math.max(0, Math.round((fim.getTime() - inicio.getTime()) / 86_400_000));
}
