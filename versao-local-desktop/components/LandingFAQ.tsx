'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  { q: 'Esse curso é só para quem vai prestar medicina?', a: "Não, apesar do sufixo \"-med\", o curso é voltado para todos que desejam fazer concursos e vestibulares para melhorar nas mais diversas matérias e consolidar os conhecimentos." },
  { q: 'Como funciona a assinatura?', a: 'Você assina um plano mensal ou anual e tem acesso a todo o conteúdo incluso nele enquanto a assinatura estiver ativa. Pode cancelar quando quiser, direto na plataforma.' },
  { q: 'As aulas ficam disponíveis pra sempre?', a: 'Enquanto sua assinatura estiver ativa, sim — você acessa quantas vezes quiser. O acesso é vinculado à assinatura, não é uma compra vitalícia avulsa.' },
  { q: 'Posso assistir pelo celular?', a: 'Sim, a plataforma funciona no navegador do celular, tablet ou computador, sem precisar instalar nada.' },
  { q: 'Tem garantia?', a: 'Sim, você tem 7 dias corridos após a assinatura pra pedir reembolso integral caso a plataforma não seja o que você esperava.' },
  { q: 'Os plantões ao vivo ficam gravados?', a: 'O foco dos plantões é a interação ao vivo pra tirar dúvida na hora. Consulte a área de Plantões pra ver os horários fixos da semana.' },
]

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="max-w-2xl mx-auto divide-y divide-edge">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={item.q} className="py-4">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left"
            >
              <span className="text-fg font-medium text-sm sm:text-base">{item.q}</span>
              <ChevronDown size={18} className={`text-faint shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <p className="text-muted text-sm mt-3 leading-relaxed">{item.a}</p>}
          </div>
        )
      })}
    </div>
  )
}
