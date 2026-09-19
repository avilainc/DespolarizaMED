import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Cartão de métrica: ícone, rótulo, valor e uma informação secundária.
 *
 * A hierarquia é a razão de existir: rótulo pequeno, valor grande, apoio
 * menor ainda. Antes todo número da plataforma vinha num `<Card>` com
 * `CardTitle` em 14px e `CardContent` em 30px, e o resultado era uma fileira
 * de caixas em que nada dizia o que era mais importante.
 *
 * `tom` só muda de neutro quando o número SIGNIFICA alguma coisa (acerto alto,
 * pagamento atrasado). Métrica decorativa fica neutra.
 */
export function MetricCard({
  icone: Icone,
  rotulo,
  valor,
  apoio,
  tom = "neutro",
  href,
  cor,
  className,
}: {
  icone?: React.ComponentType<{ className?: string }>;
  rotulo: React.ReactNode;
  valor: React.ReactNode;
  apoio?: React.ReactNode;
  tom?: "neutro" | "positivo" | "atencao" | "negativo";
  href?: string;
  /** Sobrescreve a cor do ícone (usado pelas matérias). */
  cor?: string;
  className?: string;
}) {
  const tons = {
    neutro: { icone: "bg-brand-50 text-brand-600", valor: "text-text-primary" },
    positivo: { icone: "bg-success-soft text-success-text", valor: "text-success-text" },
    atencao: { icone: "bg-warning-soft text-warning-text", valor: "text-warning-text" },
    negativo: { icone: "bg-danger-soft text-danger-text", valor: "text-danger-text" },
  }[tom];

  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="t-eyebrow">{rotulo}</p>
        {Icone && (
          <span
            aria-hidden
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
              cor ? "bg-[color-mix(in_oklch,var(--tom)_12%,transparent)]" : tons.icone,
            )}
            style={cor ? ({ "--tom": cor, color: cor } as React.CSSProperties) : undefined}
          >
            <Icone className="size-[1.125rem]" />
          </span>
        )}
      </div>
      <p className={cn("t-metric mt-3", tons.valor)}>{valor}</p>
      {apoio && <p className="t-meta mt-1.5">{apoio}</p>}
    </>
  );

  const classe = cn(
    "block cartao cartao-p-md",
    href && "cartao-interativo",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }

  return <div className={classe}>{conteudo}</div>;
}

/**
 * Barra de progresso. `valor` e `total` em vez de porcentagem pronta porque o
 * leitor de tela precisa dos dois para anunciar "3 de 5", e porque a conta
 * feita num lugar só evita o `Math.round` divergente que existia em cinco
 * telas diferentes.
 */
export function ProgressBar({
  valor,
  total,
  rotulo,
  cor,
  tamanho = "md",
  className,
}: {
  valor: number;
  total: number;
  /** Descrição para leitor de tela quando não há texto visível ao lado. */
  rotulo?: string;
  cor?: string;
  tamanho?: "sm" | "md";
  className?: string;
}) {
  const seguro = Math.max(0, Math.min(valor, total));
  const pct = total > 0 ? Math.round((seguro / total) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={seguro}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuetext={`${pct}%`}
      aria-label={rotulo}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-subtle",
        tamanho === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: cor ?? "var(--brand-500)" }}
      />
    </div>
  );
}
