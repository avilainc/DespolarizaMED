import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { estatisticasDoAluno, tentativasDoAluno } from "@/features/practice/queries";
import { classificarTemas } from "@/features/practice/correcao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Desempenho</h1>
      <p className="mt-1 text-muted-foreground">
        Tudo que você respondeu no banco de questões e nas provas, por disciplina e tema.
      </p>

      {geral.respondidas === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Ainda não há respostas registradas. Comece pelo{" "}
            <Link href="/questoes" className="text-primary hover:underline">
              banco de questões
            </Link>{" "}
            ou por uma{" "}
            <Link href="/provas" className="text-primary hover:underline">
              prova antiga
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <Stat rotulo="Aproveitamento" valor={`${pctGeral}%`} />
            <Stat rotulo="Respostas" valor={geral.respondidas.toLocaleString("pt-BR")} sufixo={`${geral.distintas} questões distintas`} />
            <Stat rotulo="Acertos" valor={geral.acertos.toLocaleString("pt-BR")} />
            <Stat rotulo="Provas finalizadas" valor={String(finalizadas.length)} />
          </div>

          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Últimos 30 dias</h2>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex h-28 items-end gap-[3px]" role="img" aria-label="Questões respondidas por dia">
                {dias.map((d) => {
                  const altura = (d.respondidas / maxDia) * 100;
                  const alturaAcertos = d.respondidas ? (d.acertos / d.respondidas) * altura : 0;
                  return (
                    <div
                      key={d.dia}
                      className="relative flex-1 rounded-sm bg-muted"
                      style={{ height: `${Math.max(altura, 2)}%` }}
                      title={`${formatarDia(d.dia)}: ${d.acertos}/${d.respondidas}`}
                    >
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-sm bg-primary"
                        style={{ height: `${d.respondidas ? (alturaAcertos / altura) * 100 : 0}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{formatarDia(dias[0].dia)}</span>
                <span>
                  <span className="mr-3 inline-block size-2.5 rounded-sm bg-primary align-middle" /> acertos
                  <span className="ml-3 mr-1 inline-block size-2.5 rounded-sm bg-muted align-middle" /> total
                </span>
                <span>{formatarDia(dias[dias.length - 1].dia)}</span>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Por disciplina</h2>
            <ul className="space-y-2">
              {stats.porDisciplina.map((d) => {
                const pct = Math.round((d.acertos / Math.max(1, d.respondidas)) * 100);
                return (
                  <li key={d.disciplina} className="rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <Link href={`/questoes?disciplina=${encodeURIComponent(d.disciplina ?? "")}`} className="font-medium text-foreground hover:underline">
                        {d.disciplina}
                      </Link>
                      <span className="text-muted-foreground">
                        {d.acertos}/{d.respondidas} · <strong className="text-foreground">{pct}%</strong>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${pct >= 70 ? "bg-primary" : pct >= 50 ? "bg-amber-500" : "bg-destructive"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" /> Pontos fortes
              </h2>
              {fortes.length ? (
                <ul className="space-y-1.5 text-sm">
                  {fortes.map((t) => (
                    <li key={`${t.disciplina}-${t.tema}`} className="flex justify-between rounded-md border border-border bg-card px-3 py-2">
                      <span className="text-foreground">
                        {t.tema} <span className="text-xs text-muted-foreground">· {t.disciplina}</span>
                      </span>
                      <span className="text-muted-foreground">{t.acertos}/{t.respondidas}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Responda mais 3 questões por tema para aparecer aqui.</p>
              )}
            </section>
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <AlertTriangle className="size-4 text-destructive" /> Revisar
              </h2>
              {revisar.length ? (
                <ul className="space-y-1.5 text-sm">
                  {revisar.map((t) => (
                    <li key={`${t.disciplina}-${t.tema}`} className="flex justify-between rounded-md border border-border bg-card px-3 py-2">
                      <Link
                        href={`/questoes?disciplina=${encodeURIComponent(t.disciplina ?? "")}&tema=${encodeURIComponent(t.tema ?? "")}`}
                        className="text-foreground hover:underline"
                      >
                        {t.tema} <span className="text-xs text-muted-foreground">· {t.disciplina}</span>
                      </Link>
                      <span className="text-muted-foreground">{t.acertos}/{t.respondidas}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum tema abaixo de 50%.</p>
              )}
            </section>
          </div>

          {finalizadas.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Provas</h2>
              <ul className="space-y-2">
                {finalizadas.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/provas/${t.documentId}/${t.id}/resultado`}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary"
                    >
                      <span className="text-foreground">
                        {t.instituicao} {t.ano}
                        {t.fase ? ` · ${t.fase}` : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {t.acertos}/{t.totalQuestoes} ·{" "}
                        <strong className="text-foreground">
                          {Math.round((t.acertos / Math.max(1, t.totalQuestoes)) * 100)}%
                        </strong>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function formatarDia(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function Stat({ rotulo, valor, sufixo }: { rotulo: string; valor: string; sufixo?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{rotulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{valor}</div>
        {sufixo && <p className="mt-1 text-xs text-muted-foreground">{sufixo}</p>}
      </CardContent>
    </Card>
  );
}
