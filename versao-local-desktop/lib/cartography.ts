import worldLandRaw from './worldLand.json'

export type City = { id: string; label: string; utc: number }

export const CITIES: City[] = [
  { id: 'sp', label: 'São Paulo', utc: -3 },
  { id: 'noronha', label: 'Fernando de Noronha', utc: -2 },
  { id: 'manaus', label: 'Manaus', utc: -4 },
  { id: 'londres', label: 'Londres (Greenwich)', utc: 0 },
  { id: 'lisboa', label: 'Lisboa', utc: 0 },
  { id: 'nova-york', label: 'Nova York', utc: -5 },
  { id: 'los-angeles', label: 'Los Angeles', utc: -8 },
  { id: 'moscou', label: 'Moscou', utc: 3 },
  { id: 'dubai', label: 'Dubai', utc: 4 },
  { id: 'nova-delhi', label: 'Nova Délhi', utc: 5.5 },
  { id: 'pequim', label: 'Pequim', utc: 8 },
  { id: 'toquio', label: 'Tóquio', utc: 9 },
  { id: 'sydney', label: 'Sydney', utc: 10 },
]

export function calcArrival(originUtc: number, destUtc: number, depH: number, depM: number, flightHours: number) {
  const depMinutesUtc = (depH * 60 + depM) - originUtc * 60
  const arrMinutesUtc = depMinutesUtc + flightHours * 60
  const arrMinutesLocal = arrMinutesUtc + destUtc * 60
  const dayOffset = Math.floor(arrMinutesLocal / 1440)
  let m = Math.round(arrMinutesLocal % 1440)
  if (m < 0) m += 1440
  const h = Math.floor(m / 60)
  const min = m % 60
  const timeDiff = destUtc - originUtc
  return { arrH: h, arrM: min, dayOffset, timeDiff }
}

export type ScaleField = 'E' | 'd' | 'D'
// E = d / D, com d em cm (mapa) e D convertida pra cm (distância real)
export function solveScale(field: ScaleField, known: { denomE: number; dCm: number; dKm: number }) {
  const { denomE, dCm, dKm } = known
  const DCm = dKm * 100000
  if (field === 'D') {
    const DCmCalc = denomE > 0 ? dCm * denomE : 0
    return { denomE, dCm, dKm: DCmCalc / 100000 }
  }
  if (field === 'd') {
    const dCmCalc = denomE > 0 ? DCm / denomE : 0
    return { denomE, dCm: dCmCalc, dKm }
  }
  // field === 'E'
  const denomECalc = dCm > 0 ? DCm / dCm : 0
  return { denomE: denomECalc, dCm, dKm }
}

export type ProjectionId = 'mercator' | 'peters' | 'robinson' | 'azimutal'

// Tabela oficial da projeção de Robinson (1974): fator de comprimento do
// paralelo (PLEN) e fator de distância ao equador (PDFE) a cada 5° de
// latitude — usada por praticamente todo software de projeção cartográfica.
const ROBINSON_TABLE: { lat: number; plen: number; pdfe: number }[] = [
  { lat: 0, plen: 1.0000, pdfe: 0.0000 },
  { lat: 5, plen: 0.9986, pdfe: 0.0620 },
  { lat: 10, plen: 0.9954, pdfe: 0.1240 },
  { lat: 15, plen: 0.9900, pdfe: 0.1860 },
  { lat: 20, plen: 0.9822, pdfe: 0.2480 },
  { lat: 25, plen: 0.9730, pdfe: 0.3100 },
  { lat: 30, plen: 0.9600, pdfe: 0.3720 },
  { lat: 35, plen: 0.9427, pdfe: 0.4340 },
  { lat: 40, plen: 0.9216, pdfe: 0.4958 },
  { lat: 45, plen: 0.8962, pdfe: 0.5571 },
  { lat: 50, plen: 0.8679, pdfe: 0.6176 },
  { lat: 55, plen: 0.8350, pdfe: 0.6769 },
  { lat: 60, plen: 0.7986, pdfe: 0.7346 },
  { lat: 65, plen: 0.7597, pdfe: 0.7903 },
  { lat: 70, plen: 0.7186, pdfe: 0.8435 },
  { lat: 75, plen: 0.6732, pdfe: 0.8936 },
  { lat: 80, plen: 0.6213, pdfe: 0.9394 },
  { lat: 85, plen: 0.5722, pdfe: 0.9761 },
  { lat: 90, plen: 0.5322, pdfe: 1.0000 },
]

