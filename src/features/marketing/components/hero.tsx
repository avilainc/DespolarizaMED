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
            produção) e, mesmo se existisse, era o próprio logo em 128 px
            servindo de "foto do professor". Enquanto não houver foto real da
            equipe, o emblema da marca em alta é mais honesto que um retrato
            que não existe. */}
        <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-accent/20 shadow-xl sm:max-w-md">
          <Image
            src="/logo.png"
            alt="DespolarizaMED"
            width={512}
            height={512}
            priority
            className="w-3/4 drop-shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
