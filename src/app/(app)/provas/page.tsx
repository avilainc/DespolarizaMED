import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileText } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { listarProvas } from "@/features/library/queries";
import { tentativasDoAluno } from "@/features/practice/queries";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, Tag } from "@/components/ui/chip";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Provas antigas — DespolarizaMED" };

/**
 * Monograma da instituição.
 *
 * Não há logotipo institucional nos assets, e baixar um em runtime está fora
 * de questão (marca de terceiro, requisição externa e LCP). O monograma nas
 * cores da marca identifica a prova de relance e é honesto sobre o que é.
 */
function Monograma({ nome }: { nome: string }) {
  const sigla = nome
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 4)
    .toLocaleUpperCase("pt-BR");

  return (
    <span
      aria-hidden
      className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg bg-brand-800 px-2 font-display text-[0.8125rem] font-bold tracking-tight text-white"
    >
      {sigla}
    </span>
  );
}

export default async function ProvasPage({
  searchParams,
}: {
  searchParams: Promise<{ banca?: string }>;
}) {
  const { session } = await requireAssinatura();
  const { banca } = await searchParams;

  const [provas, tentativas] = await Promise.all([
    listarProvas(),
    tentativasDoAluno(session.user.id),
  ]);

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

  const emAndamento = tentativas.filter((t) => !t.finishedAt);

  return (
    <>
      <PageHeader
        titulo="Provas antigas"
        descricao={
          provas.length > 0
            ? "Resolva como no dia da prova: questão por questão, com nota e pontos fracos no final. Você pode sair e voltar — as respostas ficam salvas até finalizar."
            : "Aqui ficam as provas completas para resolver do começo ao fim."
        }
        aside={
          instituicoes.length > 0 ? (
            <nav aria-label="Filtrar por instituição" className="flex flex-wrap gap-2">
              <FilterChip href="/provas" ativo={!banca}>
                Todas as instituições
              </FilterChip>
              {instituicoes.map(([slug, nome]) => (
                <FilterChip
                  key={slug}
                  href={`/provas?banca=${encodeURIComponent(slug ?? "")}`}
                  ativo={banca === slug}
                  contagem={provas.filter((p) => p.instituicaoSlug === slug).length}
                >
                  {nome}
                </FilterChip>
              ))}
            </nav>
          ) : undefined
        }
      />

      {/* Provas em andamento primeiro: é a única coisa nesta tela que tem
          urgência — uma prova aberta pela metade. */}
      {emAndamento.length > 0 && !banca && (
        <section className="mb-9">
          <SectionHeading icone={Clock}>Continue de onde parou</SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {emAndamento.slice(0, 3).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/provas/${t.documentId}/${t.id}`}
                  className="flex h-full items-center gap-4 rounded-xl border border-brand-200 bg-brand-50/60 cartao-p-sm cartao-interativo"
                >
                  <Monograma nome={t.instituicao ?? "Prova"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] font-semibold text-text-primary">
                      {t.instituicao} {t.ano}
                      {t.fase ? ` · ${t.fase}` : ""}
                    </span>
                    <span className="t-meta">prova em andamento</span>
                  </span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-brand-600" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visiveis.length === 0 ? (
        <EmptyState
          ilustracao="/illustrations/vazio-conteudo.svg"
          titulo={banca ? "Nenhuma prova desta instituição" : "Nenhuma prova disponível ainda"}
          descricao={
            banca
              ? "Essa instituição ainda não tem prova com questões suficientes para montar um simulado completo."
              : "As provas entram no acervo depois que as questões são extraídas e o gabarito é conferido."
          }
          acao={
            banca ? (
              <Link href="/provas" className={buttonVariants()}>
                Ver todas as provas
              </Link>
            ) : (
              <Link href="/questoes" className={buttonVariants()}>
                Ir para o banco de questões
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-9">
          {[...porInstituicao.entries()].map(([instituicao, lista]) => (
            <section key={instituicao}>
              <SectionHeading icone={FileText} descricao={`${lista.length} ${lista.length === 1 ? "prova" : "provas"} no acervo`}>
                {instituicao}
              </SectionHeading>

              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((p) => {
                  const ultima = ultimaPorProva.get(p.documentId);
                  const finalizada = ultima?.finishedAt ? ultima : null;
                  const pct = finalizada
                    ? Math.round((finalizada.acertos / Math.max(1, finalizada.totalQuestoes)) * 100)
                    : null;

                  return (
                    <li key={p.documentId}>
                      <Link
                        href={`/provas/${p.documentId}`}
                        className="flex h-full flex-col cartao cartao-p-md cartao-interativo"
                      >
                        <div className="flex items-start gap-3">
                          <Monograma nome={p.instituicao ?? "Prova"} />
                          <div className="min-w-0 flex-1">
                            <p className="t-card-title text-text-primary">
                              {p.instituicao} {p.ano ?? ""}
                            </p>
                            <p className="t-meta tabular">
                              {p.questoes} questões
                              {p.banca ? ` · banca ${p.banca}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.fase && <Tag tom="neutro">{p.fase}</Tag>}
                          {p.curso && <Tag tom="marca">{p.curso}</Tag>}
                        </div>

                        <div className="mt-auto pt-5">
                          {finalizada && pct !== null ? (
                            <>
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="t-eyebrow">Sua última nota</span>
                                <span className="tabular text-[0.875rem] font-semibold text-text-primary">
                                  {finalizada.acertos}/{finalizada.totalQuestoes} · {pct}%
                                </span>
                              </div>
                              <ProgressBar
                                valor={finalizada.acertos}
                                total={finalizada.totalQuestoes}
                                cor={
                                  pct >= 70
                                    ? "var(--success)"
                                    : pct >= 50
                                      ? "var(--warning)"
                                      : "var(--danger)"
                                }
                                rotulo={`Nota em ${p.instituicao} ${p.ano}`}
                                className="mt-2"
                              />
                              <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[0.8125rem] font-medium text-brand-600">
                                <CheckCircle2 aria-hidden className="size-4 shrink-0" />
                                Refazer prova
                                <ArrowRight aria-hidden className="ml-auto size-4 shrink-0" />
                              </p>
                            </>
                          ) : (
                            <p className="flex items-center gap-1.5 border-t border-border pt-3 text-[0.8125rem] font-medium text-brand-600">
                              {ultima ? "Continuar prova" : "Começar prova"}
                              <ArrowRight aria-hidden className="ml-auto size-4 shrink-0" />
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
