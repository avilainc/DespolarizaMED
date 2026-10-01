import Link from 'next/link'
import type { Metadata } from 'next'
import { Home, LayoutDashboard } from 'lucide-react'
import { HeroPatternBackground } from '@/components/HeroPatternBackground'
import { DepolarizationChart } from '@/components/DepolarizationChart'

export const metadata: Metadata = {
  title: 'Página não encontrada',
}

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-app flex items-center justify-center px-4 overflow-hidden">
      <HeroPatternBackground />

      <div className="relative text-center max-w-lg">
        <img src="/logo-icon.png" alt="DespolarizaMed" className="w-14 h-14 object-contain mx-auto mb-6" />

        <p className="text-primary text-7xl sm:text-8xl font-black tracking-tight mb-2">404</p>
        <h1 className="text-fg text-xl sm:text-2xl font-bold mb-1">
          Essa página se despolarizou e sumiu do mapa
        </h1>
        <DepolarizationChart />
        <p className="text-muted text-sm mb-8 mt-1">
          O endereço não existe ou mudou de lugar. Vamos te levar de volta pro que importa: seus estudos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition w-full sm:w-auto"
          >
            <Home size={16} /> Voltar para o início
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 border border-edge text-muted hover:text-fg text-sm font-semibold px-5 py-2.5 rounded-xl transition w-full sm:w-auto"
          >
            <LayoutDashboard size={16} /> Ir para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
