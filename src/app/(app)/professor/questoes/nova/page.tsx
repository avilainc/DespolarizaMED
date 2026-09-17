import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { getSubjects } from "@/lib/payload/queries";
import { temasAutorais } from "@/features/questions/queries";
import { QuestionForm } from "@/features/questions/components/question-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Nova questão — DespolarizaMED" };

export default async function NovaQuestaoPage() {
  await requireSessionWithRole("TEACHER");
  const [disciplinas, temas] = await Promise.all([getSubjects(), temasAutorais()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/professor/questoes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Questões autorais
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-foreground">Nova questão</h1>
      <p className="mt-1 mb-8 text-muted-foreground">
        Fórmulas em LaTeX entre cifrões: <code className="rounded bg-muted px-1">$C_6H_{"{12}"}O_6$</code>,{" "}
        <code className="rounded bg-muted px-1">$\frac{"{v}"}{"{t}"}$</code>.
      </p>

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
