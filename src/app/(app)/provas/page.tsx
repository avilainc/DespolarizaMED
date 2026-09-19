import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileStack } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { listarProvas } from "@/features/library/queries";
import { tentativasDoAluno } from "@/features/practice/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/metric-card";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationExam } from "@/components/illustrations";
import { cn } from "@/lib/utils";

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

  const emAndamento = tentativas.filter((t) => !t.finishedAt);

  return (
    <PageShell largura="larga">
      <PageHeader
        titulo="Provas antigas"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Provas antigas" }]}
        descricao={
          <>
            {provas.length} {provas.length === 1 ? "prova" : "provas"} para resolver como no dia: questão por
            questão, com nota e pontos fracos no final.
          </>
        }
      />

      {instituicoes.length > 0 && (
        <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          <div className="flex w-max items-center gap-2">
            <Link
              href="/provas"
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                !banca
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              Todas
            </Link>
            {instituicoes.map(([slug, nome]) => (
              <Link
                key={slug}
                href={`/provas?banca=${encodeURIComponent(slug ?? "")}`}
                aria-current={banca === slug ? "true" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm font-medium transition-colors",
                  banca === slug
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <Monograma nome={slug ?? ""} tamanho="sm" />
                {nome}
              </Link>
            ))}
          </div>
        </div>
      )}

      {emAndamento.length > 0 && !banca && (
        <section className="mb-10">
          <SectionHeading titulo="Continuar de onde parou" icone={Clock} />
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {emAndamento.slice(0, 3).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/provas/${t.documentId}/${t.id}`}
                  className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-xs ring-1 ring-primary/30 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
                >
                  <Monograma nome={t.instituicao ?? "?"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {t.instituicao} {t.ano}
                      {t.fase ? ` · ${t.fase}` : ""}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">Prova em andamento</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visiveis.length === 0 ? (
        <EmptyState
          ilustracao={<IllustrationExam />}
          titulo="Nenhuma prova neste filtro"
          descricao="Tente outra banca, ou veja a lista completa das provas já disponíveis."
          acao={
            <Button variant="outline" render={<Link href="/provas" />}>
              Ver todas as provas
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {[...porInstituicao.entries()].map(([instituicao, lista]) => (
            <section key={instituicao}>
              <SectionHeading titulo={instituicao} icone={FileStack} />
              <ul className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((p) => {
                  const ultima = ultimaPorProva.get(p.documentId);
                  return (
                    <li key={p.documentId} className="h-full">
                      <Link
                        href={`/provas/${p.documentId}`}
                        className="group flex h-full flex-col rounded-xl bg-card p-5 shadow-xs ring-1 ring-foreground/8 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
                      >
                        {/* Monograma no lugar do logo: os logos das bancas não
                            estão nos assets do projeto e buscar imagem externa
                            em runtime está fora de questão, então a sigla vira
                            a marca do card. */}
                        <Monograma nome={p.instituicaoSlug ?? instituicao} />

                        <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                          {(p.instituicao ?? instituicao)} {p.ano ?? ""}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {p.fase && <Badge variant="outline">{p.fase}</Badge>}
                          {p.curso && <Badge variant="secondary">{p.curso}</Badge>}
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {p.questoes} {p.questoes === 1 ? "questão" : "questões"}
                          {p.banca ? ` · banca ${p.banca}` : ""}
                        </p>

                        <div className="mt-auto pt-4">
                          {ultima ? (
                            <>
                              <div className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="flex items-center gap-1.5 font-medium text-foreground">
                                  {ultima.finishedAt ? (
                                    <>
                                      <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />
                                      {ultima.acertos} de {ultima.totalQuestoes} acertos
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="size-3.5 text-primary" aria-hidden />
                                      Em andamento
                                    </>
                                  )}
                                </span>
                                {ultima.finishedAt && (
                                  <span className="text-muted-foreground">
                                    {Math.round((ultima.acertos / Math.max(1, ultima.totalQuestoes)) * 100)}%
                                  </span>
                                )}
                              </div>
                              {ultima.finishedAt && (
                                <ProgressBar
                                  className="mt-2"
                                  altura="fina"
                                  valor={ultima.acertos}
                                  total={Math.max(1, ultima.totalQuestoes)}
                                  rotuloAcessivel={`${ultima.acertos} de ${ultima.totalQuestoes} acertos`}
                                />
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">Você ainda não resolveu esta prova</p>
                          )}

                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                            {ultima?.finishedAt ? "Ver resultado" : ultima ? "Continuar prova" : "Começar prova"}
                            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                          </span>
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
    </PageShell>
  );
}

/**
 * Sigla da instituição num quadrado, como marca do card de prova.
 *
 * Substitui o logo que não existe: usar até quatro letras mantém "FUVEST" e
 * "UNESP" legíveis e evita que "Universidade Estadual de Campinas" vire uma
 * mancha de texto miúdo.
 */
function Monograma({ nome, tamanho = "default" }: { nome: string; tamanho?: "default" | "sm" }) {
  const sigla = nome
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 4)
    .toUpperCase();
  const texto = sigla.length > 1 ? sigla : nome.slice(0, 4).toUpperCase();

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading font-bold tracking-tight text-primary",
        tamanho === "sm" ? "size-7 text-[0.625rem]" : "size-11 text-xs",
      )}
      aria-hidden
    >
      {texto}
    </span>
  );
}
