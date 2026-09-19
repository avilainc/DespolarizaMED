import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterProva } from "@/features/library/queries";
import { obterTentativa } from "@/features/practice/queries";
import { corrigirTentativa } from "@/features/practice/correcao";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/chip";
import { buttonVariants } from "@/components/ui/button";
import { visualDaMateria } from "@/lib/materias";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleHelp,
  ListChecks,
  Target,
  X,
} from "lucide-react";

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
    <div className="mx-auto max-w-4xl">
      <PageHeader
        migalhas={[
          { rotulo: "Provas antigas", href: "/provas" },
          {
            rotulo: `${prova.instituicao ?? "Prova"} ${prova.ano ?? ""}`.trim(),
            href: `/provas/${documentId}`,
          },
          { rotulo: "Resultado" },
        ]}
        titulo={
          <>
            {prova.instituicao} {prova.ano}
            {prova.fase ? <span className="text-text-muted"> · {prova.fase}</span> : null}
          </>
        }
        descricao={`Finalizada em ${tentativa.finishedAt.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}.`}
        acoes={
          <Link href={`/provas/${documentId}`} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft data-icon="inline-start" aria-hidden />
            Refazer esta prova
          </Link>
        }
      />

      {/* A nota em destaque, e não mais um card do mesmo tamanho dos outros
          três: é o número que a pessoa veio ver. */}
      <section className="mb-4 overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="t-eyebrow">Seu desempenho nesta prova</p>
            <p
              className="mt-1 font-display text-[3.25rem] font-bold leading-none tracking-tight tabular"
              style={{ color: corDaNota(percentual) }}
            >
              {percentual}%
            </p>
          </div>
          <p className="tabular text-[0.9375rem] text-text-secondary">
            <strong className="font-semibold text-text-primary">{acertos}</strong> acertos em{" "}
            {total} questões
          </p>
        </div>
        <ProgressBar
          valor={acertos}
          total={total}
          cor={corDaNota(percentual)}
          rotulo="Acertos nesta prova"
          className="mt-4"
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard icone={ListChecks} rotulo="Questões" valor={total} />
        <MetricCard icone={Target} rotulo="Acertos" valor={acertos} tom="positivo" />
        <MetricCard
          icone={X}
          rotulo="Erros"
          valor={erros}
          tom={erros > 0 ? "negativo" : "neutro"}
          apoio={emBranco ? `+${emBranco} em branco` : undefined}
        />
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading icone={CheckCircle2}>Pontos fortes</SectionHeading>
          {fortes.length ? (
            <ul className="space-y-2">
              {fortes.map((t) => (
                <li
                  key={t.nome}
                  className="flex items-center gap-3 rounded-lg border border-success/25 bg-success-soft/50 px-4 py-2.5"
                >
                  <span className="min-w-0 flex-1 text-[0.875rem] text-text-primary">{t.nome}</span>
                  <span className="tabular shrink-0 text-[0.8125rem] font-semibold text-success-text">
                    {t.acertos}/{t.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icone={CheckCircle2}
              tamanho="sm"
              titulo="Nenhum tema com 70% ou mais"
              descricao="Um tema precisa de acerto alto o bastante para ser contado como ponto forte."
            />
          )}
        </section>
        <section>
          <SectionHeading icone={AlertTriangle}>Revisar</SectionHeading>
          {revisar.length ? (
            <ul className="space-y-2">
              {revisar.map((t) => (
                <li
                  key={t.nome}
                  className="flex items-center gap-3 rounded-lg border border-danger/25 bg-danger-soft/50 px-4 py-2.5"
                >
                  <span className="min-w-0 flex-1 text-[0.875rem] text-text-primary">{t.nome}</span>
                  <span className="tabular shrink-0 text-[0.8125rem] font-semibold text-danger-text">
                    {t.acertos}/{t.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icone={CheckCircle2}
              tamanho="sm"
              titulo="Nada abaixo de 50%"
              descricao="Nenhum tema desta prova ficou na faixa de revisão."
            />
          )}
        </section>
      </div>
      <p className="t-meta mt-3">
        Temas classificados automaticamente a partir do enunciado; podem ter erros.
      </p>

      <section className="mt-10">
        <SectionHeading icone={CircleHelp}>Gabarito comentado</SectionHeading>
        <ol className="space-y-4">
          {prova.questoes.map((q, i) => {
            const r = tentativa.respostas.get(q.id);
            const gabarito = q.gabaritoLetra?.toUpperCase();
            return (
              <li
                key={q.id}
                className={[
                  "overflow-hidden rounded-xl border bg-surface shadow-xs",
                  r ? (r.correta ? "border-success/30" : "border-danger/30") : "border-border",
                ].join(" ")}
              >
                <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-subtle/60 px-4 py-2.5">
                  <span className="tabular text-[0.8125rem] font-semibold text-text-primary">
                    Questão {q.numero ?? i + 1}
                  </span>
                  {r ? (
                    r.correta ? (
                      <Tag tom="positivo" icone={Check}>
                        acertou
                      </Tag>
                    ) : (
                      <Tag tom="negativo" icone={X}>
                        errou · marcou {r.letra.toUpperCase()}
                      </Tag>
                    )
                  ) : (
                    <Tag tom="neutro">em branco</Tag>
                  )}
                  {q.disciplinaSugerida && (
                    <Tag
                      tom="materia"
                      cor={visualDaMateria(q.disciplinaSugerida).cor}
                      icone={visualDaMateria(q.disciplinaSugerida).icone}
                    >
                      {q.disciplinaSugerida}
                      {q.temaSugerido ? ` · ${q.temaSugerido}` : ""}
                    </Tag>
                  )}
                  <Link
                    href={`/questoes/${q.id}`}
                    className="ml-auto text-[0.8125rem] font-medium text-brand-600 hover:underline"
                  >
                    Abrir questão →
                  </Link>
                </header>

                <div className="px-4 py-4">
                  <p className="line-clamp-3 whitespace-pre-line text-[0.9375rem] leading-relaxed text-text-primary">
                    {q.enunciado}
                  </p>
                  <ol className="mt-3 space-y-1.5">
                    {q.alternativas.map((a) => {
                      const letra = a.letra.toUpperCase();
                      const certa = letra === gabarito;
                      const marcada = r?.letra.toUpperCase() === letra;
                      return (
                        <li
                          key={letra}
                          className={[
                            "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[0.875rem]",
                            certa
                              ? "border-success/40 bg-success-soft"
                              : marcada
                                ? "border-danger/35 bg-danger-soft"
                                : "border-transparent text-text-muted",
                          ].join(" ")}
                        >
                          <span
                            aria-hidden
                            className={[
                              "inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[0.75rem] font-semibold",
                              certa
                                ? "bg-success text-white"
                                : marcada
                                  ? "bg-danger text-white"
                                  : "bg-surface-subtle text-text-muted",
                            ].join(" ")}
                          >
                            {letra}
                          </span>
                          <span className="flex-1 [overflow-wrap:anywhere]">{a.texto}</span>
                          {certa && (
                            <Check
                              aria-hidden
                              className="mt-0.5 size-4 shrink-0 text-success-text"
                            />
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/** Verde acima de 70%, âmbar entre 50 e 70, vermelho abaixo. */
function corDaNota(pct: number) {
  if (pct >= 70) return "var(--success-text)";
  if (pct >= 50) return "var(--warning-text)";
  return "var(--danger-text)";
}
