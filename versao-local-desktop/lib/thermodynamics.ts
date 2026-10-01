export type Transform = 'isotermica' | 'isobarica' | 'isocorica' | 'adiabatica'

export const R = 8.314 // J/(mol·K)

export type GasState = { P: number; V: number; T: number } // P em Pa, V em m³, T em K

// Retorna o estado final e o trabalho realizado pelo gás (W>0 = gás se expande e realiza trabalho)
export function transform(type: Transform, state: GasState, n: number, target: { P?: number; V?: number; T?: number }): { final: GasState; W: number; Q: number; dU: number } {
  const { P, V, T } = state
  let final: GasState
  let W: number

  if (type === 'isotermica') {
    const Vf = target.V ?? (target.P ? (P * V) / target.P : V)
    const Pf = (P * V) / Vf
    final = { P: Pf, V: Vf, T }
    W = n * R * T * Math.log(Vf / V)
  } else if (type === 'isobarica') {
    const Vf = target.V ?? (target.T ? (V * target.T) / T : V)
    const Tf = (P * Vf) / (n * R)
    final = { P, V: Vf, T: Tf }
    W = P * (Vf - V)
  } else if (type === 'isocorica') {
    const Tf = target.T ?? T
    const Pf = (n * R * Tf) / V
    final = { P: Pf, V, T: Tf }
    W = 0
  } else {
    // adiabática simplificada, gás ideal monoatômico (gamma=5/3): P.V^gamma = const
    const gamma = 5 / 3
    const Vf = target.V ?? V
    const Pf = P * Math.pow(V / Vf, gamma)
    const Tf = (Pf * Vf) / (n * R)
    final = { P: Pf, V: Vf, T: Tf }
    // W = (P.V - Pf.Vf) / (gamma - 1)
    W = (P * V - Pf * Vf) / (gamma - 1)
  }

  const dU = (3 / 2) * n * R * (final.T - T) // gás ideal monoatômico
  const Q = type === 'adiabatica' ? 0 : dU + W
  return { final, W, Q, dU }
}

export function carnotEfficiency(Tquente: number, Tfria: number) {
  return Tquente > 0 ? 1 - Tfria / Tquente : 0
}
