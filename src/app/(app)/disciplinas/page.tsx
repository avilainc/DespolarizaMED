import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Layers, PlayCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { visualDaMateria } from "@/lib/materias";
import { progressoDasDisciplinas } from "@/features/dashboard/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/metric-card";
import { IconTile } from "@/components/ui/surface";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Disciplinas — DespolarizaMED",
};

export default async function DisciplinasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const disciplinas = await progressoDasDisciplinas(session!.user.id);

  const totalAulas = disciplinas.reduce((s, d) => s + d.totalAulas, 0);
  const totalConcluidas = disciplinas.reduce((s, d) => s + d.concluidas, 0);

  return (
    <>
      <PageHeader
        titulo="Disciplinas"
        descricao="Cada disciplina é dividida em módulos, e cada módulo em aulas. O progresso abaixo é o seu, contado pelas aulas que você marcou como concluídas."
        aside={
          totalAulas > 0 ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.875rem] text-text-secondary">
              <span className="inline-flex items-center gap-2">
                <Layers aria-hidden className="size-4 text-brand-600" />
                <span className="tabular">
                  <strong className="font-semibold text-text-primary">{totalAulas}</strong> aulas
                  publicadas
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 aria-hidden className="size-4 text-success" />
                <span className="tabular">
                  <strong className="font-semibold text-text-primary">{totalConcluidas}</strong>{" "}
                  concluídas por você
                </span>
              </span>
            </div>
          ) : undefined
        }
      />

      {disciplinas.length === 0 ? (
        <EmptyState
          ilustracao="/illustrations/vazio-conteudo.svg"
          titulo="Nenhuma disciplina publicada ainda"
          descricao="As disciplinas são cadastradas pela equipe no painel de conteúdo. Assim que a primeira for publicada, ela aparece aqui."
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {disciplinas.map(({ disciplina, totalAulas: total, concluidas, proxima }) => {
            const visual = visualDaMateria(disciplina.slug || disciplina.name);
            const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

            return (
              <li key={disciplina.id}>
                <Link
                  href={`/disciplinas/${disciplina.slug}`}
                  className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-xs cartao-interativo"
                >
                  {/* Faixa da cor da matéria no topo: é o que torna o cartão
                      reconhecível de relance sem pintar o card inteiro. */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: visual.cor }}
                  />

                  <div className="flex items-start gap-4">
                    <IconTile icone={visual.icone} cor={visual.cor} tamanho="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="t-section text-text-primary">{disciplina.name}</h2>
                      <p className="t-meta tabular mt-0.5">
                        {total} {total === 1 ? "aula" : "aulas"}
                        {concluidas > 0 && ` · ${concluidas} concluídas`}
                      </p>
                    </div>
                    {visual.ilustracao && (
                      <Image
                        src={visual.ilustracao}
                        alt=""
                        aria-hidden
                        width={72}
                        height={54}
                        className="hidden h-auto w-16 shrink-0 opacity-90 sm:block"
                      />
                    )}
                  </div>

                  {disciplina.description && (
                    <p className="mt-4 line-clamp-3 flex-1 text-[0.875rem] leading-relaxed text-text-muted">
                      {disciplina.description}
                    </p>
                  )}

                  {total > 0 ? (
                    <>
                      <div className="mt-5 flex items-center gap-3">
                        <ProgressBar
                          valor={concluidas}
                          total={total}
                          cor={visual.cor}
                          rotulo={`Progresso em ${disciplina.name}`}
                        />
                        <span
                          className="tabular shrink-0 text-[0.875rem] font-semibold"
                          style={{ color: visual.cor }}
                        >
                          {pct}%
                        </span>
                      </div>

                      <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-4 text-[0.8125rem] font-medium text-brand-600">
                        {proxima ? (
                          <>
                            <PlayCircle aria-hidden className="size-4 shrink-0" />
                            <span className="min-w-0 truncate">{proxima.titulo}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
                            <span className="text-success-text">Todas as aulas concluídas</span>
                          </>
                        )}
                        <ArrowRight aria-hidden className="ml-auto size-4 shrink-0" />
                      </p>
                    </>
                  ) : (
                    <p className="mt-5 border-t border-border pt-4 text-[0.8125rem] text-text-muted">
                      Nenhuma aula publicada nesta disciplina ainda.
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
