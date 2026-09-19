import { Quote } from "lucide-react";
import { testimonials } from "@/features/marketing/content";
import { CabecalhoDeSecao } from "./secao";

/**
 * Os depoimentos continuam anônimos de propósito: `content.ts` registra que
 * nome e autorização de quem falou ainda não existem. Enquanto for assim, o
 * card não finge ter uma pessoa — não há foto, nem "@" de rede social, nem
 * inicial inventada. É texto atribuído a um perfil ("Aluna aprovada em
 * Medicina"), e o desenho não tenta esconder isso.
 */
export function TestimonialsSection() {
  return (
    <section className="secao-vitrine mx-auto max-w-6xl px-4 sm:px-6">
      <CabecalhoDeSecao sobretitulo="Depoimentos" titulo="Quem estuda com a gente" />

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
        {testimonials.map((testimonial) => (
          <figure key={testimonial.name} className="cartao cartao-p-lg flex flex-col">
            <Quote aria-hidden className="size-7 shrink-0 text-brand-200" />
            <blockquote className="mt-4 flex-1 text-[1rem] leading-relaxed text-text-primary">
              {testimonial.quote}
            </blockquote>
            <figcaption className="mt-5 border-t border-border pt-4">
              <p className="text-[0.9375rem] font-semibold text-text-primary">
                {testimonial.name}
              </p>
              <p className="t-meta mt-0.5">{testimonial.result}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
