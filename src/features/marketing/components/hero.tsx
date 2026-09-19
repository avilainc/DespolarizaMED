import Image from "next/image";
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
          {/* `text-brand-orange-texto`, não `text-brand-orange`: o laranja cheio
              sobre este fundo mede 2.20:1, e AA exige 4.5:1 para 14px. */}
          <span className="inline-flex items-center rounded-full bg-brand-orange/15 px-3 py-1 text-sm font-medium text-brand-orange-texto">
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
            <Link href="/#planos" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Ver planos
            </Link>
          </div>
        </div>

        {/* Era um <img> para /perfil.jpg, que nunca existiu em public/ (404 em
            produção). Depois virou o próprio emblema ampliado — honesto, mas
            é o logotipo repetido a 30 cm do logotipo do cabeçalho.
            Agora é a ilustração da marca: o neurônio despolarizando do emblema,
            desenhado em linha, com a onda do potencial de ação. Diz de onde vem
            o nome sem precisar escrever, e é desenho próprio — não uma foto de
            banco de imagens que qualquer curso poderia usar. */}
        <div className="relative mx-auto flex w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-accent/25 p-8 shadow-md sm:max-w-md">
          <div
            aria-hidden
            className="trama-axonio pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
          />
          <Image
            src="/illustrations/marca-axonio.svg"
            alt=""
            aria-hidden
            width={420}
            height={233}
            priority
            className="relative h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
