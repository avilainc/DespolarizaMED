import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Último bloco da landing: o azul-marinho institucional em bloco cheio, que
 * é o único lugar da página pública onde ele aparece assim. Serve de ponto
 * final — depois dele só vem o rodapé.
 */
export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-[var(--espaco-vitrine)] sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-marca-funda px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="trama-axonio-clara pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]"
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
          <h2 className="t-display text-white">Pronto para começar a estudar?</h2>
          <p className="text-[1.0625rem] leading-relaxed text-marca-funda-texto">
            Aulas, banco de questões, provas antigas, plano de estudos e plantões ao vivo — em uma
            assinatura só.
          </p>
          <Link
            href="/cadastro"
            className={buttonVariants({ size: "lg", variant: "secondary", className: "mt-2" })}
          >
            Criar minha conta
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
