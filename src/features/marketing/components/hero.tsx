import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const highlights = [
  "Aulas de Biologia, Física e Química",
  "Banco de questões com filtros por vestibular",
  "Plantões semanais ao vivo",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/60 to-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            Preparação para vestibulares de Medicina
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Uma jornada completa de preparação, não apenas videoaulas.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            O DespolarizaMED reúne aulas, exercícios, provas, plano de estudos, acompanhamento de
            desempenho e plantões ao vivo em um único ambiente — para quem quer entrar na Medicina.
          </p>

          <ul className="mt-6 space-y-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cadastro" className={buttonVariants({ size: "lg" })}>
              Começar agora
              <ArrowRight className="ms-2 size-4" />
            </Link>
            <Link href="#planos" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Ver planos
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xl sm:max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/perfil.jpg"
            alt="Professor do DespolarizaMED"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
