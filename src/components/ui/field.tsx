import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Campo de formulário: rótulo, controle, texto de ajuda e erro.
 *
 * O rótulo é obrigatório e VISÍVEL. Placeholder como rótulo some assim que a
 * pessoa digita, e quem volta a um formulário longo não tem mais como saber o
 * que aquele campo era — por isso `Field` não oferece a opção de esconder.
 *
 * A ligação entre rótulo, ajuda e erro é feita por id gerado aqui: é isso que
 * faz o leitor de tela anunciar "Data da prova, obrigatório, formato dd/mm"
 * em vez de só "editar texto".
 */
export function Field({
  rotulo,
  ajuda,
  erro,
  obrigatorio = false,
  children,
  className,
  htmlFor,
}: {
  rotulo: React.ReactNode;
  ajuda?: React.ReactNode;
  erro?: string | null;
  obrigatorio?: boolean;
  /** Recebe os ids de descrição; use quando o controle não for `children` direto. */
  children: React.ReactNode | ((ids: { id: string; describedBy: string }) => React.ReactNode);
  className?: string;
  htmlFor?: string;
}) {
  const gerado = React.useId();
  const id = htmlFor ?? gerado;
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  const describedBy = [ajuda ? idAjuda : null, erro ? idErro : null].filter(Boolean).join(" ");

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="t-label mb-1.5 block">
        {rotulo}
        {obrigatorio && (
          <span className="ml-1 text-danger-text" aria-hidden>
            *
          </span>
        )}
      </label>

      {typeof children === "function" ? children({ id, describedBy }) : children}

      {ajuda && !erro && (
        <p id={idAjuda} className="t-meta mt-1.5">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} role="alert" className="mt-1.5 text-[0.8125rem] text-danger-text">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * Os três controles. São `<input>`, `<select>` e `<textarea>` nativos com a
 * classe `.campo` de globals.css — altura, borda, foco e estado desabilitado
 * vêm todos de lá, e por isso não existe mais um campo de 36px ao lado de um
 * de 40px na mesma linha.
 */
export const TextField = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function TextField({ className, ...props }, ref) {
    return <input ref={ref} className={cn("campo", className)} {...props} />;
  },
);

export const SelectField = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  function SelectField({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn("campo", className)} {...props}>
        {children}
      </select>
    );
  },
);

export const TextAreaField = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function TextAreaField({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("campo", className)} {...props} />;
});

/**
 * Opção grande e clicável (checkbox ou radio "cartão"). Usada nas
 * disciplinas com mais dificuldade do plano de estudos e nos filtros do banco
 * de questões: alvo de toque de 44px, estado marcado visível sem depender só
 * da cor (tem borda, fundo E o próprio controle nativo).
 */
export function OptionCard({
  tipo,
  name,
  value,
  defaultChecked,
  icone: Icone,
  cor,
  children,
  descricao,
}: {
  tipo: "checkbox" | "radio";
  name: string;
  value: string;
  defaultChecked?: boolean;
  icone?: React.ComponentType<{ className?: string }>;
  cor?: string;
  children: React.ReactNode;
  descricao?: React.ReactNode;
}) {
  return (
    <label className="group/opcao flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50 has-[:focus-visible]:border-brand-500 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand-500/25 hover:border-brand-300">
      <input
        type={tipo}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-4 shrink-0 accent-brand-600"
      />
      {Icone && (
        <span
          aria-hidden
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${cor ?? "var(--brand-500)"} 12%, transparent)`,
            color: cor ?? "var(--brand-600)",
          }}
        >
          <Icone className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium text-text-primary">{children}</span>
        {descricao && <span className="t-meta block">{descricao}</span>}
      </span>
    </label>
  );
}
