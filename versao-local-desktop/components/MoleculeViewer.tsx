'use client'
import { useEffect, useRef } from 'react'
import { CPK, dipoleDirection, partialCharges, type Structure, type V3 } from '@/lib/molecules'

const ATOM_RADIUS: Record<string, number> = { H: 0.24, C: 0.4, N: 0.4, O: 0.4, F: 0.36, Cl: 0.56, S: 0.56, B: 0.36 }
const DARK_TEXT = new Set(['H', 'F', 'Cl', 'S', 'B', 'Mg', 'Ca'])
// Raios iônicos (Å) para o retículo cristalino
const IONIC_RADIUS: Record<string, number> = { Na: 1.02, K: 1.38, Mg: 0.72, Ca: 1.0, Cl: 1.81, F: 1.33, O: 1.4 }

type Props = { structure: Structure; showDipole: boolean; spin: boolean }

const P = (v: V3) => ({ x: v[0], y: v[1], z: v[2] })

export default function MoleculeViewer({ structure, showDipole, spin }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let viewer: any
    let cancelled = false
    ;(async () => {
      const mod: any = await import('3dmol')
      const $3Dmol = mod.default ?? mod
      if (cancelled || !ref.current) return
      ref.current.innerHTML = ''
      viewer = $3Dmol.createViewer(ref.current, { backgroundColor: '#0f172a' })

      if (structure.kind === 'covalent') {
        const atoms = structure.atoms
        atoms.forEach((a) => viewer.addSphere({ center: P(a.pos), radius: ATOM_RADIUS[a.el] ?? 0.5, color: CPK[a.el] ?? '#cccccc' }))

        for (const [i, j, order] of structure.bonds) {
          const A = atoms[i].pos
          const B = atoms[j].pos
          const d: V3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
          const len = Math.hypot(...d) || 1
          const u: V3 = [d[0] / len, d[1] / len, d[2] / len]
          let perp: V3 = [u[1] * 1 - 0, -u[0], 0] // u × z
          if (Math.hypot(...perp) < 0.1) perp = [0, 1, 0]
          const pn = Math.hypot(...perp)
          perp = [perp[0] / pn, perp[1] / pn, perp[2] / pn]
          const gap = 0.16
          for (let k = 0; k < order; k++) {
            const off = (k - (order - 1) / 2) * gap
            const s: V3 = [A[0] + perp[0] * off, A[1] + perp[1] * off, A[2] + perp[2] * off]
            const e: V3 = [B[0] + perp[0] * off, B[1] + perp[1] * off, B[2] + perp[2] * off]
            viewer.addCylinder({ start: P(s), end: P(e), radius: order > 1 ? 0.06 : 0.1, color: '#cbd5e1', fromCap: 1, toCap: 1 })
          }
        }

        atoms.forEach((a) =>
          viewer.addLabel(a.el, { position: P(a.pos), fontSize: 13, fontColor: DARK_TEXT.has(a.el) ? '#111827' : '#ffffff', backgroundOpacity: 0, inFront: true, alignment: 'center' })
        )

        const charges = partialCharges(structure)
        atoms.forEach((a, i) => {
          const c = charges[i]
          if (!c) return
          const r = ATOM_RADIUS[a.el] ?? 0.5
          viewer.addLabel(`δ${c}`, {
            position: { x: a.pos[0], y: a.pos[1] + r + 0.35, z: a.pos[2] },
            fontSize: 14, fontColor: c === '+' ? '#38bdf8' : '#f87171', backgroundColor: '#0f172a', backgroundOpacity: 0.6, inFront: true,
          })
        })

        viewer.zoomTo()
        viewer.zoom(1.7)
        const dir = dipoleDirection(structure)
        if (showDipole && dir && structure.dipoleD > 0.3) {
          const n = atoms.length
          const c: V3 = [atoms.reduce((s, a) => s + a.pos[0], 0) / n, atoms.reduce((s, a) => s + a.pos[1], 0) / n, atoms.reduce((s, a) => s + a.pos[2], 0) / n]
          let perp: V3 = [dir[1], -dir[0], 0]
          if (Math.hypot(...perp) < 0.1) perp = [0, 1, 0]
          const pn = Math.hypot(...perp)
          const off = 1.7
          const base: V3 = [c[0] + (perp[0] / pn) * off, c[1] + (perp[1] / pn) * off, c[2] + (perp[2] / pn) * off]
          const start: V3 = [base[0] - dir[0] * 0.9, base[1] - dir[1] * 0.9, base[2] - dir[2] * 0.9]
          const end: V3 = [base[0] + dir[0] * 0.9, base[1] + dir[1] * 0.9, base[2] + dir[2] * 0.9]
          viewer.addArrow({ start: P(start), end: P(end), radius: 0.09, color: '#facc15', radiusRatio: 2.4, midpoint: 0.65 })
          viewer.addLabel('μ', { position: P([end[0], end[1] + 0.5, end[2]]), fontSize: 18, fontColor: '#facc15', backgroundOpacity: 0, inFront: true })
        }
      } else {
        const rc = IONIC_RADIUS[structure.cation] ?? 1
        const ra = IONIC_RADIUS[structure.anion] ?? 1.5
        const a = rc + ra
        const N = 1
        for (let i = -N; i <= N; i++)
          for (let j = -N; j <= N; j++)
            for (let k = -N; k <= N; k++) {
              const isCation = (i + j + k + 3 * N) % 2 === 0
              const el = isCation ? structure.cation : structure.anion
              viewer.addSphere({ center: { x: i * a, y: j * a, z: k * a }, radius: (isCation ? rc : ra) * 0.62, color: CPK[el] ?? '#cccccc' })
            }
      }

      if (structure.kind === "ionic") { viewer.zoomTo(); viewer.rotate(35, "y"); viewer.rotate(25, "x") }
      viewer.render()
      if (spin) viewer.spin('y', 0.6)
    })()
    return () => {
      cancelled = true
      try {
        viewer?.spin(false)
        viewer?.clear()
      } catch {}
    }
  }, [structure, showDipole, spin])

  return <div ref={ref} className="relative w-full h-full" />
}
