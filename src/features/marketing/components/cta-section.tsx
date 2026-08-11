import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pronto para transformar sua preparação?
        </h2>
        <p className="max-w-xl text-primary-foreground/90">
          Junte-se ao DespolarizaMED e tenha aulas, exercícios, provas e acompanhamento em um
          único lugar.
        </p>
        <Link href="/cadastro" className={buttonVariants({ size: "lg", variant: "secondary" })}>
          Criar minha conta
          <ArrowRight className="ms-2 size-4" />
        </Link>
      </div>
    </section>
  );
}
