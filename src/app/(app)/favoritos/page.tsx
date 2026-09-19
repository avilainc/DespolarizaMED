import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, ListChecks, PlayCircle } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { idsFavoritas, questoesFavoritas } from "@/features/practice/queries";
import { getGlossaryTermsByIds } from "@/lib/payload/glossary";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson } from "@/payload/payload-types";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationStar } from "@/components/illustrations";

export const metadata: Metadata = { title: "Favoritos — DespolarizaMED" };

async function aulasFavoritas(ids: string[]): Promise<Lesson[]> {
  const numericos = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!numericos.length) return [];
  const payload = await getPayloadClient();
  const r = await payload.find({
    collection: "lessons",
    where: { id: { in: numericos } },
    limit: numericos.length,
    depth: 1,
  });
  return r.docs;
}

export default async function FavoritosPage() {
  const { session } = await requireAssinatura();
  const alunoId = session.user.id;

  const [questoes, idsTermos, idsAulas] = await Promise.all([
    questoesFavoritas(alunoId),
    idsFavoritas(alunoId, "GLOSSARY_TERM"),
    idsFavoritas(alunoId, "LESSON"),
  ]);
  const [termos, aulas] = await Promise.all([
    getGlossaryTermsByIds(idsTermos.map(Number).filter(Number.isInteger)),
    aulasFavoritas(idsAulas),
  ]);

  const vazio = !questoes.length && !termos.length && !aulas.length;

  return (
    <PageShell>
      <PageHeader
        titulo="Favoritos"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Favoritos" }]}
        descricao="O que você marcou com estrela para voltar depois."
      />

      {vazio ? (
        <EmptyState
          ilustracao={<IllustrationStar />}
          titulo="Nada salvo ainda"
          descricao="Use a estrela nas aulas, nas questões e nos itens do glossário para guardar conteúdos e revisar depois."
          acao={
            <>
              <Button render={<Link href="/questoes" />}>
                Explorar questões
                <ArrowRight />
              </Button>
              <Button variant="outline" render={<Link href="/disciplinas" />}>
                Ver disciplinas
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-10">
          {aulas.length > 0 && (
            <section>
              <SectionHeading titulo={`Aulas (${aulas.length})`} icone={PlayCircle} />
              <ul className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
                {aulas.map((a, i) => (
                  <li
                    key={a.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <PlayCircle className="size-5 shrink-0 text-primary" aria-hidden />
                    <Link href={`/aulas/${a.slug}`} className="min-w-0 flex-1 hover:underline">
                      <span className="block truncate font-medium text-foreground">{a.title}</span>
                      {typeof a.module === "object" && a.module && (
                        <span className="block truncate text-xs text-muted-foreground">{a.module.name}</span>
                      )}
                    </Link>
                    <FavoriteButton tipo="LESSON" id={String(a.id)} inicial />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {questoes.length > 0 && (
            <section>
              <SectionHeading
                titulo={`Questões (${questoes.length})`}
                icone={ListChecks}
                acao={
                  <Link
                    href="/questoes?situacao=favoritas"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Resolver no banco
                  </Link>
                }
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {questoes.map((q) => (
                  <li key={q.id} className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8">
                    <div className="flex items-start gap-3">
                      <SubjectIcon disciplina={q.disciplinaSugerida} size="sm" />
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        {q.instituicaoSlug && <Badge variant="secondary">{q.instituicaoSlug.toUpperCase()}</Badge>}
                        {q.ano && <Badge variant="outline">{q.ano}</Badge>}
                      </div>
                      <FavoriteButton tipo="QUESTION" id={q.id} inicial />
                    </div>
                    <Link
                      href={`/questoes/${q.id}`}
                      className="mt-3 block line-clamp-3 text-sm leading-relaxed text-foreground hover:underline"
                    >
                      {q.enunciado}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {termos.length > 0 && (
            <section>
              <SectionHeading titulo={`Glossário (${termos.length})`} icone={BookMarked} />
              <dl className="grid gap-3 sm:grid-cols-2">
                {termos.map((t) => (
                  <div key={t.id} className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8">
                    <dt className="flex items-start gap-2 font-heading font-semibold text-foreground">
                      <span className="min-w-0 flex-1">{t.term}</span>
                      <FavoriteButton tipo="GLOSSARY_TERM" id={String(t.id)} inicial />
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
