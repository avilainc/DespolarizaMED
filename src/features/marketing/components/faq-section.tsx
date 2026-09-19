import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/features/marketing/content";
import { CabecalhoDeSecao } from "./secao";

export function FaqSection() {
  return (
    <section id="faq" className="secao-vitrine bg-surface-subtle">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <CabecalhoDeSecao
          sobretitulo="Dúvidas"
          titulo="Perguntas frequentes"
          descricao="O que mais perguntam antes de assinar."
        />

        {/* As perguntas dentro de um cartão, e não soltas sobre o fundo: o
            acordeão abre e fecha altura, e sem uma superfície por trás a
            página parece pular. */}
        <Accordion className="cartao mt-10 px-5">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={index} className="not-last:border-border">
              <AccordionTrigger className="gap-4 py-4 text-[1rem] text-text-primary hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-[0.9375rem] leading-relaxed text-text-secondary">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
