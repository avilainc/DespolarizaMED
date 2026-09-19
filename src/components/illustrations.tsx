import type { SVGProps } from "react";

/**
 * Ilustrações de linha da marca: DNA, célula, prova, calendário, busca,
 * vídeo, estrela. Todas em `currentColor` (herdam a cor do texto do pai — uso
 * `text-primary`/`text-muted-foreground` para controlar), sem cor de pele nem
 * rosto: o produto é sobre ciência e resolução de questões, não sobre pessoas
 * genéricas estudando em notebook. SVG inline em vez de arquivo em
 * /public/illustrations porque cada uma tem menos de 900 bytes — um arquivo
 * separado só custaria uma requisição a mais sem ganho de cache relevante.
 */

type IllustrationProps = SVGProps<SVGSVGElement>;

const base = "none" as const;

export function IllustrationDna({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 160" fill={base} className={className} aria-hidden {...props}>
      <path
        d="M40 8c0 20 40 20 40 40s-40 20-40 40 40 20 40 40"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M80 8c0 20-40 20-40 40s40 20 40 40-40 20-40 40"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.45}
      />
      {[16, 32, 48, 64, 80, 96, 112].map((y, i) => (
        <line
          key={y}
          x1={i % 2 ? 46 : 74}
          y1={y}
          x2={i % 2 ? 74 : 46}
          y2={y}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.35}
        />
      ))}
    </svg>
  );
}

export function IllustrationMolecule({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" fill={base} className={className} aria-hidden {...props}>
      <path
        d="M60 12 105 36v48L60 108 15 84V36Z"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
        opacity={0.35}
      />
      <line x1={60} y1={12} x2={60} y2={60} stroke="currentColor" strokeWidth={3} opacity={0.5} />
      <line x1={105} y1={36} x2={60} y2={60} stroke="currentColor" strokeWidth={3} opacity={0.5} />
      <line x1={60} y1={108} x2={60} y2={60} stroke="currentColor" strokeWidth={3} opacity={0.5} />
      <line x1={15} y1={84} x2={60} y2={60} stroke="currentColor" strokeWidth={3} opacity={0.5} />
      {[
        [60, 12],
        [105, 36],
        [105, 84],
        [60, 108],
        [15, 84],
        [15, 36],
        [60, 60],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 6 ? 7 : 6} fill="currentColor" opacity={i === 6 ? 1 : 0.85} />
      ))}
    </svg>
  );
}

export function IllustrationExam({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 140" fill={base} className={className} aria-hidden {...props}>
      <rect x={16} y={8} width={88} height={124} rx={8} stroke="currentColor" strokeWidth={3} />
      <line x1={32} y1={30} x2={88} y2={30} stroke="currentColor" strokeWidth={3} opacity={0.4} />
      <line x1={32} y1={42} x2={72} y2={42} stroke="currentColor" strokeWidth={3} opacity={0.4} />
      {[64, 84, 104].map((y) => (
        <g key={y}>
          <circle cx={38} cy={y} r={7} stroke="currentColor" strokeWidth={2.5} />
          <line x1={54} y1={y} x2={92} y2={y} stroke="currentColor" strokeWidth={3} opacity={0.4} />
        </g>
      ))}
      <circle cx={38} cy={64} r={4} fill="currentColor" />
      <circle cx={104} cy={20} r={12} fill="currentColor" opacity={0.12} />
      <path d="M98 20l4 4 8-8" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IllustrationCalendar({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" fill={base} className={className} aria-hidden {...props}>
      <rect x={12} y={20} width={96} height={88} rx={8} stroke="currentColor" strokeWidth={3} />
      <line x1={12} y1={44} x2={108} y2={44} stroke="currentColor" strokeWidth={3} />
      <line x1={34} y1={10} x2={34} y2={28} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <line x1={86} y1={10} x2={86} y2={28} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle key={`${row}-${col}`} cx={30 + col * 16} cy={62 + row * 14} r={2.5} fill="currentColor" opacity={0.3} />
        )),
      )}
      <rect x={62} y={70} width={32} height={24} rx={5} fill="currentColor" opacity={0.14} />
      <rect x={62} y={70} width={32} height={24} rx={5} stroke="currentColor" strokeWidth={2.5} />
    </svg>
  );
}

export function IllustrationSearch({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" fill={base} className={className} aria-hidden {...props}>
      <rect x={16} y={12} width={64} height={80} rx={6} stroke="currentColor" strokeWidth={3} opacity={0.4} />
      <line x1={28} y1={30} x2={68} y2={30} stroke="currentColor" strokeWidth={3} opacity={0.3} />
      <line x1={28} y1={42} x2={68} y2={42} stroke="currentColor" strokeWidth={3} opacity={0.3} />
      <line x1={28} y1={54} x2={54} y2={54} stroke="currentColor" strokeWidth={3} opacity={0.3} />
      <circle cx={72} cy={72} r={22} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={4} />
      <line x1={88} y1={88} x2={104} y2={104} stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

export function IllustrationVideo({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 96" fill={base} className={className} aria-hidden {...props}>
      <rect x={8} y={12} width={72} height={56} rx={8} stroke="currentColor" strokeWidth={3} />
      <path d="M36 30l24 14-24 14Z" fill="currentColor" opacity={0.85} />
      <line x1={8} y1={80} x2={80} y2={80} stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.3} />
      <path d="M92 32c8 6 8 22 0 28" stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <path d="M104 24c14 10 14 34 0 44" stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.3} />
    </svg>
  );
}

export function IllustrationStar({ className, ...props }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 120" fill={base} className={className} aria-hidden {...props}>
      <path
        d="M60 16l12.5 27 29.5 3.5-22 20 6 29.5L60 81l-26 15 6-29.5-22-20L47.5 43Z"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity={0.1}
      />
      <circle cx={98} cy={22} r={3} fill="currentColor" opacity={0.5} />
      <circle cx={16} cy={90} r={2.5} fill="currentColor" opacity={0.4} />
      <path d="M100 90l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="currentColor" opacity={0.4} />
    </svg>
  );
}
