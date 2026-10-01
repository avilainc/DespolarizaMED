export type SolidType = 'cubo' | 'paralelepipedo' | 'cilindro' | 'cone' | 'piramide' | 'esfera'

export type SolidParams = { r: number; h: number; edge: number; baseEdge: number }

export type SolidResult = { areaBase: number; areaLateral: number; areaTotal: number; volume: number; geratriz?: number }

export function solveSolid(type: SolidType, p: SolidParams, piValue: number = Math.PI): SolidResult {
  const PI = piValue
  if (type === 'cubo') {
    const a = p.edge
    return { areaBase: a * a, areaLateral: 4 * a * a, areaTotal: 6 * a * a, volume: a * a * a }
  }
  if (type === 'paralelepipedo') {
    const a = p.baseEdge, b = p.edge, c = p.h
    return { areaBase: a * b, areaLateral: 2 * c * (a + b), areaTotal: 2 * (a * b + a * c + b * c), volume: a * b * c }
  }
  if (type === 'cilindro') {
    const areaBase = PI * p.r * p.r
    const areaLateral = 2 * PI * p.r * p.h
    return { areaBase, areaLateral, areaTotal: 2 * areaBase + areaLateral, volume: areaBase * p.h }
  }
  if (type === 'cone') {
    const g = Math.sqrt(p.r * p.r + p.h * p.h)
    const areaBase = PI * p.r * p.r
    const areaLateral = PI * p.r * g
    return { areaBase, areaLateral, areaTotal: areaBase + areaLateral, volume: (areaBase * p.h) / 3, geratriz: g }
  }
  if (type === 'piramide') {
    const areaBase = p.baseEdge * p.baseEdge
    const apotemaBase = p.baseEdge / 2
    const g = Math.sqrt(p.h * p.h + apotemaBase * apotemaBase)
    const areaLateral = 4 * ((p.baseEdge * g) / 2)
    return { areaBase, areaLateral, areaTotal: areaBase + areaLateral, volume: (areaBase * p.h) / 3, geratriz: g }
  }
  // esfera
  const areaTotal = 4 * PI * p.r * p.r
  return { areaBase: 0, areaLateral: areaTotal, areaTotal, volume: (4 / 3) * PI * p.r ** 3 }
}

// ---------- malha 3D simplificada (pra desenho isométrico em SVG) ----------
export type Vec3 = [number, number, number]
export type Face = { idx: number[]; shade: number; kind?: 'cap' | 'side' }
export type Mesh = { vertices: Vec3[]; faces: Face[] }

function ring(r: number, y: number, n: number): Vec3[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n
    return [r * Math.cos(a), y, r * Math.sin(a)] as Vec3
  })
}

export function buildMesh(type: SolidType, p: SolidParams): Mesh {
  if (type === 'cubo') {
    const a = p.edge / 2
    return boxMesh(a, a, a)
  }
  if (type === 'paralelepipedo') {
    return boxMesh(p.baseEdge / 2, p.h / 2, p.edge / 2)
  }
  if (type === 'cilindro') {
    const n = 24
    const top = ring(p.r, p.h / 2, n)
    const bot = ring(p.r, -p.h / 2, n)
    const vertices = [...top, ...bot]
    const faces: Face[] = [
      { idx: top.map((_, i) => i), shade: 1, kind: 'cap' },
      { idx: bot.map((_, i) => n + n - 1 - i), shade: 0.4, kind: 'cap' },
    ]
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      faces.push({ idx: [i, j, n + j, n + i], shade: 0.6 + 0.25 * Math.cos((2 * Math.PI * (i + 0.5)) / n), kind: 'side' })
    }
    return { vertices, faces }
  }
  if (type === 'cone') {
    const n = 24
    const base = ring(p.r, -p.h / 2, n)
    const apex: Vec3 = [0, p.h / 2, 0]
    const vertices = [...base, apex]
    const faces: Face[] = [{ idx: base.map((_, i) => n - 1 - i), shade: 0.4 }]
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      faces.push({ idx: [i, j, n], shade: 0.6 + 0.3 * Math.cos((2 * Math.PI * (i + 0.5)) / n) })
    }
    return { vertices, faces }
  }
  // pirâmide (base quadrada)
  const s = p.baseEdge / 2
  const base: Vec3[] = [[-s, -p.h / 2, -s], [s, -p.h / 2, -s], [s, -p.h / 2, s], [-s, -p.h / 2, s]]
  const apex: Vec3 = [0, p.h / 2, 0]
  const vertices = [...base, apex]
  const faces: Face[] = [
    { idx: [3, 2, 1, 0], shade: 0.4 },
    { idx: [0, 1, 4], shade: 0.65 },
    { idx: [1, 2, 4], shade: 0.9 },
    { idx: [2, 3, 4], shade: 0.75 },
    { idx: [3, 0, 4], shade: 0.5 },
  ]
  return { vertices, faces }
}

function boxMesh(hx: number, hy: number, hz: number): Mesh {
  const v: Vec3[] = [
    [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
    [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
  ]
  const faces: Face[] = [
    { idx: [4, 5, 6, 7], shade: 0.85 }, // frente
    { idx: [1, 0, 3, 2], shade: 0.55 }, // trás
    { idx: [0, 4, 7, 3], shade: 0.6 }, // esquerda
    { idx: [5, 1, 2, 6], shade: 0.75 }, // direita
    { idx: [3, 7, 6, 2], shade: 1 }, // topo
    { idx: [0, 1, 5, 4], shade: 0.35 }, // base
  ]
  return { vertices: v, faces }
}

export function project(p: Vec3, rotY: number, tiltX: number): Vec3 {
  const [x, y, z] = p
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
  const x1 = x * cosY + z * sinY
  const z1 = -x * sinY + z * cosY
  const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX)
  const y2 = y * cosX - z1 * sinX
  const z2 = y * sinX + z1 * cosX
  return [x1, y2, z2]
}
