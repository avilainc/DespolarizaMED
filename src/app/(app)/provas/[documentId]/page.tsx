import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, History, Info, ListChecks } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterProva } from "@/features/library/queries";
import { tentativaEmAberto, tentativasDoAluno } from "@/features/practice/queries";
import { visualDaMateria } from "@/lib/materias";
import { StartAttemptButton } from "@/features/practice/components/start-attempt-button";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/metric-card";
import { Tag } from "@/components/ui/chip";

export const metadata: Metadata = { title: "Prova — DespolarizaMED" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProvaPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { session } = await requireAssinatura();
  const { documentId } = await params;
  if (!UUID.test(documentId)) notFound();

  const prova = await obterProva(documentId);
  if (!prova || !prova.questoes.length) notFound();

  const [aberta, historico] = await Promise.all([
    tentativaEmAberto(session.user.id, documentId),
    tentativasDoAluno(session.user.id),
  ]);
  const anteriores = historico.filter((t) => t.documentId === documentId && t.finishedAt);

  const disciplinas = new Map<string, number>();
  for (const q of prova.questoes) {
    const d = q.disciplinaSugerida ?? "Sem classificação";
    disciplinas.set(d, (disciplinas.get(d) ?? 0) + 1);
  }
  const porDisciplina = [...disciplinas.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        migalhas={[
          { rotulo: "Provas antigas", href: "/provas" },
          { rotulo: `${prova.instituicao ?? "Prova"} ${prova.ano ?? ""}`.trim() },
        ]}
        titulo={
          <>
            {prova.instituicao} {prova.ano}
          </>
        }
        aside={
          <div className="flex flex-wrap gap-2">
            {prova.fase && <Tag tom="neutro">{prova.fase}</Tag>}
            {prova.curso && <Tag tom="marca">{prova.curso}</Tag>}
            {prova.banca && <Tag tom="neutro">banca {prova.banca}</Tag>}
          </div>
        }
      />

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-gradient-to-br from-brand-50 to-surface px-6 py-6">
          <p className="t-eyebrow">Como funciona</p>
          <p className="mt-2 text-[1.0625rem] leading-relaxed text-text-secondary">
            <strong className="font-semibold text-text-primary">
              {prova.questoes.length} questões
            </strong>{" "}
            objetivas com gabarito conferido contra o caderno oficial. Você pode sair e voltar — as
            respostas ficam salvas até você finalizar.
          </p>
          <div className="mt-5">
            <StartAttemptButton documentId={documentId} retomar={Boolean(aberta)} />
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="t-eyebrow mb-3 flex items-center gap-1.5">
            <ListChecks aria-hidden className="size-3.5" />
            Composição da prova
          </p>
          <ul className="space-y-2.5">
            {porDisciplina.map(([d, n]) => {
              const visual = visualDaMateria(d);
              return (
                <li key={d} className="flex items-center gap-3">
                  <visual.icone
                    aria-hidden
                    className="size-4 shrink-0"
                    style={{ color: visual.cor }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[0.875rem] text-text-secondary">
                    {d}
                  </span>
                  <ProgressBar
                    valor={n}
                    total={prova.questoes.length}
                    cor={visual.cor}
                    tamanho="sm"
                    rotulo={`${n} de ${prova.questoes.length} questões de ${d}`}
                    className="max-w-40"
                  />
                  <span className="tabular w-14 shrink-0 text-right text-[0.8125rem] text-text-muted">
                    {n} {n === 1 ? "questão" : "questões"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="t-meta mt-4 flex items-start gap-2 border-t border-border pt-4">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            A disciplina de cada questão é sugerida automaticamente pelo pipeline de extração e
            ainda não passou por revisão humana.
          </p>
        </div>
      </section>

      {anteriores.length > 0 && (
        <section className="mt-8">
          <SectionHeading icone={History}>Tentativas anteriores</SectionHeading>
          <ul className="space-y-2">
            {anteriores.map((t) => {
              const pct = Math.round((t.acertos / Math.max(1, t.totalQuestoes)) * 100);
              return (
                <li key={t.id}>
                  <Link
                    href={`/provas/${documentId}/${t.id}/resultado`}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xs cartao-interativo"
                  >
                    <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
                    <span className="tabular min-w-0 flex-1 text-[0.875rem] text-text-secondary">
                      {t.finishedAt?.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <ProgressBar
                      valor={t.acertos}
                      total={t.totalQuestoes}
                      cor={
                        pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)"
                      }
                      tamanho="sm"
                      rotulo={`Nota da tentativa de ${t.finishedAt?.toLocaleDateString("pt-BR")}`}
                      className="max-w-32"
                    />
                    <span className="tabular shrink-0 text-[0.875rem] font-semibold text-text-primary">
                      {t.acertos}/{t.totalQuestoes} · {pct}%
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
