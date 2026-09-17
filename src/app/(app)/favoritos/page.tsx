import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { idsFavoritas, questoesFavoritas } from "@/features/practice/queries";
import { getGlossaryTermsByIds } from "@/lib/payload/glossary";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson } from "@/payload/payload-types";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, HelpCircle, PlayCircle } from "lucide-react";

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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Favoritos</h1>
      <p className="mt-1 text-muted-foreground">
        O que você marcou com estrela para voltar depois.
      </p>

      {vazio && (
        <p className="py-12 text-center text-muted-foreground">
          Nada favoritado ainda. A estrela aparece nas questões, no glossário e nas aulas.
        </p>
      )}

      {aulas.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <PlayCircle className="size-4" /> Aulas ({aulas.length})
          </h2>
          <ul className="space-y-2">
            {aulas.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <Link href={`/aulas/${a.slug}`} className="flex-1 font-medium text-foreground hover:underline">
                  {a.title}
                </Link>
                {typeof a.module === "object" && (
                  <span className="text-xs text-muted-foreground">{a.module.name}</span>
                )}
                <FavoriteButton tipo="LESSON" id={String(a.id)} inicial />
              </li>
            ))}
          </ul>
        </section>
      )}

      {questoes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <HelpCircle className="size-4" /> Questões ({questoes.length})
          </h2>
          <ul className="space-y-2">
            {questoes.map((q) => (
              <li key={q.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {q.instituicaoSlug && <Badge variant="secondary">{q.instituicaoSlug.toUpperCase()}</Badge>}
                  {q.ano && <Badge variant="outline">{q.ano}</Badge>}
                  {q.disciplinaSugerida && (
                    <span className="text-muted-foreground">{q.disciplinaSugerida}</span>
                  )}
                  <span className="ml-auto">
                    <FavoriteButton tipo="QUESTION" id={q.id} inicial />
                  </span>
                </div>
                <Link href={`/questoes/${q.id}`} className="mt-2 block line-clamp-3 text-sm text-foreground hover:underline">
                  {q.enunciado}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/questoes?situacao=favoritas" className="mt-3 inline-block text-sm text-primary hover:underline">
            Resolver as favoritas no banco de questões →
          </Link>
        </section>
      )}

      {termos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpen className="size-4" /> Glossário ({termos.length})
          </h2>
          <dl className="space-y-2">
            {termos.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-card p-4">
                <dt className="flex items-center gap-2 font-semibold text-foreground">
                  {t.term}
                  <span className="ml-auto">
                    <FavoriteButton tipo="GLOSSARY_TERM" id={String(t.id)} inicial />
                  </span>
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
