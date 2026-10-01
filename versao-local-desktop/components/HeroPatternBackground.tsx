import { Dna, FlaskConical, Atom, Ruler, Star, BookOpen, Sigma, Globe } from 'lucide-react'

// Ícones de estudo espalhados em baixa opacidade atrás do hero — mesmo
// clima do print que Paulo mandou (DNA, frasco, régua, estrela soltos
// no fundo), reaproveitando os ícones que já usamos pras matérias.
const ICONS = [
  { Icon: Dna, top: '8%', left: '6%', size: 46, rotate: -12 },
  { Icon: FlaskConical, top: '68%', left: '4%', size: 38, rotate: 10 },
  { Icon: Atom, top: '15%', left: '92%', size: 50, rotate: 8 },
  { Icon: Ruler, top: '80%', left: '90%', size: 40, rotate: -18 },
  { Icon: Star, top: '4%', left: '48%', size: 24, rotate: 0 },
  { Icon: BookOpen, top: '85%', left: '55%', size: 34, rotate: 14 },
  { Icon: Sigma, top: '45%', left: '2%', size: 30, rotate: -6 },
  { Icon: Globe, top: '50%', left: '96%', size: 32, rotate: 6 },
]

export function HeroPatternBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {ICONS.map(({ Icon, top, left, size, rotate }, i) => (
        <Icon
          key={i}
          size={size}
          className="absolute text-primary"
          style={{ top, left, opacity: 0.14, transform: `rotate(${rotate}deg)` }}
        />
      ))}
    </div>
  )
}
