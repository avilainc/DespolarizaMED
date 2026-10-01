export const SOUND_SPEED = 340 // m/s, ar

export function wavelength(v: number, f: number) {
  return f > 0 ? v / f : 0
}
export function period(f: number) {
  return f > 0 ? 1 / f : 0
}

// Efeito Doppler (fonte em movimento, observador parado): f' = f * v / (v ± vs)
export function doppler(f: number, v: number, vs: number, approaching: boolean) {
  const denom = approaching ? v - vs : v + vs
  return denom > 0 ? (f * v) / denom : f
}
