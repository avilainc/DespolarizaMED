import { visualDaDisciplina } from "@/lib/subjects-visual";
import { cn } from "@/lib/utils";

const TAMANHOS = {
  sm: "size-8 [&>svg]:size-4",
  default: "size-10 [&>svg]:size-5",
  lg: "size-14 [&>svg]:size-7",
} as const;

/** Ícone da disciplina num container circular colorido — a assinatura visual repetida em card de disciplina, questão e prova. */
export function SubjectIcon({
  disciplina,
  size = "default",
  className,
}: {
  disciplina: string | null | undefined;
  size?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const { icon: Icon, corVar } = visualDaDisciplina(disciplina);
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-xl", TAMANHOS[size], className)}
      style={{
        backgroundColor: `color-mix(in oklch, var(${corVar}), transparent 88%)`,
        color: `var(${corVar})`,
      }}
      aria-hidden
    >
      <Icon strokeWidth={2} />
    </div>
  );
}
