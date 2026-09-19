import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getGlossaryTerms } from "@/lib/payload/glossary";
import { getSubjects } from "@/lib/payload/queries";
import { visualDaMateria } from "@/lib/materias";
import { idsFavoritas } from "@/features/practice/queries";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField, TextField } from "@/components/ui/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tag } from "@/components/ui/chip";

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
    const inicial = t.term
      .charAt(0)
      .toLocaleUpperCase("pt-BR")
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    const lista = porLetra.get(inicial) ?? [];
    lista.push(t);
    porLetra.set(inicial, lista);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <>
      <PageHeader
        titulo="Glossário"
        descricao={`${termos.length.toLocaleString("pt-BR")} ${
          termos.length === 1 ? "termo definido" : "termos definidos"
        } pelos professores, organizados por inicial e por disciplina.`}
      />

      <form role="search" className="mb-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
        <Field rotulo="Buscar termo ou definição">
          {({ id }) => (
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              />
              <TextField
                id={id}
                name="q"
                type="search"
                defaultValue={sp.q ?? ""}
                placeholder="Ligação peptídica, fotossíntese…"
                className="pl-9"
              />
            </div>
          )}
        </Field>

        <Field rotulo="Disciplina">
          {({ id }) => (
            <SelectField id={id} name="disciplina" defaultValue={sp.disciplina ?? ""}>
              <option value="">Todas as disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </SelectField>
          )}
        </Field>

        <div className="flex items-end">
          <Button type="submit" size="lg">
            Buscar
          </Button>
        </div>
      </form>

      {termos.length === 0 ? (
        <EmptyState
          ilustracao={sp.q || sp.disciplina ? "/illustrations/vazio-busca.svg" : "/illustrations/vazio-conteudo.svg"}
          titulo={
            sp.q || sp.disciplina ? "Nenhum termo para essa busca" : "O glossário ainda está vazio"
          }
          descricao={
            sp.q || sp.disciplina
              ? "Tente o termo sozinho, sem o resto da frase, ou tire o filtro de disciplina."
              : "Os termos são escritos pelos professores no painel de conteúdo. Assim que o primeiro for publicado, ele aparece aqui."
          }
          acao={
            sp.q || sp.disciplina ? (
              <Link href="/glossario" className={buttonVariants({ variant: "brand" })}>
                Ver todos os termos
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {!sp.q && letras.length > 1 && (
            <nav className="mb-7 flex flex-wrap gap-1.5" aria-label="Ir para a inicial">
              {letras.map((l) => (
                <a
                  key={l}
                  href={`#letra-${l}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-[0.8125rem] font-semibold text-text-secondary transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  {l}
                </a>
              ))}
            </nav>
          )}

          <div className="space-y-8">
            {letras.map((l) => (
              <section key={l} id={`letra-${l}`}>
                {!sp.q && (
                  <h2 className="mb-3 flex items-center gap-3">
                    <span className="font-display text-[1.375rem] font-bold text-brand-600">
                      {l}
                    </span>
                    <span aria-hidden className="h-px flex-1 bg-border" />
                  </h2>
                )}
                <dl className="grid gap-3 lg:grid-cols-2">
                  {porLetra.get(l)!.map((t) => {
                    const disciplina =
                      t.subject && typeof t.subject === "object" ? t.subject.name : null;
                    const visual = visualDaMateria(disciplina);

                    return (
                      <div
                        key={t.id}
                        className="rounded-xl border border-border bg-surface p-5 shadow-xs"
                      >
                        <dt className="flex flex-wrap items-center gap-2">
                          <span className="t-card-title text-text-primary">{t.term}</span>
                          {disciplina && (
                            <Link
                              href={`/glossario?disciplina=${typeof t.subject === "object" ? t.subject?.id : ""}`}
                            >
                              <Tag tom="materia" cor={visual.cor} icone={visual.icone}>
                                {disciplina}
                              </Tag>
                            </Link>
                          )}
                          <span className="ml-auto">
                            <FavoriteButton
                              tipo="GLOSSARY_TERM"
                              id={String(t.id)}
                              inicial={favoritosSet.has(String(t.id))}
                            />
                          </span>
                        </dt>
                        <dd className="t-leitura mt-2 whitespace-pre-line text-text-secondary">
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
    </>
  );
}
