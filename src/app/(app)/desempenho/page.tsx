import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileStack, ListChecks, Target, TrendingUp } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { estatisticasDoAluno, tentativasDoAluno } from "@/features/practice/queries";
import { classificarTemas } from "@/features/practice/correcao";
import { SubjectIcon } from "@/components/subject-icon";
import { MetricCard, ProgressBar } from "@/components/metric-card";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationExam } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Desempenho — DespolarizaMED" };

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

  return (
    <PageShell>
      <PageHeader
        titulo="Desempenho"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Desempenho" }]}
        descricao="Tudo que você respondeu no banco de questões e nas provas, por disciplina e por tema."
      />

      {geral.respondidas === 0 ? (
        <EmptyState
          ilustracao={<IllustrationExam />}
          titulo="Ainda não há respostas registradas"
          descricao="Assim que você resolver questões, esta página mostra o aproveitamento por disciplina, os temas que já domina e os que pedem revisão."
          acao={
            <>
              <Button render={<Link href="/questoes" />}>Ir para o banco de questões</Button>
              <Button variant="outline" render={<Link href="/provas" />}>
                Resolver uma prova antiga
              </Button>
            </>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard rotulo="Aproveitamento" valor={`${pctGeral}%`} apoio="de tudo que respondeu" icone={Target} />
            <MetricCard
              rotulo="Respostas"
              valor={geral.respondidas.toLocaleString("pt-BR")}
              apoio={`${geral.distintas.toLocaleString("pt-BR")} questões distintas`}
              icone={ListChecks}
            />
            <MetricCard rotulo="Acertos" valor={geral.acertos.toLocaleString("pt-BR")} icone={CheckCircle2} />
            <MetricCard rotulo="Provas finalizadas" valor={finalizadas.length} icone={FileStack} />
          </div>

          <section className="mt-10">
            <SectionHeading titulo="Últimos 30 dias" icone={TrendingUp} />
            <div className="rounded-xl bg-card p-5 shadow-xs ring-1 ring-foreground/8">
              <div className="flex h-32 items-end gap-[3px]" role="img" aria-label="Questões respondidas por dia nos últimos 30 dias">
                {dias.map((d) => {
                  const altura = (d.respondidas / maxDia) * 100;
                  const alturaAcertos = d.respondidas ? (d.acertos / d.respondidas) * altura : 0;
                  return (
                    <div
                      key={d.dia}
                      className="relative flex-1 rounded-t-sm bg-muted"
                      style={{ height: `${Math.max(altura, 2)}%` }}
                      title={`${formatarDia(d.dia)}: ${d.acertos}/${d.respondidas}`}
                    >
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-t-sm bg-primary"
                        style={{ height: `${d.respondidas ? (alturaAcertos / altura) * 100 : 0}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{formatarDia(dias[0].dia)}</span>
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden /> acertos
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm bg-muted" aria-hidden /> total
                  </span>
                </span>
                <span>{formatarDia(dias[dias.length - 1].dia)}</span>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <SectionHeading titulo="Por disciplina" />
            <ul className="space-y-3">
              {stats.porDisciplina.map((d) => {
                const pct = Math.round((d.acertos / Math.max(1, d.respondidas)) * 100);
                return (
                  <li key={d.disciplina} className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8">
                    <div className="flex items-center gap-3">
                      <SubjectIcon disciplina={d.disciplina} size="sm" />
                      <Link
                        href={`/questoes?disciplina=${encodeURIComponent(d.disciplina ?? "")}`}
                        className="min-w-0 flex-1 truncate font-medium text-foreground hover:underline"
                      >
                        {d.disciplina}
                      </Link>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {d.acertos}/{d.respondidas} ·{" "}
                        <strong className="font-semibold text-foreground tabular-nums">{pct}%</strong>
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      {/* Três faixas de cor, cada uma com a porcentagem escrita
                          ao lado: a cor reforça, não é a única informação. */}
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pct >= 70 ? "bg-emerald-600" : pct >= 50 ? "bg-amber-500" : "bg-destructive",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section>
              <SectionHeading titulo="Pontos fortes" icone={CheckCircle2} />
              {fortes.length ? (
                <ul className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
                  {fortes.map((t, i) => (
                    <li
                      key={`${t.disciplina}-${t.tema}`}
                      className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{t.tema}</span>
                        <span className="block truncate text-xs text-muted-foreground">{t.disciplina}</span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-emerald-700">
                        {t.acertos}/{t.respondidas}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-card px-4 py-5 text-sm text-muted-foreground shadow-xs ring-1 ring-foreground/8">
                  Responda mais 3 questões por tema para um tema aparecer aqui.
                </p>
              )}
            </section>

            <section>
              <SectionHeading titulo="Revisar" icone={AlertTriangle} />
              {revisar.length ? (
                <ul className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
                  {revisar.map((t, i) => (
                    <li key={`${t.disciplina}-${t.tema}`} className={cn(i > 0 && "border-t border-border")}>
                      <Link
                        href={`/questoes?disciplina=${encodeURIComponent(t.disciplina ?? "")}&tema=${encodeURIComponent(t.tema ?? "")}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{t.tema}</span>
                          <span className="block truncate text-xs text-muted-foreground">{t.disciplina}</span>
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-destructive">
                          {t.acertos}/{t.respondidas}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-card px-4 py-5 text-sm text-muted-foreground shadow-xs ring-1 ring-foreground/8">
                  Nenhum tema abaixo de 50%. Continue assim.
                </p>
              )}
            </section>
          </div>

          {finalizadas.length > 0 && (
            <section className="mt-10">
              <SectionHeading titulo="Provas finalizadas" icone={FileStack} />
              <ul className="space-y-3">
                {finalizadas.map((t) => {
                  const pct = Math.round((t.acertos / Math.max(1, t.totalQuestoes)) * 100);
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/provas/${t.documentId}/${t.id}/resultado`}
                        className="block rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {t.instituicao} {t.ano}
                            {t.fase ? ` · ${t.fase}` : ""}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {t.acertos}/{t.totalQuestoes} ·{" "}
                            <strong className="font-semibold text-foreground tabular-nums">{pct}%</strong>
                          </span>
                        </div>
                        <ProgressBar
                          className="mt-3"
                          altura="fina"
                          valor={t.acertos}
                          total={Math.max(1, t.totalQuestoes)}
                          rotuloAcessivel={`${t.acertos} de ${t.totalQuestoes} acertos em ${t.instituicao} ${t.ano}`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}

function formatarDia(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
