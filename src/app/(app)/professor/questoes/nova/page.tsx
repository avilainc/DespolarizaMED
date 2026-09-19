import type { Metadata } from "next";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { getSubjects } from "@/lib/payload/queries";
import { temasAutorais } from "@/features/questions/queries";
import { QuestionForm } from "@/features/questions/components/question-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Nova questão — DespolarizaMED" };

export default async function NovaQuestaoPage() {
  await requireSessionWithRole("TEACHER");
  const [disciplinas, temas] = await Promise.all([getSubjects(), temasAutorais()]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        migalhas={[
          { rotulo: "Área do professor", href: "/professor" },
          { rotulo: "Questões autorais", href: "/professor/questoes" },
          { rotulo: "Nova questão" },
        ]}
        titulo="Nova questão"
        descricao={
          <>
            Fórmulas em LaTeX entre cifrões:{" "}
            <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[0.875rem]">
              $C_6H_{"{12}"}O_6$
            </code>
            ,{" "}
            <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[0.875rem]">
              $\frac{"{v}"}{"{t}"}$
            </code>
            .
          </>
        }
      />

      {disciplinas.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Cadastre ao menos uma disciplina no painel de conteúdo antes de criar questões.
        </p>
      ) : (
        <QuestionForm
          disciplinas={disciplinas.map((d) => ({ id: d.id, name: d.name }))}
          temasSugeridos={temas.map((t) => t.topic)}
        />
      )}
    </div>
  );
}
