import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { contarQuestoesAutorais, listarQuestoesAutorais } from "@/features/questions/queries";
import { getSubjects } from "@/lib/payload/queries";
import { textoSemHtml } from "@/lib/math-html";
import { DeleteQuestionButton } from "@/features/questions/components/delete-question-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Questões autorais — DespolarizaMED" };

const POR_PAGINA = 20;

export default async function ProfessorQuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplina?: string; p?: string }>;
}) {
  await requireSessionWithRole("TEACHER");
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.p) || 1);
  const subjectId = sp.disciplina ? Number(sp.disciplina) : undefined;

  const [questoes, total, disciplinas] = await Promise.all([
    listarQuestoesAutorais({ subjectId, limite: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA }),
    contarQuestoesAutorais({ subjectId }),
    getSubjects(),
  ]);
  const paginas = Math.ceil(total / POR_PAGINA);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/professor"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Área do professor
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Questões autorais</h1>
          <p className="mt-1 text-muted-foreground">
            {total} {total === 1 ? "questão" : "questões"} escritas pelos professores, com disciplina e
            tema curados.
          </p>
        </div>
        <Button render={<Link href="/professor/questoes/nova" />}>
          <Plus data-icon="inline-start" /> Nova questão
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link
          href="/professor/questoes"
          className={`rounded-full border px-2.5 py-1 ${!subjectId ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
        >
          todas
        </Link>
        {disciplinas.map((d) => (
          <Link
            key={d.id}
            href={`/professor/questoes?disciplina=${d.id}`}
            className={`rounded-full border px-2.5 py-1 ${subjectId === d.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
          >
            {d.name}
          </Link>
        ))}
      </div>

      {questoes.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhuma questão ainda. Clique em “Nova questão” para escrever a primeira.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {questoes.map((q) => (
            <li key={q.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{q.disciplina ?? "?"}</Badge>
                <span className="text-muted-foreground">
                  {q.topic}
                  {q.subtopic ? ` · ${q.subtopic}` : ""}
                </span>
                <Badge variant="outline">{q.difficulty.toLowerCase()}</Badge>
                {q.vestibular && (
                  <Badge variant="outline">
                    {q.vestibular} {q.year ?? ""}
                  </Badge>
                )}
                {q.type === "DISSERTATIVA" && <Badge variant="outline">dissertativa</Badge>}
                <span className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="sm" render={<Link href={`/professor/questoes/${q.id}`} />} aria-label="Editar">
                    <Pencil />
                  </Button>
                  <DeleteQuestionButton id={q.id} />
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-foreground">{textoSemHtml(q.statement)}</p>
              {q.alternativas.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {q.alternativas.length} alternativas · correta:{" "}
                  {q.alternativas.find((a) => a.isCorrect === "true")?.label ?? "?"}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {paginas > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Paginação">
          {pagina > 1 ? (
            <Link href={`/professor/questoes?${subjectId ? `disciplina=${subjectId}&` : ""}p=${pagina - 1}`} className="text-primary hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link href={`/professor/questoes?${subjectId ? `disciplina=${subjectId}&` : ""}p=${pagina + 1}`} className="text-primary hover:underline">
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
