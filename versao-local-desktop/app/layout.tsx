import type { Metadata } from 'next'
import './globals.css'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import { RouteTransitionProvider } from '@/components/RouteTransition'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DespolarizaMed - Cursos para Medicina',
    template: '%s | DespolarizaMed',
  },
  description: 'Aulas gravadas e cursos para quem mira Medicina no vestibular',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <RouteTransitionProvider>{children}</RouteTransitionProvider>
      </body>
    </html>
  )
}
