import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, CirclePlay, Clock3, Layers } from "lucide-react";
import { auth } from "@/lib/auth";
import { visualDaMateria } from "@/lib/materias";
import { getModulesBySubject, getLessonsByModule, getSubjectBySlug } from "@/lib/payload/queries";
import { estadoDasAulas } from "@/features/dashboard/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/metric-card";
import { IconTile } from "@/components/ui/surface";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  return { title: subject ? `${subject.name} — DespolarizaMED` : "Disciplina — DespolarizaMED" };
}

function duracao(segundos: number | null | undefined) {
  if (!segundos || segundos <= 0) return null;
  return `${Math.round(segundos / 60)} min`;
}

export default async function DisciplinaPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const subject = await getSubjectBySlug(slug);

  if (!subject) {
    notFound();
  }

  const modules = await getModulesBySubject(subject.id);
  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => ({
      module: mod,
      lessons: await getLessonsByModule(mod.id),
    })),
  );

  const todasAsAulas = modulesWithLessons.flatMap((m) => m.lessons);
  const estado = await estadoDasAulas(
    session!.user.id,
    todasAsAulas.map((a) => a.id),
  );

  const totalAulas = todasAsAulas.length;
  const totalConcluidas = todasAsAulas.filter((a) => estado.get(a.id)?.concluida).length;
  const visual = visualDaMateria(subject.slug || subject.name);

  // A "aula atual" é a primeira não concluída da disciplina inteira: é ela que
  // ganha o estado ▶ na lista, e só ela.
  const aulaAtual = todasAsAulas.find((a) => !estado.get(a.id)?.concluida)?.id ?? null;

  return (
    <>
      <PageHeader
        migalhas={[{ rotulo: "Disciplinas", href: "/disciplinas" }, { rotulo: subject.name }]}
        titulo={
          <span className="flex items-center gap-3">
            <IconTile icone={visual.icone} cor={visual.cor} tamanho="lg" />
            {subject.name}
          </span>
        }
        descricao={subject.description ?? undefined}
      />

      {/* Hero da disciplina: progresso e contagem de módulos, com a ilustração
          científica da matéria. Pequeno de propósito — o conteúdo é a lista de
          aulas, não o cabeçalho. */}
      {totalAulas > 0 && (
        <section
          className="mb-8 overflow-hidden cartao cartao-p-md"
          style={{ borderTopColor: visual.cor, borderTopWidth: 3 }}
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-[14rem] flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="t-eyebrow">Seu progresso</p>
                <p className="tabular text-[0.875rem] text-text-secondary">
                  <strong className="text-text-primary">{totalConcluidas}</strong> de {totalAulas}{" "}
                  aulas
                </p>
              </div>
              <ProgressBar
                valor={totalConcluidas}
                total={totalAulas}
                cor={visual.cor}
                rotulo={`Progresso em ${subject.name}`}
                className="mt-2.5"
              />
              <p className="t-meta mt-3 inline-flex items-center gap-1.5">
                <Layers aria-hidden className="size-4" />
                {modulesWithLessons.length}{" "}
                {modulesWithLessons.length === 1 ? "módulo" : "módulos"} · {totalAulas}{" "}
                {totalAulas === 1 ? "aula" : "aulas"}
              </p>
            </div>

            {visual.ilustracao && (
              <Image
                src={visual.ilustracao}
                alt=""
                aria-hidden
                width={176}
                height={132}
                className="hidden h-auto w-40 shrink-0 sm:block"
              />
            )}
          </div>
        </section>
      )}

      {modulesWithLessons.length === 0 ? (
        <EmptyState
          ilustracao="/illustrations/vazio-conteudo.svg"
          titulo="Nenhum módulo publicado ainda"
          descricao={`${subject.name} já existe no catálogo, mas os módulos e aulas ainda estão sendo preparados pela equipe.`}
        />
      ) : (
        <div className="space-y-6">
          {modulesWithLessons.map(({ module: mod, lessons }) => {
            const concluidasNoModulo = lessons.filter((l) => estado.get(l.id)?.concluida).length;

            return (
              <section
                key={mod.id}
                className="overflow-hidden cartao"
              >
                <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-surface-subtle/60 px-5 py-4">
                  <h2 className="t-section min-w-0 flex-1 text-text-primary">{mod.name}</h2>
                  <p className="tabular text-[0.8125rem] text-text-muted">
                    {lessons.length} {lessons.length === 1 ? "aula" : "aulas"}
                    {concluidasNoModulo > 0 && ` · ${concluidasNoModulo} concluídas`}
                  </p>
                  {lessons.length > 0 && (
                    <ProgressBar
                      valor={concluidasNoModulo}
                      total={lessons.length}
                      cor={visual.cor}
                      tamanho="sm"
                      rotulo={`Progresso em ${mod.name}`}
                      className="basis-full sm:max-w-40 sm:basis-auto"
                    />
                  )}
                </header>

                {lessons.length === 0 ? (
                  <p className="px-5 py-6 text-[0.875rem] text-text-muted">
                    Nenhuma aula publicada neste módulo ainda.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {lessons.map((lesson) => {
                      const p = estado.get(lesson.id);
                      const concluida = p?.concluida ?? false;
                      const atual = lesson.id === aulaAtual;
                      const iniciada = !concluida && (p?.posicao ?? 0) > 0;

                      return (
                        <li key={lesson.id}>
                          <Link
                            href={`/aulas/${lesson.slug}`}
                            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-subtle/70"
                          >
                            {/* Três estados, e cada um com ÍCONE próprio além da
                                cor: concluída (✓), atual (▶) e não iniciada (○).
                                Só a cor não serve para quem não a distingue. */}
                            {concluida ? (
                              <CheckCircle2
                                aria-hidden
                                className="size-5 shrink-0 text-success"
                                style={{ color: visual.cor }}
                              />
                            ) : atual || iniciada ? (
                              <CirclePlay
                                aria-hidden
                                className="size-5 shrink-0"
                                style={{ color: visual.cor }}
                              />
                            ) : (
                              <Circle aria-hidden className="size-5 shrink-0 text-border-strong" />
                            )}

                            <span className="min-w-0 flex-1">
                              <span
                                className={
                                  concluida
                                    ? "block text-[0.9375rem] text-text-muted"
                                    : "block text-[0.9375rem] font-medium text-text-primary"
                                }
                              >
                                {lesson.title}
                              </span>
                              <span className="sr-only">
                                {concluida
                                  ? " — concluída"
                                  : atual || iniciada
                                    ? " — em andamento"
                                    : " — não iniciada"}
                              </span>
                            </span>

                            {duracao(lesson.durationSeconds) && (
                              <span className="t-meta tabular hidden shrink-0 items-center gap-1 sm:inline-flex">
                                <Clock3 aria-hidden className="size-3.5" />
                                {duracao(lesson.durationSeconds)}
                              </span>
                            )}

                            {atual && !concluida && (
                              <span
                                className="shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold"
                                style={{
                                  background: `color-mix(in oklch, ${visual.cor} 12%, transparent)`,
                                  color: visual.cor,
                                }}
                              >
                                continuar
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
