import type { Config } from 'tailwindcss'

// Cores extraídas da logo (círculo azul, texto "DESPOLARIZA" azul-claro,
// "MED" laranja, neurônio/sinapse preto-azulado com terminal teal).
// Paulo vai confirmar os hex exatos quando mandar o manual de marca —
// por ora estes foram lidos a olho da arte enviada.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4F80AC',        // Azul principal (fundo do círculo da logo)
        'primary-dark': '#12203D',   // Azul-marinho (contorno/neurônio da logo)
        'primary-light': '#8FC9E8',  // Azul claro (texto "DESPOLARIZA")
        'accent': '#F4801E',         // Laranja ("MED")
        'accent-dark': '#D9660A',    // Laranja escuro
        'teal': '#4FC7B8',           // Teal do terminal da sinapse / hexágonos
        'teal-dark': '#2E9C8F',
        // Tokens de tema (dark/light) — ver app/globals.css
        'app': 'rgb(var(--color-app) / <alpha-value>)',
        'surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'edge': 'rgb(var(--color-edge) / <alpha-value>)',
        'fg': 'rgb(var(--color-fg) / <alpha-value>)',
        'muted': 'rgb(var(--color-muted) / <alpha-value>)',
        'faint': 'rgb(var(--color-faint) / <alpha-value>)',
        'slate': {
          '50': '#f8fafc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a',
          '950': '#020617',
        }
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      }
    },
  },
  plugins: [],
}
export default config
