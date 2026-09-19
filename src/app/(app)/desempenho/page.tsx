import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Target, TrendingUp } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { estatisticasDoAluno, tentativasDoAluno } from "@/features/practice/queries";
import { classificarTemas } from "@/features/practice/correcao";
import { visualDaMateria } from "@/lib/materias";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Desempenho — DespolarizaMED" };

/** Verde acima de 70%, âmbar entre 50 e 70, vermelho abaixo. */
function corDaTaxa(pct: number) {
  if (pct >= 70) return "var(--success)";
  if (pct >= 50) return "var(--warning)";
  return "var(--danger)";
}

export default async function DesempenhoPage() {
  const { session } = await requireAssinatura();
  const [stats, tentativas] = await Promise.all([
    estatisticasDoAluno(session.user.id),
    tentativasDoAluno(session.user.id),
  ]);

  const { geral } = stats;
  const pctGeral = geral.respondidas ? Math.round((geral.acertos / geral.respondidas) * 100) : null;
  const finalizadas = tentativas.filter((t) => t.finishedAt);

  const temas = stats.porTema.map((t) => ({
    nome: `${t.tema}|${t.disciplina}`,
    tema: t.tema,
    disciplina: t.disciplina,
    total: t.respondidas,
    respondidas: t.respondidas,
    acertos: t.acertos,
    pct: t.acertos / Math.max(1, t.respondidas),
  }));
  const classificado = classificarTemas(temas);
  const fortes = classificado.fortes.slice(0, 6) as typeof temas;
  const revisar = classificado.revisar.slice(0, 6) as typeof temas;

  // Série diária dos últimos 30 dias, preenchendo os dias sem atividade com 0
  // para a barra não "pular" datas.
  const porDia = new Map(stats.ultimos30Dias.map((d) => [d.dia, d]));
  const dias: { dia: string; respondidas: number; acertos: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    const chave = data.toISOString().slice(0, 10);
    dias.push(porDia.get(chave) ?? { dia: chave, respondidas: 0, acertos: 0 });
  }
  const maxDia = Math.max(1, ...dias.map((d) => d.respondidas));

  if (geral.respondidas === 0) {
    return (
      <>
        <PageHeader
          titulo="Desempenho"
          descricao="Seu aproveitamento por disciplina e por tema, contado a partir do que você responde no banco de questões e nas provas."
        />
        <EmptyState
          ilustracao="/illustrations/vazio-desempenho.svg"
          titulo="Ainda não há respostas registradas"
          descricao="Assim que você responder a primeira questão, esta página passa a mostrar seu aproveitamento, os temas que já domina e os que precisam de revisão."
          acao={
            <>
              <Link href="/questoes" className={buttonVariants({ variant: "brand" })}>
                Ir para o banco de questões
              </Link>
              <Link href="/provas" className={buttonVariants({ variant: "outline" })}>
                Resolver uma prova antiga
              </Link>
            </>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Desempenho"
        descricao="Tudo que você respondeu no banco de questões e nas provas, por disciplina e por tema."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icone={Target}
          rotulo="Aproveitamento geral"
          valor={`${pctGeral}%`}
          apoio={`${geral.acertos} acertos em ${geral.respondidas} respostas`}
          tom={pctGeral! >= 70 ? "positivo" : pctGeral! >= 50 ? "atencao" : "negativo"}
        />
        <MetricCard
          icone={TrendingUp}
          rotulo="Respostas"
          valor={geral.respondidas.toLocaleString("pt-BR")}
          apoio={`${geral.distintas} questões distintas`}
        />
        <MetricCard
          icone={CheckCircle2}
          rotulo="Acertos"
          valor={geral.acertos.toLocaleString("pt-BR")}
        />
        <MetricCard
          icone={FileText}
          rotulo="Provas finalizadas"
          valor={finalizadas.length}
          href="/provas"
        />
      </div>

      <section className="mt-9">
        <SectionHeading icone={TrendingUp} descricao="Cada barra é um dia; a parte cheia são os acertos.">
          Últimos 30 dias
        </SectionHeading>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div
            className="flex h-32 items-end gap-[3px]"
            role="img"
            aria-label={`Questões respondidas por dia nos últimos 30 dias. Total: ${geral.respondidas}.`}
          >
            {dias.map((d) => {
              const altura = (d.respondidas / maxDia) * 100;
              return (
                <div
                  key={d.dia}
                  className="relative flex-1 rounded-sm bg-surface-subtle"
                  style={{ height: `${Math.max(altura, 3)}%` }}
                  title={`${formatarDia(d.dia)}: ${d.acertos}/${d.respondidas}`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-sm bg-brand-500"
                    style={{
                      height: d.respondidas ? `${(d.acertos / d.respondidas) * 100}%` : "0%",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[0.75rem] text-text-muted">
            <span className="tabular">{formatarDia(dias[0].dia)}</span>
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-2.5 rounded-sm bg-brand-500" />
                acertos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-2.5 rounded-sm bg-surface-subtle" />
                total respondido
              </span>
            </span>
            <span className="tabular">{formatarDia(dias[dias.length - 1].dia)}</span>
          </div>
        </div>
      </section>

      <section className="mt-9">
        <SectionHeading icone={Target}>Por disciplina</SectionHeading>
        <ul className="grid gap-3 lg:grid-cols-2">
          {stats.porDisciplina.map((d) => {
            const pct = Math.round((d.acertos / Math.max(1, d.respondidas)) * 100);
            const visual = visualDaMateria(d.disciplina);
            return (
              <li
                key={d.disciplina}
                className="rounded-xl border border-border bg-surface p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <visual.icone
                    aria-hidden
                    className="size-[1.125rem] shrink-0"
                    style={{ color: visual.cor }}
                  />
                  <Link
                    href={`/questoes?disciplina=${encodeURIComponent(d.disciplina ?? "")}`}
                    className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-text-primary hover:underline"
                  >
                    {d.disciplina}
                  </Link>
                  <span className="tabular shrink-0 text-[0.875rem] text-text-muted">
                    {d.acertos}/{d.respondidas} ·{" "}
                    <strong className="font-semibold text-text-primary">{pct}%</strong>
                  </span>
                </div>
                <ProgressBar
                  valor={d.acertos}
                  total={Math.max(1, d.respondidas)}
                  cor={corDaTaxa(pct)}
                  rotulo={`Aproveitamento em ${d.disciplina}`}
                  className="mt-3"
                />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-9 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading icone={CheckCircle2}>Pontos fortes</SectionHeading>
          {fortes.length ? (
            <ul className="space-y-2">
              {fortes.map((t) => (
                <li
                  key={`${t.disciplina}-${t.tema}`}
                  className="flex items-center gap-3 rounded-lg border border-success/25 bg-success-soft/50 px-4 py-2.5"
                >
                  <span className="min-w-0 flex-1 text-[0.875rem] text-text-primary">
                    {t.tema} <span className="t-meta">· {t.disciplina}</span>
                  </span>
                  <span className="tabular shrink-0 text-[0.8125rem] font-semibold text-success-text">
                    {t.acertos}/{t.respondidas}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icone={CheckCircle2}
              tamanho="sm"
              titulo="Nada aqui ainda"
              descricao="Responda pelo menos 3 questões de um mesmo tema para ele ser classificado."
            />
          )}
        </section>

        <section>
          <SectionHeading icone={AlertTriangle}>Revisar</SectionHeading>
          {revisar.length ? (
            <ul className="space-y-2">
              {revisar.map((t) => (
                <li key={`${t.disciplina}-${t.tema}`}>
                  <Link
                    href={`/questoes?disciplina=${encodeURIComponent(t.disciplina ?? "")}&tema=${encodeURIComponent(t.tema ?? "")}`}
                    className="flex items-center gap-3 rounded-lg border border-danger/25 bg-danger-soft/50 px-4 py-2.5 transition-colors hover:border-danger/40"
                  >
                    <span className="min-w-0 flex-1 text-[0.875rem] text-text-primary">
                      {t.tema} <span className="t-meta">· {t.disciplina}</span>
                    </span>
                    <span className="tabular shrink-0 text-[0.8125rem] font-semibold text-danger-text">
                      {t.acertos}/{t.respondidas}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icone={CheckCircle2}
              tamanho="sm"
              titulo="Nenhum tema abaixo de 50%"
              descricao="Nada pendente de revisão no momento. Continue respondendo para manter a medida atualizada."
            />
          )}
        </section>
      </div>

      {finalizadas.length > 0 && (
        <section className="mt-9">
          <SectionHeading icone={FileText}>Provas finalizadas</SectionHeading>
          <ul className="grid gap-3 lg:grid-cols-2">
            {finalizadas.map((t) => {
              const pct = Math.round((t.acertos / Math.max(1, t.totalQuestoes)) * 100);
              return (
                <li key={t.id}>
                  <Link
                    href={`/provas/${t.documentId}/${t.id}/resultado`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xs cartao-interativo"
                  >
                    <span className="min-w-0 flex-1 text-[0.9375rem] text-text-primary">
                      {t.instituicao} {t.ano}
                      {t.fase ? ` · ${t.fase}` : ""}
                    </span>
                    <span className="tabular shrink-0 text-[0.875rem] text-text-muted">
                      {t.acertos}/{t.totalQuestoes} ·{" "}
                      <strong className="font-semibold" style={{ color: corDaTaxa(pct) }}>
                        {pct}%
                      </strong>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function formatarDia(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
