import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Superfície base da plataforma: branco, borda sutil, raio consistente, sombra
 * quase invisível. Todo card nasce daqui, e por isso não existe "card dentro
 * de card" com bordas somando — o aninhamento usa `Divisor` ou fundo
 * `surface-subtle`, não outra `Surface`.
 */
export function Surface({
  children,
  className,
  padding = "md",
  as: Tag = "div",
  ...props
}: React.ComponentProps<"div"> & {
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "section" | "article" | "aside";
}) {
  // Tres tamanhos, vindos de `--card-p-*`. Nao existe um quarto.
  const p = { none: "", sm: "cartao-p-sm", md: "cartao-p-md", lg: "cartao-p-lg" }[padding];
  return (
    <Tag
      className={cn("cartao", p, className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * Card de ação: ícone colorido, título, descrição e seta. É o "atalho" do
 * dashboard e das áreas de professor/administração.
 *
 * `destaque` levanta o card sem trocar a cor de fundo: fundo colorido em card
 * de atalho vira carnaval quando são quatro lado a lado.
 */
export function ActionCard({
  href,
  icone: Icone,
  titulo,
  children,
  cor,
  externo = false,
  className,
}: {
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  titulo: React.ReactNode;
  children?: React.ReactNode;
  cor?: string;
  externo?: boolean;
  className?: string;
}) {
  const Componente = externo ? "a" : Link;

  return (
    <Componente
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group/acao flex h-full flex-col cartao cartao-p-md cartao-interativo",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex size-10 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in oklch, ${cor ?? "var(--brand-500)"} 12%, transparent)`,
          color: cor ?? "var(--brand-600)",
        }}
      >
        <Icone className="size-5" />
      </span>

      <span className="t-card-title mt-4 flex items-center gap-2 text-text-primary">
        <span className="min-w-0 flex-1">{titulo}</span>
        <ArrowRight
          aria-hidden
          className="size-4 shrink-0 text-text-muted transition-transform duration-200 group-hover/acao:translate-x-0.5 group-hover/acao:text-brand-600"
        />
      </span>

      {children && (
        <span className="mt-1.5 block text-[0.875rem] leading-relaxed text-text-muted">
          {children}
        </span>
      )}
    </Componente>
  );
}

/**
 * Container de ícone colorido. Usado em títulos de seção, linhas de lista e
 * cabeçalhos de card — sempre com a MESMA proporção entre caixa e ícone, que
 * é o que faz a iconografia parecer um sistema e não ícones avulsos.
 */
export function IconTile({
  icone: Icone,
  cor,
  tamanho = "md",
  className,
}: {
  icone: React.ComponentType<{ className?: string }>;
  cor?: string;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const medidas = {
    sm: { caixa: "size-8 rounded-lg", icone: "size-4" },
    md: { caixa: "size-10 rounded-xl", icone: "size-5" },
    lg: { caixa: "size-12 rounded-2xl", icone: "size-6" },
  }[tamanho];

  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center", medidas.caixa, className)}
      style={{
        background: `color-mix(in oklch, ${cor ?? "var(--brand-500)"} 12%, transparent)`,
        color: cor ?? "var(--brand-600)",
      }}
    >
      <Icone className={medidas.icone} />
    </span>
  );
}

/** Divisor interno de card — a alternativa a aninhar bordas. */
export function Divisor({ className }: { className?: string }) {
  return <hr className={cn("border-t border-border", className)} />;
}
