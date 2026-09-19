import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Migalha = { rotulo: string; href?: string };

/**
 * Cabeçalho padrão de página: migalha, título, linha de apoio e ações.
 *
 * Existe porque cada página escrevia o próprio `<h1 className="text-2xl">` com
 * um parágrafo abaixo, e o resultado eram títulos de tamanhos diferentes, sem
 * migalha e sem lugar previsível para o botão principal. Aqui o título é
 * `text-3xl` no desktop (a auditoria reclamava de tipografia pequena) e a
 * migalha some no mobile, onde ocupa uma linha inteira para pouca informação.
 */
export function PageHeader({
  titulo,
  descricao,
  migalhas,
  acoes,
  className,
  children,
}: {
  titulo: string;
  descricao?: React.ReactNode;
  migalhas?: Migalha[];
  acoes?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-8", className)}>
      {migalhas && migalhas.length > 0 && (
        <nav aria-label="Você está em" className="mb-2 hidden sm:block">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {migalhas.map((m, i) => (
              <li key={`${m.rotulo}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />}
                {m.href ? (
                  <Link href={m.href} className="rounded-sm hover:text-foreground hover:underline">
                    {m.rotulo}
                  </Link>
                ) : (
                  <span className="text-foreground">{m.rotulo}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl leading-tight font-semibold text-balance text-foreground sm:text-3xl">
            {titulo}
          </h1>
          {descricao && (
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">{descricao}</p>
          )}
        </div>
        {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {children}
    </div>
  );
}

/**
 * Título de seção dentro da página, com ícone opcional e um link à direita.
 * Mantém as seções distinguíveis umas das outras sem transformar cada uma num
 * card, que era o outro extremo (card dentro de card).
 */
export function SectionHeading({
  titulo,
  icone: Icone,
  acao,
  className,
}: {
  titulo: string;
  icone?: React.ComponentType<{ className?: string }>;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
        {Icone && <Icone className="size-[1.125rem] shrink-0 text-muted-foreground" />}
        {titulo}
      </h2>
      {acao}
    </div>
  );
}

/**
 * Casca de página: largura máxima e respiro laterais iguais em toda a área
 * logada. Antes cada página escolhia a sua (max-w-5xl aqui, max-w-6xl ali),
 * e trocar de aba mexia o conteúdo de lugar.
 */
export function PageShell({
  children,
  largura = "padrao",
  className,
}: {
  children: React.ReactNode;
  largura?: "padrao" | "larga" | "estreita";
  className?: string;
}) {
  const max = {
    estreita: "max-w-3xl",
    padrao: "max-w-5xl",
    larga: "max-w-7xl",
  }[largura];
  return <div className={cn("mx-auto w-full px-4 py-8 sm:px-6 sm:py-10", max, className)}>{children}</div>;
}
