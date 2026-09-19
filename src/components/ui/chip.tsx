import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chip de filtro que é um link (o estado dos filtros vive na URL, e essa
 * decisão fica de pé: dá para compartilhar "FUVEST 2024 de genética" e voltar
 * pelo histórico).
 *
 * `aria-current="true"` no ativo em vez de depender só do fundo azul: é o que
 * permite a quem usa leitor de tela saber qual recorte está aplicado.
 */
export function FilterChip({
  href,
  ativo,
  icone: Icone,
  cor,
  contagem,
  children,
}: {
  href: string;
  ativo?: boolean;
  icone?: LucideIcon;
  cor?: string;
  contagem?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
        ativo
          ? "border-brand-400 bg-brand-50 text-brand-700"
          : "border-border bg-surface text-text-secondary hover:border-brand-300 hover:text-text-primary",
      )}
    >
      {Icone && (
        <Icone
          aria-hidden
          className="size-3.5 shrink-0"
          style={cor && !ativo ? { color: cor } : undefined}
        />
      )}
      <span className="min-w-0">{children}</span>
      {contagem !== undefined && (
        <span
          className={cn(
            "tabular ml-0.5 rounded-md px-1.5 py-0.5 text-[0.6875rem]",
            ativo ? "bg-brand-200/60 text-brand-800" : "bg-surface-subtle text-text-muted",
          )}
        >
          {contagem.toLocaleString("pt-BR")}
        </span>
      )}
    </Link>
  );
}

/**
 * Etiqueta informativa (banca, ano, status). Diferente do `Badge` do shadcn
 * por um motivo prático: aqui o tom carrega SIGNIFICADO e vem com contraste
 * AA garantido sobre o próprio fundo, enquanto o Badge padrão só tinha
 * `default`/`secondary`/`destructive` e cada tela inventava cor por cima.
 */
export function Tag({
  tom = "neutro",
  icone: Icone,
  cor,
  children,
  className,
}: {
  tom?: "neutro" | "marca" | "positivo" | "atencao" | "negativo" | "materia";
  icone?: LucideIcon;
  /** Obrigatório quando `tom="materia"`. */
  cor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const tons = {
    neutro: "bg-surface-subtle text-text-secondary",
    marca: "bg-brand-50 text-brand-700",
    positivo: "bg-success-soft text-success-text",
    atencao: "bg-warning-soft text-warning-text",
    negativo: "bg-danger-soft text-danger-text",
    materia: "",
  }[tom];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide",
        tons,
        className,
      )}
      style={
        tom === "materia" && cor
          ? { background: `color-mix(in oklch, ${cor} 12%, transparent)`, color: cor }
          : undefined
      }
    >
      {Icone && <Icone aria-hidden className="size-3 shrink-0" />}
      {children}
    </span>
  );
}

/**
 * Avatar de iniciais. Nunca houve foto de perfil no produto e inventar uma
 * seria pior; as iniciais sobre o azul da marca identificam a pessoa e mantêm
 * a lista de alunos legível de relance.
 */
export function InitialsAvatar({
  nome,
  tamanho = "md",
  className,
}: {
  nome: string;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("pt-BR"))
    .join("");

  const medidas = {
    sm: "size-7 text-[0.6875rem]",
    md: "size-9 text-[0.8125rem]",
    lg: "size-14 text-lg",
  }[tamanho];

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800",
        medidas,
        className,
      )}
    >
      {iniciais || nome.slice(0, 1).toLocaleUpperCase("pt-BR")}
    </span>
  );
}
