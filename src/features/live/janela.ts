export const ANTECEDENCIA_MEET_MIN = 15;

/**
 * O link do Meet só é exposto dentro da janela [início − 15 min, fim]. A
 * decisão é tomada com o relógio do servidor (a página é Server Component);
 * o navegador nunca recebe a URL fora da janela.
 */
export function meetDisponivel(startsAt: Date, endsAt: Date, agora: Date, antecedenciaMin = ANTECEDENCIA_MEET_MIN) {
  const abre = startsAt.getTime() - antecedenciaMin * 60_000;
  const t = agora.getTime();
  return t >= abre && t <= endsAt.getTime();
}
