'use client'
import { useEffect, useRef } from 'react'

export type AtomModel = 'dalton' | 'thomson' | 'rutherford' | 'bohr' | 'compare'

export type PhotonEvent = { key: number; color: string } | null

type Props = {
  model: AtomModel
  level: number // nível de Bohr (1 = K)
  photon: PhotonEvent
  shakeKey: number
}

type V3 = { x: number; y: number; z: number }
const SHELL_R = [0, 1.6, 3.0, 4.4, 5.8]

function fib(n: number, r: number): V3[] {
  const pts: V3[] = []
  const ga = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = ga * i
    pts.push({ x: Math.cos(th) * rad * r, y: y * r, z: Math.sin(th) * rad * r })
  }
  return pts
}

export default function AtomViewer({ model, level, photon, shakeKey }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const live = useRef({ level, photon, shakeKey })
  live.current = { level, photon, shakeKey }

  useEffect(() => {
    let viewer: any
    let raf = 0
    let cancelled = false
    ;(async () => {
      const mod: any = await import('3dmol')
      const $3Dmol = mod.default ?? mod
      if (cancelled || !ref.current) return
      ref.current.innerHTML = ''
      viewer = $3Dmol.createViewer(ref.current, { backgroundColor: '#0f172a' })

      const ring = (ox: number, r: number, tiltX: number, tiltZ: number, col = '#475569') => {
        const N = 56
        const pt = (i: number): V3 => {
          const a = (i / N) * Math.PI * 2
          let x = r * Math.cos(a)
          let y = r * Math.sin(a)
          let z = 0
          const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX)
          const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX)
          y = y1
          z = z1
          const x1 = x * Math.cos(tiltZ) - y * Math.sin(tiltZ)
          const y2 = x * Math.sin(tiltZ) + y * Math.cos(tiltZ)
          return { x: x1 + ox, y: y2, z }
        }
        for (let i = 0; i < N; i++) viewer.addCylinder({ start: pt(i), end: pt(i + 1), radius: 0.03, color: col, fromCap: 1, toCap: 1 })
      }
      const orbitPos = (ox: number, r: number, tiltX: number, tiltZ: number, ang: number): V3 => {
        let x = r * Math.cos(ang)
        let y = r * Math.sin(ang)
        let z = 0
        const y1 = y * Math.cos(tiltX)
        const z1 = y * Math.sin(tiltX)
        y = y1
        z = z1
        const x1 = x * Math.cos(tiltZ) - y * Math.sin(tiltZ)
        const y2 = x * Math.sin(tiltZ) + y * Math.cos(tiltZ)
        return { x: x1 + ox, y: y2, z }
      }

      const kinds: { kind: Exclude<AtomModel, 'compare'>; ox: number; label: string }[] =
        model === 'compare'
          ? [
              { kind: 'dalton', ox: -12, label: 'Dalton' },
              { kind: 'thomson', ox: -4, label: 'Thomson' },
              { kind: 'rutherford', ox: 4, label: 'Rutherford' },
              { kind: 'bohr', ox: 12, label: 'Bohr' },
            ]
          : [{ kind: model, ox: 0, label: '' }]
      const scale = model === 'compare' ? 0.6 : 1

      // formas estáticas
      const thomsonPts = fib(9, 1.9)
      for (const { kind, ox, label } of kinds) {
        const s = scale
        if (kind === 'dalton') viewer.addSphere({ center: { x: ox, y: 0, z: 0 }, radius: 2.6 * s, color: '#94a3b8' })
        if (kind === 'thomson') viewer.addSphere({ center: { x: ox, y: 0, z: 0 }, radius: 3 * s, color: '#ef4444', alpha: 0.32 })
        if (kind === 'rutherford') {
          viewer.addSphere({ center: { x: ox, y: 0, z: 0 }, radius: 0.35, color: '#ef4444' })
          ring(ox, 3 * s * 1.6, 0.3, 0)
          ring(ox, 4.2 * s * 1.6, 1.0, 0.6)
          ring(ox, 5.4 * s * 1.6, 1.9, -0.5)
        }
        if (kind === 'bohr') {
          viewer.addSphere({ center: { x: ox, y: 0, z: 0 }, radius: 0.4, color: '#ef4444' })
          for (let n = 1; n <= 4; n++) ring(ox, SHELL_R[n] * (model === 'compare' ? 0.6 : 1), 0, 0, '#64748b')
          if (model !== 'compare') {
            ;['K', 'L', 'M', 'N'].forEach((L, i) => viewer.addLabel(L, { position: { x: ox + SHELL_R[i + 1] * 0.72, y: SHELL_R[i + 1] * 0.72 + 0.25, z: 0 }, fontSize: 13, fontColor: '#94a3b8', backgroundOpacity: 0 }))
          }
        }
        if (label) viewer.addLabel(label, { position: { x: ox, y: -6.4, z: 0 }, fontSize: 14, fontColor: '#e2e8f0', backgroundOpacity: 0 })
      }

      viewer.zoomTo()
      viewer.zoom(model === 'compare' ? 1.35 : model === 'rutherford' ? 0.95 : 1.25)
      viewer.render()

      let dyn: any[] = []
      let bohrR = SHELL_R[live.current.level]
      let lastPhotonKey = -1
      let photonStart = 0
      let photonColor = '#ffffff'
      let shakeStart = -9999
      let lastShake = live.current.shakeKey
      const t0 = performance.now()

      const frame = (now: number) => {
        if (cancelled) return
        const t = (now - t0) / 1000
        dyn.forEach((h) => viewer.removeShape(h))
        dyn = []
        const L = live.current

        if (L.shakeKey !== lastShake) {
          lastShake = L.shakeKey
          shakeStart = now
        }
        const shake = now - shakeStart < 700 ? Math.sin(now / 25) * 0.18 : 0

        // alvo do elétron de Bohr (interpolação suave)
        const target = SHELL_R[L.level]
        bohrR += (target - bohrR) * 0.12

        if (L.photon && L.photon.key !== lastPhotonKey) {
          lastPhotonKey = L.photon.key
          photonStart = now
          photonColor = L.photon.color
        }

        for (const { kind, ox } of kinds) {
          const s = scale
          if (kind === 'dalton' && shake !== 0) {
            // reposiciona a esfera tremendo (remove/adiciona só durante o tremor)
            dyn.push(viewer.addSphere({ center: { x: ox + shake, y: 0, z: 0 }, radius: 2.65 * s, color: '#cbd5e1' }))
          }
          if (kind === 'thomson') {
            thomsonPts.forEach((p, i) => {
              const j = Math.sin(t * 3 + i) * 0.06
              dyn.push(viewer.addSphere({ center: { x: ox + (p.x + j) * s, y: (p.y + j) * s, z: p.z * s }, radius: 0.32 * s * 1.2, color: '#38bdf8' }))
            })
          }
          if (kind === 'rutherford') {
            const specs = [
              { r: 3 * s * 1.6, tx: 0.3, tz: 0, sp: 1.6 },
              { r: 4.2 * s * 1.6, tx: 1.0, tz: 0.6, sp: 1.1 },
              { r: 5.4 * s * 1.6, tx: 1.9, tz: -0.5, sp: 0.8 },
            ]
            specs.forEach((o, i) => dyn.push(viewer.addSphere({ center: orbitPos(ox, o.r, o.tx, o.tz, t * o.sp + i * 2), radius: 0.28, color: '#38bdf8' })))
          }
          if (kind === 'bohr') {
            const k = model === 'compare' ? 0.6 : 1
            const r = (model === 'compare' ? Math.min(bohrR, 2) : bohrR) * (model === 'compare' ? 0.7 : 1)
            const ang = t * (1.8 / Math.max(1, (model === 'compare' ? 1.5 : bohrR) * 0.5))
            dyn.push(viewer.addSphere({ center: { x: ox + r * Math.cos(ang) * (model === 'compare' ? k : 1), y: r * Math.sin(ang) * (model === 'compare' ? k : 1), z: 0 }, radius: 0.3, color: '#38bdf8' }))
          }
        }

        // fóton emitido: onda esférica que cresce e some
        if (model === 'bohr' && photonStart) {
          const dt = (now - photonStart) / 1000
          if (dt < 1.1) {
            const rad = 0.6 + dt * 6
            dyn.push(viewer.addSphere({ center: { x: 0, y: 0, z: 0 }, radius: rad, color: photonColor, alpha: Math.max(0, 0.35 - dt * 0.3) }))
          }
        }

        viewer.render()
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    })()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      try {
        viewer?.clear()
      } catch {}
    }
  }, [model])

  return <div ref={ref} className="relative w-full h-full" />
}
