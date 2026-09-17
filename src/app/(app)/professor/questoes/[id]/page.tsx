import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { getSubjects } from "@/lib/payload/queries";
import { obterQuestaoAutoral, temasAutorais } from "@/features/questions/queries";
import { QuestionForm } from "@/features/questions/components/question-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Editar questão — DespolarizaMED" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarQuestaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSessionWithRole("TEACHER");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [q, disciplinas, temas] = await Promise.all([obterQuestaoAutoral(id), getSubjects(), temasAutorais()]);
  if (!q) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/professor/questoes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Questões autorais
      </Link>
      <h1 className="mt-4 mb-8 text-2xl font-bold text-foreground">Editar questão</h1>

      <QuestionForm
        disciplinas={disciplinas.map((d) => ({ id: d.id, name: d.name }))}
        temasSugeridos={temas.map((t) => t.topic)}
        inicial={{
          id: q.id,
          subjectId: q.subjectId,
          topic: q.topic,
          subtopic: q.subtopic,
          type: q.type,
          difficulty: q.difficulty,
          vestibular: q.vestibular,
          year: q.year,
          statement: q.statement,
          explanation: q.explanation,
          alternativas: q.alternativas.map((a) => ({ label: a.label, content: a.content, isCorrect: a.isCorrect })),
        }}
      />
    </div>
  );
}
