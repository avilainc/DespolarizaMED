import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { buscarNoAcervo, buscarQuestoes, contarQuestoes } from "@/features/library/queries";
import { getGlossaryTerms } from "@/lib/payload/glossary";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson } from "@/payload/payload-types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, HelpCircle, PlayCircle, Search } from "lucide-react";

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

  const nada = termo && !aulas.length && !questoes.length && !termos.length && !paginas.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Busca</h1>
      <p className="mt-1 text-muted-foreground">
        Aulas, questões, glossário e o texto das provas, num lugar só.
      </p>

      <form className="mt-6 flex gap-3" role="search">
        <Input
          name="q"
          defaultValue={termo}
          placeholder="Ex.: fotossíntese, ligação peptídica, Segunda Lei de Newton…"
          aria-label="Buscar"
          autoFocus
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Search className="size-4" /> Buscar
        </button>
      </form>

      {nada && (
        <p className="py-12 text-center text-muted-foreground">Nada encontrado para “{termo}”.</p>
      )}

      {aulas.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <PlayCircle className="size-4" /> Aulas
          </h2>
          <ul className="space-y-2">
            {aulas.map((a) => (
              <li key={a.id} className="rounded-lg border border-border bg-card p-4">
                <Link href={`/aulas/${a.slug}`} className="font-medium text-foreground hover:underline">
                  {a.title}
                </Link>
                {typeof a.module === "object" && (
                  <span className="ml-2 text-xs text-muted-foreground">{a.module.name}</span>
                )}
                {a.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {questoes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <HelpCircle className="size-4" /> Questões ({totalQuestoes.toLocaleString("pt-BR")})
          </h2>
          <ul className="space-y-2">
            {questoes.map((q) => (
              <li key={q.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {q.instituicaoSlug && <Badge variant="secondary">{q.instituicaoSlug.toUpperCase()}</Badge>}
                  {q.ano && <Badge variant="outline">{q.ano}</Badge>}
                  {q.disciplinaSugerida && <span className="text-muted-foreground">{q.disciplinaSugerida}</span>}
                </div>
                <Link href={`/questoes/${q.id}`} className="mt-2 block line-clamp-3 text-sm text-foreground [overflow-wrap:anywhere] hover:underline">
                  {q.enunciado}
                </Link>
              </li>
            ))}
          </ul>
          {totalQuestoes > questoes.length && (
            <Link href={`/questoes?q=${encodeURIComponent(termo)}`} className="mt-3 inline-block text-sm text-primary hover:underline">
              Ver todas as {totalQuestoes.toLocaleString("pt-BR")} questões →
            </Link>
          )}
        </section>
      )}

      {termos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpen className="size-4" /> Glossário
          </h2>
          <dl className="space-y-2">
            {termos.slice(0, 8).map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-card p-4">
                <dt className="font-semibold text-foreground">{t.term}</dt>
                <dd className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.definition}</dd>
              </div>
            ))}
          </dl>
          {termos.length > 8 && (
            <Link href={`/glossario?q=${encodeURIComponent(termo)}`} className="mt-3 inline-block text-sm text-primary hover:underline">
              Ver todos os {termos.length} termos →
            </Link>
          )}
        </section>
      )}

      {paginas.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <FileText className="size-4" /> Nas provas
          </h2>
          <ul className="space-y-2">
            {paginas.map((p) => (
              <li key={`${p.documentId}-${p.pagina}`} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {p.instituicao && <Badge variant="secondary">{p.instituicao}</Badge>}
                  {p.ano && <Badge variant="outline">{p.ano}</Badge>}
                  <span className="text-muted-foreground">
                    {p.tipo.replace(/_/g, " ")} · p. {p.pagina}
                  </span>
                </div>
                {/* ts_headline devolve <b>…</b> em volta do termo; é o único HTML que entra aqui. */}
                <p
                  className="mt-2 text-sm text-muted-foreground [overflow-wrap:anywhere] [&_b]:font-semibold [&_b]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: escaparExcetoNegrito(p.trecho) }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
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
