const toRad = (d: number) => (d * Math.PI) / 180
const toDeg = (r: number) => (r * 180) / Math.PI

// Triângulo definido por LAL: lados a, b e o ângulo C entre eles (em graus).
export function triangleSAS(a: number, b: number, Cdeg: number) {
  const C = toRad(Cdeg)
  const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C))
  const area = 0.5 * a * b * Math.sin(C)
  // Lei dos cossenos pros outros ângulos (evita a ambiguidade do arco-seno)
  const A = toDeg(Math.acos(Math.min(1, Math.max(-1, (b * b + c * c - a * a) / (2 * b * c)))))
  const Bdeg = 180 - Cdeg - A
  const perimeter = a + b + c
  // Coordenadas pra desenhar: C na origem, A ao longo do eixo x a distância b, B a distância a no ângulo C
  const Apt = { x: b, y: 0 }
  const Bpt = { x: a * Math.cos(C), y: a * Math.sin(C) }
  const Cpt = { x: 0, y: 0 }
  // altura relativa ao lado AB (de C até AB)
  const abLen = c
  const height = abLen > 0 ? (2 * area) / abLen : 0
  return { c, area, perimeter, angleA: A, angleB: Bdeg, angleC: Cdeg, points: { A: Apt, B: Bpt, C: Cpt }, height }
}

export function rightTriangle(cat1: number, cat2: number) {
  const hyp = Math.sqrt(cat1 * cat1 + cat2 * cat2)
  const area = (cat1 * cat2) / 2
  const perimeter = cat1 + cat2 + hyp
  const angleOppCat1 = toDeg(Math.asin(cat1 / hyp)) // ângulo oposto ao cateto1
  return { hyp, area, perimeter, angleOppCat1, angleOppCat2: 90 - angleOppCat1, sin: cat1 / hyp, cos: cat2 / hyp, tan: cat1 / cat2 }
}

export type QuadType = 'quadrado' | 'retangulo' | 'losango' | 'trapezio'
export function quadrilateral(type: QuadType, p1: number, p2: number, p3?: number) {
  if (type === 'quadrado') return { area: p1 * p1, perimeter: 4 * p1 }
  if (type === 'retangulo') return { area: p1 * p2, perimeter: 2 * (p1 + p2) }
  if (type === 'losango') return { area: (p1 * p2) / 2, perimeter: 4 * Math.sqrt((p1 / 2) ** 2 + (p2 / 2) ** 2) }
  // trapézio: p1=base maior, p2=base menor, p3=altura
  const h = p3 ?? 0
  return { area: ((p1 + p2) / 2) * h, perimeter: null }
}

export function regularPolygon(n: number, side: number) {
  const apothem = side / (2 * Math.tan(Math.PI / n))
  const circumradius = side / (2 * Math.sin(Math.PI / n))
  const area = (n * side * apothem) / 2
  const perimeter = n * side
  const interiorAngle = ((n - 2) * 180) / n
  return { apothem, circumradius, area, perimeter, interiorAngle }
}

export function circleSector(r: number, thetaDeg: number, piValue: number = Math.PI) {
  const area = piValue * r * r
  const circumference = 2 * piValue * r
  const sectorArea = (thetaDeg / 360) * area
  const arcLength = (thetaDeg / 360) * circumference
  const triangleArea = 0.5 * r * r * Math.sin(toRad(thetaDeg))
  const segmentArea = Math.max(0, sectorArea - triangleArea)
  return { area, circumference, sectorArea, arcLength, segmentArea, triangleArea }
}
