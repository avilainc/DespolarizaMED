import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Estado vazio.
 *
 * A regra que este componente existe para impor: nenhuma tela do
 * DespolarizaMED deixa uma frase solta no meio de uma página grande. Um estado
 * vazio tem sempre figura, título, explicação do que fazer para preenchê-lo e,
 * quando existe um caminho, o botão que leva até lá.
 *
 * `ilustracao` é o caminho de um SVG em /public/illustrations; `icone` é o
 * caso menor, para vazios dentro de uma seção. Um ou outro, nunca os dois.
 */
export function EmptyState({
  ilustracao,
  icone: Icone,
  titulo,
  descricao,
  acao,
  tamanho = "md",
  className,
}: {
  ilustracao?: string;
  icone?: React.ComponentType<{ className?: string }>;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
  /** `sm` para vazios dentro de uma seção; `md` para a página inteira. */
  tamanho?: "sm" | "md";
  className?: string;
}) {
  const grande = tamanho === "md";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-border bg-surface text-center",
        grande ? "px-6 py-12 sm:py-16" : "px-5 py-10",
        className,
      )}
    >
      {ilustracao ? (
        // Dimensões explícitas e `priority` desligado: a ilustração está
        // sempre abaixo da dobra ou num estado excepcional, e o espaço já fica
        // reservado, então não desloca nada ao carregar (CLS).
        <Image
          src={ilustracao}
          alt=""
          aria-hidden
          width={grande ? 208 : 144}
          height={grande ? 156 : 108}
          className={cn("mb-6 h-auto", grande ? "w-52" : "w-36")}
        />
      ) : Icone ? (
        <span
          aria-hidden
          className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"
        >
          <Icone className="size-6" />
        </span>
      ) : null}

      <p className={cn("text-text-primary", grande ? "t-section" : "t-card-title")}>{titulo}</p>

      {descricao && (
        <p className="mt-2 max-w-[46ch] text-[0.9375rem] leading-relaxed text-text-muted">
          {descricao}
        </p>
      )}

      {acao && <div className="mt-6 flex flex-wrap justify-center gap-2">{acao}</div>}
    </div>
  );
}
