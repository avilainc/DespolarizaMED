import { BrainCircuit } from 'lucide-react'

// Fundo minimalista de sistema nervoso: um encéfalo grande (com "circuitos"
// de neurônios dentro, ícone BrainCircuit) ancorando um canto, mais um campo
// disperso de neurônios (corpo + dendritos + axônio) e células da glia
// (marcas em asterisco, tipo astrócito) preenchendo o resto. Tudo em baixa
// opacidade, estilo desenho/linha fina, pra não competir com o conteúdo.
// Usar dentro de uma section com position: relative.
export function NeuronBackground({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <BrainCircuit className="absolute -right-16 -top-16 text-primary" size={360} strokeWidth={1} />
      <BrainCircuit className="absolute -left-20 -bottom-16 text-teal rotate-[18deg]" size={240} strokeWidth={1} />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" className="text-primary">
          {/* Neurônio A */}
          <path d="M130 140 L90 100 M90 100 L70 80 M90 100 L60 110" />
          <path d="M130 140 L100 180 M100 180 L70 190 M100 180 L85 220" />
          <path d="M130 140 L160 90 M160 90 L150 60 M160 90 L185 75" />
          <path d="M130 140 L280 220 M280 220 L300 200 M280 220 L295 242 M280 220 L312 225" />

          {/* Neurônio B */}
          <path d="M300 232 L332 192 M332 192 L352 172 M332 192 L320 165" />
          <path d="M300 232 L336 262 M336 262 L366 252 M336 262 L346 286" />
          <path d="M300 232 L480 150 M480 150 L506 130 M480 150 L500 162 M480 150 L516 146" />

          {/* Neurônio C */}
          <path d="M500 162 L530 110 M530 110 L556 90 M530 110 L520 80" />
          <path d="M500 162 L540 200 M540 200 L570 196 M540 200 L550 226" />
          <path d="M500 162 L622 322 M622 322 L646 302 M622 322 L642 336 M622 322 L656 317" />

          {/* Neurônio D — solto, mais abaixo */}
          <path d="M200 430 L165 398 M165 398 L145 378 M165 398 L150 408" />
          <path d="M200 430 L175 468 M175 468 L150 478 M175 468 L160 502" />
          <path d="M200 430 L332 486 M332 486 L356 470 M332 486 L350 500" />

          {/* Neurônio E — canto superior direito */}
          <path d="M680 90 L710 60 M710 60 L730 40 M710 60 L720 75" />
          <path d="M680 90 L650 70 M650 70 L625 55" />
          <path d="M680 90 L705 130 M705 130 L730 145" />

          {/* Neurônio F — canto inferior direito */}
          <path d="M600 480 L635 455 M635 455 L660 440" />
          <path d="M600 480 L575 510 M575 510 L555 530" />
          <path d="M600 480 L640 505 M640 505 L665 520" />
        </g>

        {/* Corpos dos neurônios (soma) */}
        <g fill="currentColor" className="text-teal">
          <circle cx="130" cy="140" r="6" />
          <circle cx="300" cy="232" r="6" />
          <circle cx="500" cy="162" r="6" />
          <circle cx="200" cy="430" r="5" />
          <circle cx="680" cy="90" r="4.5" />
          <circle cx="600" cy="480" r="4.5" />
        </g>

        {/* Células da glia (astrócitos) — marcas em asterisco espalhadas */}
        <g stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-primary">
          <path d="M240 60 L260 60 M245 51.3 L255 68.7 M245 68.7 L255 51.3" />
          <path d="M630 250 L650 250 M635 241.3 L645 258.7 M635 258.7 L645 241.3" />
          <path d="M60 260 L80 260 M65 251.3 L75 268.7 M65 268.7 L75 251.3" />
          <path d="M430 380 L450 380 M435 371.3 L445 388.7 M435 388.7 L445 371.3" />
          <path d="M380 60 L396 60 M383.6 52.9 L392.4 67.1 M383.6 67.1 L392.4 52.9" />
        </g>
        <g fill="currentColor" className="text-teal">
          <circle cx="250" cy="60" r="2.5" />
          <circle cx="640" cy="250" r="2.5" />
          <circle cx="70" cy="260" r="2.5" />
          <circle cx="440" cy="380" r="2.5" />
          <circle cx="388" cy="60" r="2" />
        </g>
      </svg>
    </div>
  )
}
