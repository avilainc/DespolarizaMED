// Paleta da Tabela Periódica — é só editar os hex abaixo pra trocar as cores.
export const PERIODIC_CATEGORIES: Record<string, { label: string; color: string }> = {
  hidrogenio: { label: 'Hidrogênio', color: '#38bdf8' },
  alcalino: { label: 'Metais alcalinos', color: '#f87171' },
  'alcalino-terroso': { label: 'Alcalino-terrosos', color: '#fb923c' },
  transicao: { label: 'Metais de transição', color: '#facc15' },
  'pos-transicao': { label: 'Outros metais', color: '#a3a3a3' },
  semimetal: { label: 'Semimetais', color: '#2dd4bf' },
  ametal: { label: 'Ametais', color: '#4ade80' },
  halogenio: { label: 'Halogênios', color: '#a78bfa' },
  'gas-nobre': { label: 'Gases nobres', color: '#f472b6' },
  lantanideo: { label: 'Lantanídeos', color: '#60a5fa' },
  actinideo: { label: 'Actinídeos', color: '#c084fc' },
  desconhecido: { label: 'Propriedades desconhecidas', color: '#6b7280' },
}
