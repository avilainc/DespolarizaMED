// Gráfico de "potencial de ação" que enlouquece — piada com o nome da marca:
// a página "se despolarizou demais" (picos erráticos em vez de um platô
// comportado), com um ponto brilhante varrendo a curva feito monitor de ECG.
const PATH = 'M0,90 L50,90 L62,18 L72,130 L84,8 L96,118 L108,26 L120,104 L132,12 L144,96 L158,90 L400,90'

export function DepolarizationChart() {
  return (
    <svg viewBox="0 0 400 140" className="w-full max-w-sm mx-auto text-fg" aria-hidden="true">
      {/* linha de repouso */}
      <line x1="0" y1="90" x2="400" y2="90" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="4 4" />
      <text x="4" y="84" fontSize="9" className="fill-current text-faint">-70 mV</text>
      <text x="4" y="22" fontSize="9" className="fill-current text-faint">+40 mV</text>

      {/* traço errático */}
      <path d={PATH} fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />

      {/* ponto varrendo a curva, tipo monitor cardíaco */}
      <circle r="4" fill="#facc15">
        <animateMotion dur="2.2s" repeatCount="indefinite" path={PATH} rotate="auto" />
      </circle>
      <circle r="8" fill="#facc15" opacity="0.35">
        <animateMotion dur="2.2s" repeatCount="indefinite" path={PATH} rotate="auto" />
        <animate attributeName="r" values="4;9;4" dur="0.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
