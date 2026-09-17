import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterProva } from "@/features/library/queries";
import { obterTentativa } from "@/features/practice/queries";
import { corrigirTentativa } from "@/features/practice/correcao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, X } from "lucide-react";

export const metadata: Metadata = { title: "Resultado — DespolarizaMED" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ documentId: string; attemptId: string }>;
}) {
  const { session } = await requireAssinatura();
  const { documentId, attemptId } = await params;
  if (!UUID.test(documentId) || !UUID.test(attemptId)) notFound();

  const tentativa = await obterTentativa(attemptId, session.user.id);
  if (!tentativa || tentativa.documentId !== documentId) notFound();
  if (!tentativa.finishedAt) redirect(`/provas/${documentId}/${attemptId}`);

  const prova = await obterProva(documentId);
  if (!prova) notFound();

  const correcao = corrigirTentativa(prova.questoes, tentativa.respostas);
  const { total, erros, emBranco, percentual, fortes, revisar } = correcao;
  // A nota persistida na finalização é a fonte oficial; a correção recalculada
  // aqui é para o diagnóstico por tema e precisa bater com ela.
  const acertos = tentativa.acertos;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/provas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Provas
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-foreground">
        {prova.instituicao} {prova.ano}
        {prova.fase ? ` · ${prova.fase}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Finalizada em{" "}
        {tentativa.finishedAt.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card className="sm:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Desempenho</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold text-foreground">{percentual}%</CardContent>
        </Card>
        <Stat rotulo="Questões" valor={total} />
        <Stat rotulo="Acertos" valor={acertos} classe="text-primary" />
        <Stat rotulo="Erros" valor={erros} classe="text-destructive" sufixo={emBranco ? `+${emBranco} em branco` : undefined} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" /> Pontos fortes
          </h2>
          {fortes.length ? (
            <ul className="space-y-1.5 text-sm">
              {fortes.map((t) => (
                <li key={t.nome} className="flex justify-between rounded-md border border-border bg-card px-3 py-2">
                  <span className="text-foreground">{t.nome}</span>
                  <span className="text-muted-foreground">
                    {t.acertos}/{t.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum tema com 70% ou mais ainda.</p>
          )}
        </section>
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <AlertTriangle className="size-4 text-destructive" /> Revisar
          </h2>
          {revisar.length ? (
            <ul className="space-y-1.5 text-sm">
              {revisar.map((t) => (
                <li key={t.nome} className="flex justify-between rounded-md border border-border bg-card px-3 py-2">
                  <span className="text-foreground">{t.nome}</span>
                  <span className="text-muted-foreground">
                    {t.acertos}/{t.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nada abaixo de 50%. Ótimo.</p>
          )}
        </section>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Temas classificados automaticamente a partir do enunciado; podem ter erros.
      </p>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Gabarito comentado</h2>
        <ol className="space-y-4">
          {prova.questoes.map((q, i) => {
            const r = tentativa.respostas.get(q.id);
            const gabarito = q.gabaritoLetra?.toUpperCase();
            return (
              <li key={q.id} className="rounded-lg border border-border bg-card p-4">
                <header className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">Questão {q.numero ?? i + 1}</span>
                  {r ? (
                    r.correta ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Check className="size-3.5" /> acertou
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <X className="size-3.5" /> errou (marcou {r.letra.toUpperCase()})
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">em branco</span>
                  )}
                  <span className="ml-auto text-muted-foreground">
                    {q.disciplinaSugerida}
                    {q.temaSugerido ? ` · ${q.temaSugerido}` : ""}
                  </span>
                </header>
                <p className="line-clamp-3 whitespace-pre-line text-sm text-foreground">{q.enunciado}</p>
                <ol className="mt-3 space-y-1">
                  {q.alternativas.map((a) => {
                    const letra = a.letra.toUpperCase();
                    const certa = letra === gabarito;
                    const marcada = r?.letra.toUpperCase() === letra;
                    return (
                      <li
                        key={letra}
                        className={[
                          "flex gap-2 rounded-md border px-3 py-1.5 text-sm",
                          certa
                            ? "border-primary bg-primary/10"
                            : marcada
                              ? "border-destructive/50 bg-destructive/5"
                              : "border-transparent text-muted-foreground",
                        ].join(" ")}
                      >
                        <span className="font-semibold">{letra})</span>
                        <span className="flex-1">{a.texto}</span>
                      </li>
                    );
                  })}
                </ol>
                <Link href={`/questoes/${q.id}`} className="mt-2 inline-block text-xs text-primary hover:underline">
                  Abrir questão →
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Stat({ rotulo, valor, classe, sufixo }: { rotulo: string; valor: number; classe?: string; sufixo?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{rotulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${classe ?? "text-foreground"}`}>{valor}</div>
        {sufixo && <p className="mt-1 text-xs text-muted-foreground">{sufixo}</p>}
      </CardContent>
    </Card>
  );
}
