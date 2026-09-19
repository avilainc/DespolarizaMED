import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, PlayCircle } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { idsFavoritas, questoesFavoritas } from "@/features/practice/queries";
import { getGlossaryTermsByIds } from "@/lib/payload/glossary";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson } from "@/payload/payload-types";
import { visualDaMateria } from "@/lib/materias";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/surface";
import { Tag } from "@/components/ui/chip";
import { buttonVariants } from "@/components/ui/button";

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

  const total = questoes.length + termos.length + aulas.length;

  return (
    <>
      <PageHeader
        titulo="Favoritos"
        descricao="Tudo que você marcou com a estrela, reunido para revisar depois."
      />

      {total === 0 ? (
        /* O estado vazio anterior era uma frase solta no meio da página. Agora
           diz onde fica a estrela e oferece o caminho para começar a usar. */
        <EmptyState
          ilustracao="/illustrations/vazio-favoritos.svg"
          titulo="Nada salvo ainda"
          descricao="Use a estrela nas aulas, nas questões e nos termos do glossário para guardar o que você quer revisar antes da prova."
          acao={
            <>
              <Link href="/questoes" className={buttonVariants()}>
                <CircleHelp data-icon="inline-start" aria-hidden />
                Explorar questões
              </Link>
              <Link href="/disciplinas" className={buttonVariants({ variant: "outline" })}>
                Ver disciplinas
              </Link>
            </>
          }
        />
      ) : (
        <div className="space-y-10">
          {aulas.length > 0 && (
            <section>
              <SectionHeading icone={PlayCircle}>Aulas ({aulas.length})</SectionHeading>
              <ul className="grid gap-3 md:grid-cols-2">
                {aulas.map((a) => {
                  const modulo = typeof a.module === "object" ? a.module : null;
                  const disciplina =
                    modulo && typeof modulo.subject === "object" ? modulo.subject.name : null;
                  const visual = visualDaMateria(disciplina);

                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 cartao cartao-p-sm"
                    >
                      <IconTile icone={visual.icone} cor={visual.cor} />
                      <Link href={`/aulas/${a.slug}`} className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-medium text-text-primary hover:underline">
                          {a.title}
                        </span>
                        <span className="t-meta block truncate">
                          {[disciplina, modulo?.name].filter(Boolean).join(" · ")}
                        </span>
                      </Link>
                      <FavoriteButton tipo="LESSON" id={String(a.id)} inicial />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {questoes.length > 0 && (
            <section>
              <SectionHeading
                icone={CircleHelp}
                acao={
                  <Link
                    href="/questoes?situacao=favoritas"
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                  >
                    Resolver as favoritas
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                }
              >
                Questões ({questoes.length})
              </SectionHeading>

              <ul className="space-y-3">
                {questoes.map((q) => {
                  const visual = visualDaMateria(q.disciplinaSugerida);
                  return (
                    <li
                      key={q.id}
                      className="cartao cartao-p-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {q.instituicaoSlug && (
                          <Tag tom="marca">{q.instituicaoSlug.toUpperCase()}</Tag>
                        )}
                        {q.ano && <Tag tom="neutro">{q.ano}</Tag>}
                        {q.disciplinaSugerida && (
                          <Tag tom="materia" cor={visual.cor} icone={visual.icone}>
                            {q.disciplinaSugerida}
                          </Tag>
                        )}
                        <span className="ml-auto">
                          <FavoriteButton tipo="QUESTION" id={q.id} inicial />
                        </span>
                      </div>
                      <Link
                        href={`/questoes/${q.id}`}
                        className="mt-2.5 block line-clamp-3 text-[0.9375rem] leading-relaxed text-text-secondary [overflow-wrap:anywhere] hover:text-text-primary"
                      >
                        {q.enunciado}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {termos.length > 0 && (
            <section>
              <SectionHeading icone={BookOpen}>Glossário ({termos.length})</SectionHeading>
              <dl className="grid gap-3 md:grid-cols-2">
                {termos.map((t) => (
                  <div
                    key={t.id}
                    className="cartao cartao-p-sm"
                  >
                    <dt className="flex items-center gap-2">
                      <span className="t-card-title text-text-primary">{t.term}</span>
                      <span className="ml-auto">
                        <FavoriteButton tipo="GLOSSARY_TERM" id={String(t.id)} inicial />
                      </span>
                    </dt>
                    <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-text-secondary">
                      {t.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}
    </>
  );
}
