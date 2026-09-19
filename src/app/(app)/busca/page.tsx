import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, FileText, ListChecks, PlayCircle, Search } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { buscarNoAcervo, buscarQuestoes, contarQuestoes, facetasDoAcervo } from "@/features/library/queries";
import { getGlossaryTerms } from "@/lib/payload/glossary";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson } from "@/payload/payload-types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationSearch } from "@/components/illustrations";

export const metadata: Metadata = { title: "Busca — DespolarizaMED" };

async function buscarAulas(termo: string): Promise<Lesson[]> {
  const payload = await getPayloadClient();
  const r = await payload.find({
    collection: "lessons",
    where: {
      published: { equals: true },
      or: [{ title: { like: termo } }, { description: { like: termo } }],
    },
    limit: 10,
    depth: 1,
  });
  return r.docs;
}

/**
 * Busca única sobre tudo que o aluno pode consultar: aulas, questões,
 * glossário e as páginas das provas. Cada fonte tem seu próprio mecanismo
 * (Postgres FTS para o acervo, `like` do Payload para o conteúdo editorial);
 * a tela só junta os resultados por tipo, sem tentar ranquear entre eles.
 */
export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAssinatura();
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";

  const [aulas, questoes, totalQuestoes, termos, paginas] = termo
    ? await Promise.all([
        buscarAulas(termo),
        buscarQuestoes({ busca: termo, limite: 5 }),
        contarQuestoes({ busca: termo }),
        getGlossaryTerms({ busca: termo }),
        buscarNoAcervo(termo, 10),
      ])
    : [[], [], 0, [], []];

  // Sugestões só quando ainda não há busca. São os temas que mais aparecem no
  // acervo de verdade, lidos de `facetasDoAcervo`, e não uma lista escrita à
  // mão: uma sugestão que não devolve resultado é pior que nenhuma.
  const sugestoes = termo
    ? []
    : (await facetasDoAcervo()).temas
        .filter((t) => t.tema && t.tema.length > 3)
        .slice(0, 10)
        .map((t) => ({ tema: t.tema as string, disciplina: t.disciplina }));

  const nada = Boolean(termo) && !aulas.length && !questoes.length && !termos.length && !paginas.length;

  return (
    <PageShell>
      <PageHeader
        titulo="Busca"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Busca" }]}
        descricao="Aulas, questões, glossário e o texto das provas, num lugar só."
      />

      <form className="flex gap-2" role="search">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={termo}
            placeholder="Busque por assunto, aula, questão ou termo…"
            aria-label="Buscar"
            autoFocus
            className="h-14 pl-12 text-base md:text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-14 shrink-0 px-6">
          Buscar
        </Button>
      </form>

      {sugestoes.length > 0 && (
        <section className="mt-8">
          <SectionHeading titulo="Assuntos com mais questões no acervo" />
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <Link
                key={`${s.disciplina}-${s.tema}`}
                href={`/busca?q=${encodeURIComponent(s.tema)}`}
                className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <SubjectIcon disciplina={s.disciplina} size="sm" className="size-7 [&>svg]:size-3.5" />
                {s.tema}
              </Link>
            ))}
          </div>
        </section>
      )}

      {nada && (
        <div className="mt-8">
          <EmptyState
            ilustracao={<IllustrationSearch />}
            titulo={`Nada encontrado para “${termo}”`}
            descricao="Tente um termo mais curto, o nome do assunto em vez da frase inteira, ou procure direto no banco de questões."
            acao={
              <Button variant="outline" render={<Link href="/questoes" />}>
                Ir para o banco de questões
              </Button>
            }
          />
        </div>
      )}

      {aulas.length > 0 && (
        <section className="mt-10">
          <SectionHeading titulo={`Aulas (${aulas.length})`} icone={PlayCircle} />
          <ul className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
            {aulas.map((a, i) => (
              <li key={a.id} className={i > 0 ? "border-t border-border" : ""}>
                <Link href={`/aulas/${a.slug}`} className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/60">
                  <PlayCircle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{a.title}</span>
                    {typeof a.module === "object" && a.module && (
                      <span className="block text-xs text-muted-foreground">{a.module.name}</span>
                    )}
                    {a.description && (
                      <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">{a.description}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {questoes.length > 0 && (
        <section className="mt-10">
          <SectionHeading
            titulo={`Questões (${totalQuestoes.toLocaleString("pt-BR")})`}
            icone={ListChecks}
            acao={
              totalQuestoes > questoes.length ? (
                <Link
                  href={`/questoes?q=${encodeURIComponent(termo)}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver todas
                </Link>
              ) : undefined
            }
          />
          <ul className="space-y-3">
            {questoes.map((q) => (
              <li key={q.id} className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8">
                <div className="flex items-start gap-3">
                  <SubjectIcon disciplina={q.disciplinaSugerida} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    {q.instituicaoSlug && <Badge variant="secondary">{q.instituicaoSlug.toUpperCase()}</Badge>}
                    {q.ano && <Badge variant="outline">{q.ano}</Badge>}
                    {q.disciplinaSugerida && (
                      <span className="text-xs text-muted-foreground">{q.disciplinaSugerida}</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/questoes/${q.id}`}
                  className="mt-3 block line-clamp-3 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere] hover:underline"
                >
                  {q.enunciado}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {termos.length > 0 && (
        <section className="mt-10">
          <SectionHeading
            titulo={`Glossário (${termos.length})`}
            icone={BookMarked}
            acao={
              termos.length > 8 ? (
                <Link
                  href={`/glossario?q=${encodeURIComponent(termo)}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver todos
                </Link>
              ) : undefined
            }
          />
          <dl className="grid gap-3 sm:grid-cols-2">
            {termos.slice(0, 8).map((t) => (
              <div key={t.id} className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8">
                <dt className="font-heading font-semibold text-foreground">{t.term}</dt>
                <dd className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {paginas.length > 0 && (
        <section className="mt-10">
          <SectionHeading titulo="Nas provas" icone={FileText} />
          <ul className="space-y-3">
            {paginas.map((p) => (
              <li key={`${p.documentId}-${p.pagina}`} className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8">
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.instituicao && <Badge variant="secondary">{p.instituicao}</Badge>}
                  {p.ano && <Badge variant="outline">{p.ano}</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {p.tipo.replace(/_/g, " ")} · p. {p.pagina}
                  </span>
                </div>
                {/* ts_headline devolve <b>…</b> em volta do termo; é o único HTML que entra aqui. */}
                <p
                  className="mt-2 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere] [&_b]:font-semibold [&_b]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: escaparExcetoNegrito(p.trecho) }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}

/**
 * O texto das páginas vem de OCR e pode conter qualquer coisa; só o `<b>` do
 * ts_headline passa como HTML, todo o resto é escapado.
 */
function escaparExcetoNegrito(html: string) {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;b&gt;/g, "<b>")
    .replace(/&lt;\/b&gt;/g, "</b>");
}
