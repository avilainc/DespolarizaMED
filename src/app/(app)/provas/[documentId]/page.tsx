import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterProva } from "@/features/library/queries";
import { tentativaEmAberto, tentativasDoAluno } from "@/features/practice/queries";
import { StartAttemptButton } from "@/features/practice/components/start-attempt-button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

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
      </h1>
      <div className="mt-2 flex flex-wrap gap-2">
        {prova.fase && <Badge variant="outline">{prova.fase}</Badge>}
        {prova.curso && <Badge variant="secondary">{prova.curso}</Badge>}
        {prova.banca && <Badge variant="secondary">banca {prova.banca}</Badge>}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{prova.questoes.length} questões</strong> objetivas com
          gabarito conferido. Você pode sair e voltar: as respostas ficam salvas até finalizar.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          {[...disciplinas.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([d, n]) => (
              <li key={d} className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                {d}: {n}
              </li>
            ))}
        </ul>
        <div className="mt-5">
          <StartAttemptButton documentId={documentId} retomar={Boolean(aberta)} />
        </div>
      </div>

      {anteriores.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Tentativas anteriores</h2>
          <ul className="space-y-2">
            {anteriores.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/provas/${documentId}/${t.id}/resultado`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary"
                >
                  <span className="text-muted-foreground">
                    {t.finishedAt?.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <span className="font-medium text-foreground">
                    {t.acertos}/{t.totalQuestoes} · {Math.round((t.acertos / Math.max(1, t.totalQuestoes)) * 100)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
