import { cn } from "@/lib/utils";

/**
 * Métrica com hierarquia explícita: rótulo pequeno, valor grande, apoio menor.
 *
 * O card de métrica antigo usava CardTitle para o rótulo e uma div para o
 * valor, então rótulo e número tinham peso visual parecido e a leitura
 * emperrava. Aqui a ordem de leitura é o número primeiro.
 */
export function MetricCard({
  rotulo,
  valor,
  apoio,
  icone: Icone,
  cor,
  className,
}: {
  rotulo: string;
  valor: string | number;
  apoio?: React.ReactNode;
  icone?: React.ComponentType<{ className?: string }>;
  /** Variável CSS da cor do ícone, por exemplo "--subject-biologia". Sem isto usa o azul institucional. */
  cor?: string;
  className?: string;
}) {
  const corVar = cor ?? "--primary";
  return (
    <div className={cn("rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{rotulo}</p>
        {Icone && (
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4"
            style={{
              backgroundColor: `color-mix(in oklch, var(${corVar}), transparent 90%)`,
              color: `var(${corVar})`,
            }}
            aria-hidden
          >
            <Icone />
          </div>
        )}
      </div>
      <p className="mt-2 font-heading text-[1.75rem] leading-none font-semibold tabular-nums text-foreground">
        {valor}
      </p>
      {apoio && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{apoio}</p>}
    </div>
  );
}

/**
 * Barra de progresso. `valor` e `total` em vez de porcentagem pronta para o
 * aria-valuetext poder dizer "3 de 5 aulas" em vez de "60%", que é o que o
 * aluno realmente quer saber quando usa leitor de tela.
 */
export function ProgressBar({
  valor,
  total,
  rotuloAcessivel,
  cor,
  className,
  altura = "padrao",
}: {
  valor: number;
  total: number;
  rotuloAcessivel: string;
  cor?: string;
  className?: string;
  altura?: "padrao" | "fina";
}) {
  const pct = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotuloAcessivel}
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        altura === "fina" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${pct}%`, backgroundColor: cor ? `var(${cor})` : "var(--primary)" }}
      />
    </div>
  );
}
