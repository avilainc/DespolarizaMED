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
  const [principal, ...demais] = testimonials;

  return (
    <section className="secao-vitrine mx-auto max-w-6xl px-4 sm:px-6">
      <CabecalhoDeSecao sobretitulo="Depoimentos" titulo="Quem estuda com a gente" />

      {/* Página 3 do redesign do Paulo: um depoimento em destaque, com a
          borda teal, e os outros menores embaixo. Quatro cartões do mesmo
          tamanho diziam "quatro opiniões iguais"; o destaque diz "leia este". */}
      <div className="mx-auto mt-12 max-w-4xl">
        {principal && (
          <figure className="cartao cartao-p-lg relative overflow-hidden border-l-4 border-l-brand-teal sm:pl-10">
            <Quote aria-hidden className="size-8 shrink-0 text-brand-teal" />
            <blockquote className="mt-4 text-[1.125rem] leading-relaxed text-text-primary">
              {principal.quote}
            </blockquote>
            <figcaption className="mt-5">
              <p className="text-[0.9375rem] font-semibold text-text-primary">{principal.name}</p>
              <p className="t-meta mt-0.5">{principal.result}</p>
            </figcaption>
          </figure>
        )}

        {demais.length > 0 && (
          <div className={`mt-5 grid gap-5 ${demais.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {demais.map((testimonial, i) => (
              <figure key={testimonial.name} className="cartao cartao-p-md flex flex-col">
                <Quote
                  aria-hidden
                  className="size-6 shrink-0"
                  style={{ color: i % 2 ? "var(--brand-600)" : "var(--destaque)" }}
                />
                <blockquote className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-text-secondary">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-4">
                  <p className="text-[0.875rem] font-semibold text-text-primary">
                    {testimonial.name}
                  </p>
                  <p className="t-meta mt-0.5">{testimonial.result}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
