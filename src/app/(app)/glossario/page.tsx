import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getGlossaryTerms } from "@/lib/payload/glossary";
import { getSubjects } from "@/lib/payload/queries";
import { idsFavoritas } from "@/features/practice/queries";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";
import { PageHeader, PageShell } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationMolecule, IllustrationSearch } from "@/components/illustrations";
import { Search } from "lucide-react";

export const metadata: Metadata = { title: "Glossário — DespolarizaMED" };

export default async function GlossarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; disciplina?: string }>;
}) {
  const { session } = await requireAssinatura();
  const sp = await searchParams;
  const subjectId = sp.disciplina ? Number(sp.disciplina) : undefined;

  const [termos, disciplinas, favoritos] = await Promise.all([
    getGlossaryTerms({ busca: sp.q, subjectId }),
    getSubjects(),
    idsFavoritas(session.user.id, "GLOSSARY_TERM"),
  ]);
  const favoritosSet = new Set(favoritos);

  // Agrupado por inicial, como um glossário impresso; a busca ignora isso e
  // mostra a lista corrida.
  const porLetra = new Map<string, typeof termos>();
  for (const t of termos) {
    const inicial = t.term.charAt(0).toLocaleUpperCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");
    const lista = porLetra.get(inicial) ?? [];
    lista.push(t);
    porLetra.set(inicial, lista);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <PageShell>
      <PageHeader
        titulo="Glossário"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Glossário" }]}
        descricao={`${termos.length.toLocaleString("pt-BR")} ${termos.length === 1 ? "termo" : "termos"} com definição escrita pelos professores.`}
      />

      <form className="mb-8 grid gap-3 sm:grid-cols-[1fr_14rem_auto]" role="search">
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar termo ou definição…"
            aria-label="Buscar no glossário"
            className="pl-9"
          />
        </div>
        <select
          name="disciplina"
          defaultValue={sp.disciplina ?? ""}
          aria-label="Disciplina"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-[0.9375rem] text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <option value="">Todas as disciplinas</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Button type="submit">Buscar</Button>
      </form>

      {termos.length === 0 ? (
        <EmptyState
          ilustracao={sp.q || sp.disciplina ? <IllustrationSearch /> : <IllustrationMolecule />}
          titulo={sp.q || sp.disciplina ? "Nenhum termo para essa busca" : "O glossário ainda está vazio"}
          descricao={
            sp.q || sp.disciplina
              ? "Tente um termo mais curto, ou tire o filtro de disciplina para ver a lista inteira."
              : "Os termos são cadastrados pelos professores no painel de conteúdo, e aparecem aqui assim que forem publicados."
          }
          acao={
            sp.q || sp.disciplina ? (
              <Button variant="outline" render={<Link href="/glossario" />}>
                Ver todos os termos
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {!sp.q && letras.length > 1 && (
            <nav className="mb-8 flex flex-wrap gap-1.5" aria-label="Iniciais">
              {letras.map((l) => (
                <a
                  key={l}
                  href={`#letra-${l}`}
                  className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {l}
                </a>
              ))}
            </nav>
          )}

          <div className="space-y-8">
            {letras.map((l) => (
              <section key={l} id={`letra-${l}`} className="scroll-mt-24">
                {!sp.q && (
                  <h2 className="mb-3 font-heading text-2xl font-semibold text-primary">{l}</h2>
                )}
                <dl className="space-y-3">
                  {porLetra.get(l)!.map((t) => {
                    const disciplina =
                      t.subject && typeof t.subject === "object" ? t.subject.name : null;
                    return (
                      <div key={t.id} className="rounded-xl bg-card p-5 shadow-xs ring-1 ring-foreground/8">
                        <dt className="flex items-start gap-3">
                          {disciplina && <SubjectIcon disciplina={disciplina} size="sm" />}
                          <span className="min-w-0 flex-1">
                            <span className="block font-heading text-base font-semibold text-foreground">
                              {t.term}
                            </span>
                            {disciplina && (
                              <Link
                                href={`/glossario?disciplina=${typeof t.subject === "object" ? t.subject?.id : ""}`}
                                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                              >
                                {disciplina}
                              </Link>
                            )}
                          </span>
                          <FavoriteButton
                            tipo="GLOSSARY_TERM"
                            id={String(t.id)}
                            inicial={favoritosSet.has(String(t.id))}
                          />
                        </dt>
                        <dd className="mt-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-line text-muted-foreground">
                          {t.definition}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
