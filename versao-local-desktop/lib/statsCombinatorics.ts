export function parseNumbers(text: string): number[] {
  return text
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
}

export type StatsResult = {
  n: number
  mean: number
  median: number
  mode: number[]
  range: number
  variance: number
  stdDev: number
  min: number
  max: number
}

export function computeStats(data: number[]): StatsResult | null {
  if (data.length === 0) return null
  const n = data.length
  const sorted = [...data].sort((a, b) => a - b)
  const mean = data.reduce((a, b) => a + b, 0) / n
  const median = n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  const counts = new Map<number, number>()
  for (const v of data) counts.set(v, (counts.get(v) ?? 0) + 1)
  const maxCount = Math.max(...counts.values())
  const mode = maxCount > 1 ? [...counts.entries()].filter(([, c]) => c === maxCount).map(([v]) => v).sort((a, b) => a - b) : []
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)
  return { n, mean, median, mode, range: sorted[n - 1] - sorted[0], variance, stdDev, min: sorted[0], max: sorted[n - 1] }
}

export function factorial(n: number): number {
  if (n < 0) return NaN
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

export function permutation(n: number) {
  return factorial(n)
}
export function arrangement(n: number, p: number) {
  if (p > n) return 0
  return factorial(n) / factorial(n - p)
}
export function combination(n: number, p: number) {
  if (p > n) return 0
  return factorial(n) / (factorial(p) * factorial(n - p))
}

export function unionProb(pa: number, pb: number, pab: number) {
  return pa + pb - pab
}
export function conditionalProb(pab: number, pb: number) {
  return pb > 0 ? pab / pb : 0
}