function robinsonFactors(absLat: number) {
  const clamped = Math.min(90, Math.max(0, absLat))
  let i = 0
  while (i < ROBINSON_TABLE.length - 2 && ROBINSON_TABLE[i + 1].lat <= clamped) i++
  const a = ROBINSON_TABLE[i]
  const b = ROBINSON_TABLE[Math.min(i + 1, ROBINSON_TABLE.length - 1)]
  const span = b.lat - a.lat || 1
  const t = (clamped - a.lat) / span
  return { plen: a.plen + (b.plen - a.plen) * t, pdfe: a.pdfe + (b.pdfe - a.pdfe) * t }
}

const RAD = Math.PI / 180

// Projeta um ponto (lat, lon em graus) para coordenadas [x,y] "cruas" — ainda
// sem escala pra caber num viewBox; cada projeção usa sua própria unidade.
export function project(proj: ProjectionId, lat: number, lon: number): [number, number] {
  const lam = lon * RAD
  if (proj === 'mercator') {
    const clampedLat = Math.max(-85, Math.min(85, lat))
    const phi = clampedLat * RAD
    return [lam, Math.log(Math.tan(Math.PI / 4 + phi / 2))]
  }
  if (proj === 'peters') {
    // Gall-Peters: cilíndrica de área igual, paralelos-padrão a 45°
    const phi = lat * RAD
    const cos45 = Math.cos(45 * RAD)
    return [lam * cos45, Math.sin(phi) / cos45]
  }
  if (proj === 'robinson') {
    const { plen, pdfe } = robinsonFactors(Math.abs(lat))
    const x = lam * plen * 0.8487
    const y = Math.sign(lat) * pdfe * 1.3523
    return [x, y]
  }
  // azimutal (equidistante, centrada no Polo Norte — estilo emblema da ONU)
  const colat = (90 - lat) * RAD
  const theta = lam - Math.PI / 2
  return [colat * Math.cos(theta), colat * Math.sin(theta)]
}

export type GraticuleLine = { points: [number, number][] }
export type Graticule = {
  meridians: GraticuleLine[]
  parallels: GraticuleLine[]
  land: GraticuleLine[]
  extent: { minX: number; maxX: number; minY: number; maxY: number }
}

// Litoral real do mundo (Natural Earth 110m, via world-atlas), pré-convertido
// pra uma lista de anéis [lon,lat] — ver scripts de geração no histórico do
// projeto. Mesmos anéis (mesma contagem de pontos) em todas as projeções,
// o que permite interpolar ponto a ponto na animação de troca de projeção.
const WORLD_LAND = worldLandRaw as [number, number][][]

// Grade fixa de amostragem (mesma malha de pontos em todas as projeções) —
// garante que os arrays de pontos tenham exatamente o mesmo formato entre
// projeções diferentes, o que permite interpolar ponto-a-ponto pra animar a
// transição de uma projeção pra outra (efeito de "deformação").
const MERIDIAN_LONS = [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180]
const MERIDIAN_LATS: number[] = []
for (let l = -85; l <= 85; l += 5) MERIDIAN_LATS.push(l)
// -80 cobre a Antártida (contorno chega perto de -90, mas a Mercator já
// clampa em ±85 internamente) — sem essa linha a Antártida ficava "solta",
// sem nenhum paralelo por perto pra mostrar que ela também está na grade.
const PARALLEL_LATS = [-80, -60, -30, 0, 30, 60, 80]
const PARALLEL_LONS: number[] = []
for (let l = -180; l <= 180; l += 10) PARALLEL_LONS.push(l)

// Grade de meridianos/paralelos projetada — mostra a distorção de cada
// projeção sem depender de contornos reais de continentes (que exigiriam
// uma base de dados geográfica própria).
export function buildGraticule(proj: ProjectionId): Graticule {
  const meridians: GraticuleLine[] = MERIDIAN_LONS.map((lon) => ({
    points: MERIDIAN_LATS.map((lat) => project(proj, lat, lon)),
  }))
  const parallels: GraticuleLine[] = PARALLEL_LATS.map((lat) => ({
    points: PARALLEL_LONS.map((lon) => project(proj, lat, lon)),
  }))
  const land: GraticuleLine[] = WORLD_LAND.map((ring) => ({
    points: ring.map(([lon, lat]) => project(proj, lat, lon)),
  }))

  const allPts = [...meridians.flatMap((m) => m.points), ...parallels.flatMap((p) => p.points)]
  const xs = allPts.map((p) => p[0])
  const ys = allPts.map((p) => p[1])
  return {
    meridians,
    parallels,
    land,
    extent: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
  }
}
