import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { contarQuestoesAutorais, listarQuestoesAutorais } from "@/features/questions/queries";
import { getSubjects } from "@/lib/payload/queries";
import { textoSemHtml } from "@/lib/math-html";
import { DeleteQuestionButton } from "@/features/questions/components/delete-question-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, Tag } from "@/components/ui/chip";
import { visualDaMateria } from "@/lib/materias";
import { Pencil, PenLine, Plus } from "lucide-react";

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
    <>
      <PageHeader
        migalhas={[
          { rotulo: "Área do professor", href: "/professor" },
          { rotulo: "Questões autorais" },
        ]}
        titulo="Questões autorais"
        descricao={`${total} ${total === 1 ? "questão escrita" : "questões escritas"} pelos professores, com disciplina e tema curados — o contraponto ao acervo extraído das provas.`}
        acoes={
          <Button size="lg" render={<Link href="/professor/questoes/nova" />}>
            <Plus data-icon="inline-start" aria-hidden /> Nova questão
          </Button>
        }
        aside={
          <nav aria-label="Filtrar por disciplina" className="flex flex-wrap gap-2">
            <FilterChip href="/professor/questoes" ativo={!subjectId}>
              Todas as disciplinas
            </FilterChip>
            {disciplinas.map((d) => {
              const visual = visualDaMateria(d.slug || d.name);
              return (
                <FilterChip
                  key={d.id}
                  href={`/professor/questoes?disciplina=${d.id}`}
                  ativo={subjectId === d.id}
                  icone={visual.icone}
                  cor={visual.cor}
                >
                  {d.name}
                </FilterChip>
              );
            })}
          </nav>
        }
      />

      {questoes.length === 0 ? (
        <EmptyState
          ilustracao="/illustrations/estudo-questoes.svg"
          titulo="Nenhuma questão autoral ainda"
          descricao="Questões autorais são escritas pela equipe, com disciplina e tema definidos por quem entende do assunto — sem depender da classificação automática do acervo."
          acao={
            <Link
              href="/professor/questoes/nova"
              className={buttonVariants({ variant: "brand", size: "lg" })}
            >
              <PenLine data-icon="inline-start" aria-hidden />
              Escrever a primeira
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {questoes.map((q) => {
            const visual = visualDaMateria(q.disciplina);
            return (
              <li key={q.id} className="rounded-xl border border-border bg-surface p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tom="materia" cor={visual.cor} icone={visual.icone}>
                    {q.disciplina ?? "sem disciplina"}
                  </Tag>
                  <span className="t-meta">
                    {q.topic}
                    {q.subtopic ? ` · ${q.subtopic}` : ""}
                  </span>
                  <Tag
                    tom={
                      q.difficulty === "FACIL"
                        ? "positivo"
                        : q.difficulty === "DIFICIL"
                          ? "negativo"
                          : "atencao"
                    }
                  >
                    {q.difficulty.toLocaleLowerCase("pt-BR")}
                  </Tag>
                  {q.vestibular && (
                    <Tag tom="neutro">
                      {q.vestibular} {q.year ?? ""}
                    </Tag>
                  )}
                  {q.type === "DISSERTATIVA" && <Tag tom="marca">dissertativa</Tag>}
                  <span className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={`/professor/questoes/${q.id}`} />}
                      aria-label={`Editar questão de ${q.topic}`}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <DeleteQuestionButton id={q.id} />
                  </span>
                </div>
                <p className="mt-2.5 line-clamp-2 text-[0.9375rem] leading-relaxed text-text-primary">
                  {textoSemHtml(q.statement)}
                </p>
                {q.alternativas.length > 0 && (
                  <p className="t-meta mt-1.5">
                    {q.alternativas.length} alternativas · correta:{" "}
                    <strong className="font-semibold text-text-secondary">
                      {q.alternativas.find((a) => a.isCorrect === "true")?.label ?? "?"}
                    </strong>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {paginas > 1 && (
        <nav
          className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6"
          aria-label="Paginação"
        >
          {pagina > 1 ? (
            <Link
              href={`/professor/questoes?${subjectId ? `disciplina=${subjectId}&` : ""}p=${pagina - 1}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="tabular text-[0.875rem] text-text-muted">
            {pagina} / {paginas}
          </span>
          {pagina < paginas ? (
            <Link
              href={`/professor/questoes?${subjectId ? `disciplina=${subjectId}&` : ""}p=${pagina + 1}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Próxima
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
