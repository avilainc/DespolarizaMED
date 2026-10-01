export const MEDIA = [
  { id: 'ar', label: 'Ar (vácuo)', n: 1.0 },
  { id: 'agua', label: 'Água', n: 1.33 },
  { id: 'vidro', label: 'Vidro comum', n: 1.5 },
  { id: 'diamante', label: 'Diamante', n: 2.42 },
]

export const C = 3e8 // m/s

export type SnellResult = {
  theta2: number | null // graus, null = reflexão total
  totalInternal: boolean
  criticalAngle: number | null // graus, só existe quando n1 > n2
  v1: number
  v2: number
}

export function snell(n1: number, n2: number, theta1Deg: number): SnellResult {
  const theta1 = (theta1Deg * Math.PI) / 180
  const v1 = C / n1
  const v2 = C / n2
  let criticalAngle: number | null = null
  if (n1 > n2) criticalAngle = (Math.asin(n2 / n1) * 180) / Math.PI
  const sinTheta2 = (n1 / n2) * Math.sin(theta1)
  if (sinTheta2 > 1) return { theta2: null, totalInternal: true, criticalAngle, v1, v2 }
  const theta2 = (Math.asin(sinTheta2) * 180) / Math.PI
  return { theta2, totalInternal: false, criticalAngle, v1, v2 }
}
