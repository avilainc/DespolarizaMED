export function simpleInterest(C: number, i: number, t: number) {
  const J = C * i * t
  return { J, M: C + J }
}
export function compoundInterest(C: number, i: number, t: number) {
  const M = C * Math.pow(1 + i, t)
  return { J: M - C, M }
}

export function paTerm(a1: number, r: number, n: number) {
  return a1 + (n - 1) * r
}
export function paSum(a1: number, r: number, n: number) {
  const an = paTerm(a1, r, n)
  return { an, sum: ((a1 + an) * n) / 2 }
}
export function pgTerm(a1: number, q: number, n: number) {
  return a1 * Math.pow(q, n - 1)
}
export function pgSum(a1: number, q: number, n: number) {
  const an = pgTerm(a1, q, n)
  const sum = q === 1 ? a1 * n : (a1 * (Math.pow(q, n) - 1)) / (q - 1)
  return { an, sum }
}
export function pgInfiniteSum(a1: number, q: number) {
  return Math.abs(q) < 1 ? a1 / (1 - q) : null
}
