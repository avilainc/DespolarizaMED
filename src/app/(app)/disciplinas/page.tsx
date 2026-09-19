import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { getSubjects } from "@/lib/payload/queries";
import { progressoDasDisciplinas } from "@/features/courses/queries";
import { visualDaDisciplina } from "@/lib/subjects-visual";
import { SubjectIcon } from "@/components/subject-icon";
import { IllustrationMolecule } from "@/components/illustrations";
import { ProgressBar } from "@/components/metric-card";
import { PageHeader, PageShell } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Disciplinas — DespolarizaMED" };

export default async function DisciplinasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [subjects, progresso] = await Promise.all([
    getSubjects(),
    progressoDasDisciplinas(session?.user.id),
  ]);

  return (
    <PageShell largura="larga">
      <PageHeader
        titulo="Disciplinas"
        descricao="Aulas organizadas por módulo, do começo da matéria até a revisão. Escolha por onde continuar."
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Disciplinas" }]}
      />

      {subjects.length === 0 ? (
        <EmptyState
          ilustracao={<IllustrationMolecule />}
          titulo="Nenhuma disciplina publicada ainda"
          descricao="As aulas estão sendo preparadas. Enquanto isso, o banco de questões e as provas antigas já estão liberados."
          acao={
            <Button render={<Link href="/questoes" />}>
              Ir para o banco de questões
              <ArrowRight />
            </Button>
          }
        />
      ) : (
        /* auto-rows-fr para todos os cards da linha terem a mesma altura mesmo
           com descrições de tamanhos diferentes: sem isso, o "Continuar" de
           cada card fica numa altura, e a linha parece desalinhada. */
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => {
            const p = progresso.get(subject.id);
            const { corVar } = visualDaDisciplina(subject.name);
            return (
              <Link
                key={subject.id}
                href={`/disciplinas/${subject.slug}`}
                className="group flex flex-col rounded-xl bg-card p-5 shadow-xs ring-1 ring-foreground/8 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
              >
                <SubjectIcon disciplina={subject.name} size="lg" />
                <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">{subject.name}</h2>
                {subject.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subject.description}</p>
                )}

                {/* mt-auto empurra o rodapé do card para baixo, então progresso
                    e CTA alinham entre cards de descrições diferentes. */}
                <div className="mt-auto pt-4">
                  {p && p.totalAulas > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {p.totalAulas} {p.totalAulas === 1 ? "aula" : "aulas"}
                        {p.totalModulos > 0 && (
                          <>
                            {" · "}
                            {p.totalModulos} {p.totalModulos === 1 ? "módulo" : "módulos"}
                          </>
                        )}
                      </p>
                      <div className="mt-2">
                        <ProgressBar
                          valor={p.concluidas}
                          total={p.totalAulas}
                          cor={corVar}
                          altura="fina"
                          rotuloAcessivel={`${p.concluidas} de ${p.totalAulas} aulas concluídas em ${subject.name}`}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {p.concluidas} de {p.totalAulas} concluídas
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aulas em preparação</p>
                  )}

                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Continuar
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
