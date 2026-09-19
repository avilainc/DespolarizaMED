import { cn } from "@/lib/utils";

/**
 * Estado vazio com ilustração, título, explicação e saída.
 *
 * Era o defeito mais repetido da auditoria: uma frase solta no meio de uma
 * página enorme ("Nenhum plantão marcado.") sem dizer o que fazer a seguir.
 * As três partes são obrigatórias por assinatura: ilustração, o que está
 * vazio, e o que muda isso. A ação é opcional só porque há telas onde não
 * existe nada para o aluno fazer (um plantão depende do professor marcar).
 */
export function EmptyState({
  ilustracao,
  titulo,
  descricao,
  acao,
  className,
  tamanho = "padrao",
}: {
  ilustracao: React.ReactNode;
  titulo: string;
  descricao: React.ReactNode;
  acao?: React.ReactNode;
  className?: string;
  tamanho?: "padrao" | "compacto";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-border bg-card/60 text-center",
        tamanho === "compacto" ? "px-6 py-10" : "px-6 py-14 sm:py-16",
        className,
      )}
    >
      <div
        className={cn(
          "text-primary/35 [&>svg]:h-auto [&>svg]:w-full",
          tamanho === "compacto" ? "w-20" : "w-24 sm:w-28",
        )}
      >
        {ilustracao}
      </div>
      <h3 className="mt-6 font-heading text-lg font-semibold text-foreground">{titulo}</h3>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">{descricao}</p>
      {acao && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{acao}</div>}
    </div>
  );
}
