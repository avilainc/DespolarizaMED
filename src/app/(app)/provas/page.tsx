import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { listarProvas } from "@/features/library/queries";
import { tentativasDoAluno } from "@/features/practice/queries";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Provas — DespolarizaMED" };

export default async function ProvasPage({ searchParams }: { searchParams: Promise<{ banca?: string }> }) {
  const { session } = await requireAssinatura();
  const { banca } = await searchParams;

  const [provas, tentativas] = await Promise.all([listarProvas(), tentativasDoAluno(session.user.id)]);

  // Última tentativa por prova, para mostrar "em andamento" / nota no card.
  const ultimaPorProva = new Map<string, (typeof tentativas)[number]>();
  for (const t of tentativas) if (!ultimaPorProva.has(t.documentId)) ultimaPorProva.set(t.documentId, t);

  const instituicoes = [...new Map(provas.map((p) => [p.instituicaoSlug, p.instituicao])).entries()]
    .filter(([slug]) => slug)
    .sort((a, b) => (a[1] ?? "").localeCompare(b[1] ?? "", "pt-BR"));

  const visiveis = banca ? provas.filter((p) => p.instituicaoSlug === banca) : provas;

  const porInstituicao = new Map<string, typeof provas>();
  for (const p of visiveis) {
    const chave = p.instituicao ?? "Outras";
    const lista = porInstituicao.get(chave) ?? [];
    lista.push(p);
    porInstituicao.set(chave, lista);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Provas antigas</h1>
      <p className="mt-1 text-muted-foreground">
        {provas.length} {provas.length === 1 ? "prova" : "provas"} para resolver como no dia: questão
        por questão, nota e pontos fracos no final.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link
          href="/provas"
          className={`rounded-full border px-2.5 py-1 ${!banca ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
        >
          todas
        </Link>
        {instituicoes.map(([slug, nome]) => (
          <Link
            key={slug}
            href={`/provas?banca=${encodeURIComponent(slug ?? "")}`}
            className={`rounded-full border px-2.5 py-1 ${banca === slug ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
          >
            {nome}
          </Link>
        ))}
      </div>

      {tentativas.length > 0 && !banca && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Suas últimas provas</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tentativas.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link
                  href={t.finishedAt ? `/provas/${t.documentId}/${t.id}/resultado` : `/provas/${t.documentId}/${t.id}`}
                  className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
                >
                  <p className="font-medium text-foreground">
                    {t.instituicao} {t.ano}
                    {t.fase ? ` · ${t.fase}` : ""}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    {t.finishedAt ? (
                      <>
                        <CheckCircle2 className="size-4 text-primary" />
                        {t.acertos}/{t.totalQuestoes} ·{" "}
                        {Math.round((t.acertos / Math.max(1, t.totalQuestoes)) * 100)}%
                      </>
                    ) : (
                      <>
                        <Clock className="size-4" /> em andamento
                      </>
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 space-y-8">
        {[...porInstituicao.entries()].map(([instituicao, lista]) => (
          <section key={instituicao}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{instituicao}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((p) => {
                const ultima = ultimaPorProva.get(p.documentId);
                return (
                  <li key={p.documentId}>
                    <Link
                      href={`/provas/${p.documentId}`}
                      className="block h-full rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-foreground">{p.ano ?? "s/ ano"}</span>
                        {p.fase && <Badge variant="outline">{p.fase}</Badge>}
                        {p.curso && <Badge variant="secondary">{p.curso}</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {p.questoes} questões
                        {p.banca ? ` · banca ${p.banca}` : ""}
                      </p>
                      {ultima && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {ultima.finishedAt
                            ? `última nota: ${Math.round((ultima.acertos / Math.max(1, ultima.totalQuestoes)) * 100)}%`
                            : "em andamento"}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {visiveis.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhuma prova nesse filtro.</p>
        )}
      </div>
    </div>
  );
}
