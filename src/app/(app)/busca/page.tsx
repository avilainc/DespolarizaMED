import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, CircleHelp, PlayCircle, Search } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import {
  buscarNoAcervo,
  buscarQuestoes,
  contarQuestoes,
  facetasDoAcervo,
} from "@/features/library/queries";
import { getGlossaryTerms } from "@/lib/payload/glossary";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson } from "@/payload/payload-types";
import { visualDaMateria } from "@/lib/materias";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/surface";
import { Tag } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

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
 *
 * Antes de buscar, a página não fica em branco: mostra os temas que REALMENTE
 * existem no acervo, lidos das facetas. Sugestão escrita à mão seria uma
 * promessa de conteúdo que pode não existir.
 */
export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAssinatura();
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";

  const [aulas, questoes, totalQuestoes, termos, paginas, facetas] = termo
    ? await Promise.all([
        buscarAulas(termo),
        buscarQuestoes({ busca: termo, limite: 5 }),
        contarQuestoes({ busca: termo }),
        getGlossaryTerms({ busca: termo }),
        buscarNoAcervo(termo, 10),
        facetasDoAcervo(),
      ])
    : [[], [], 0, [], [], await facetasDoAcervo()];

  const nada = termo && !aulas.length && !questoes.length && !termos.length && !paginas.length;

  const sugestoes = facetas.temas
    .filter((t) => t.tema)
    .slice(0, 10)
    .map((t) => ({ tema: t.tema!, disciplina: t.disciplina }));

  return (
    <>
      <PageHeader
        titulo="Busca"
        descricao="Aulas, questões, glossário e o texto das provas, num lugar só."
      />

      {/* Campo grande, não um input de barra de ferramentas: esta página existe
          para buscar, e o campo é o conteúdo principal dela. */}
      <form role="search" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted"
          />
          <input
            name="q"
            type="search"
            defaultValue={termo}
            placeholder="Busque por assunto, aula, questão ou termo…"
            aria-label="Buscar em aulas, questões, glossário e provas"
            autoFocus
            className="campo h-12 rounded-xl pl-12 text-base shadow-xs"
          />
        </div>
        <Button type="submit" size="lg" variant="brand" className="shrink-0">
          <Search data-icon="inline-start" aria-hidden />
          Buscar
        </Button>
      </form>

      {!termo && sugestoes.length > 0 && (
        <section className="mt-8">
          <SectionHeading descricao="Temas com mais questões no acervo, prontos para pesquisar.">
            Comece por aqui
          </SectionHeading>
          <ul className="flex flex-wrap gap-2">
            {sugestoes.map((s) => {
              const visual = visualDaMateria(s.disciplina);
              return (
                <li key={`${s.disciplina}-${s.tema}`}>
                  <Link
                    href={`/busca?q=${encodeURIComponent(s.tema)}`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[0.875rem] text-text-secondary transition-colors hover:border-brand-300 hover:text-text-primary"
                  >
                    <visual.icone
                      aria-hidden
                      className="size-4 shrink-0"
                      style={{ color: visual.cor }}
                    />
                    {s.tema}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {nada && (
        <div className="mt-8">
          <EmptyState
            ilustracao="/illustrations/vazio-busca.svg"
            titulo={`Nada encontrado para “${termo}”`}
            descricao="Tente um termo mais curto, ou busque pelo nome do assunto em vez da frase inteira da questão."
            acao={
              <Link
                href="/busca"
                className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-4 text-[0.875rem] font-medium text-text-secondary hover:border-brand-300"
              >
                Ver sugestões de temas
              </Link>
            }
          />
        </div>
      )}

      {aulas.length > 0 && (
        <section className="mt-8">
          <SectionHeading icone={PlayCircle}>Aulas ({aulas.length})</SectionHeading>
          <ul className="grid gap-3 md:grid-cols-2">
            {aulas.map((a) => {
              const modulo = typeof a.module === "object" ? a.module : null;
              const disciplina =
                modulo && typeof modulo.subject === "object" ? modulo.subject.name : null;
              const visual = visualDaMateria(disciplina);

              return (
                <li key={a.id}>
                  <Link
                    href={`/aulas/${a.slug}`}
                    className="flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs cartao-interativo"
                  >
                    <IconTile icone={visual.icone} cor={visual.cor} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-medium text-text-primary">
                        {a.title}
                      </span>
                      <span className="t-meta block">
                        {[disciplina, modulo?.name].filter(Boolean).join(" · ")}
                      </span>
                      {a.description && (
                        <span className="mt-1 block line-clamp-2 text-[0.875rem] text-text-muted">
                          {a.description}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {questoes.length > 0 && (
        <section className="mt-8">
          <SectionHeading
            icone={CircleHelp}
            acao={
              totalQuestoes > questoes.length ? (
                <Link
                  href={`/questoes?q=${encodeURIComponent(termo)}`}
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                >
                  Ver as {totalQuestoes.toLocaleString("pt-BR")}
                  <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              ) : undefined
            }
          >
            Questões ({totalQuestoes.toLocaleString("pt-BR")})
          </SectionHeading>

          <ul className="space-y-3">
            {questoes.map((q) => {
              const visual = visualDaMateria(q.disciplinaSugerida);
              return (
                <li key={q.id}>
                  <Link
                    href={`/questoes/${q.id}`}
                    className="block rounded-xl border border-border bg-surface p-4 shadow-xs cartao-interativo"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      {q.instituicaoSlug && (
                        <Tag tom="marca">{q.instituicaoSlug.toUpperCase()}</Tag>
                      )}
                      {q.ano && <Tag tom="neutro">{q.ano}</Tag>}
                      {q.disciplinaSugerida && (
                        <Tag tom="materia" cor={visual.cor} icone={visual.icone}>
                          {q.disciplinaSugerida}
                        </Tag>
                      )}
                    </span>
                    <span className="mt-2 block line-clamp-3 text-[0.9375rem] leading-relaxed text-text-secondary [overflow-wrap:anywhere]">
                      {q.enunciado}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {termos.length > 0 && (
        <section className="mt-8">
          <SectionHeading
            icone={BookOpen}
            acao={
              termos.length > 8 ? (
                <Link
                  href={`/glossario?q=${encodeURIComponent(termo)}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  Ver todos os {termos.length} termos →
                </Link>
              ) : undefined
            }
          >
            Glossário ({termos.length})
          </SectionHeading>
          <dl className="grid gap-3 md:grid-cols-2">
            {termos.slice(0, 8).map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-surface p-4 shadow-xs">
                <dt className="t-card-title text-text-primary">{t.term}</dt>
                <dd className="mt-1 line-clamp-2 text-[0.875rem] leading-relaxed text-text-secondary">
                  {t.definition}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {paginas.length > 0 && (
        <section className="mt-8">
          <SectionHeading
            icone={FileText}
            descricao="Trechos do texto original das provas, como saíram do caderno."
          >
            Nas provas ({paginas.length})
          </SectionHeading>
          <ul className="space-y-3">
            {paginas.map((p) => (
              <li
                key={`${p.documentId}-${p.pagina}`}
                className="rounded-xl border border-border bg-surface p-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {p.instituicao && <Tag tom="marca">{p.instituicao}</Tag>}
                  {p.ano && <Tag tom="neutro">{p.ano}</Tag>}
                  <span className="t-meta">
                    {p.tipo.replace(/_/g, " ")} · p. {p.pagina}
                  </span>
                </div>
                {/* ts_headline devolve <b>…</b> em volta do termo; é o único HTML que entra aqui. */}
                <p
                  className="mt-2 text-[0.875rem] leading-relaxed text-text-muted [overflow-wrap:anywhere] [&_b]:rounded-sm [&_b]:bg-warning-soft [&_b]:px-0.5 [&_b]:font-semibold [&_b]:text-text-primary"
                  dangerouslySetInnerHTML={{ __html: escaparExcetoNegrito(p.trecho) }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
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
