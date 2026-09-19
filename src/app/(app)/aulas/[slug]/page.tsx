import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, Download, FileText, PlayCircle } from "lucide-react";
import { getLessonBySlug, getLessonMaterials } from "@/lib/payload/queries";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { db } from "@/lib/db";
import { lessonProgress } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { visualDaMateria } from "@/lib/materias";
import { LessonPlayer } from "@/features/courses/components/lesson-player";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { idsFavoritas } from "@/features/practice/queries";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { IconTile } from "@/components/ui/surface";
import { Tag } from "@/components/ui/chip";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  params: Promise<{ slug: string }>;
};

const MATERIAL_LABELS: Record<string, string> = {
  APOSTILA: "Apostila",
  SLIDES: "Slides",
  ANOTACOES: "Anotações da aula",
  LISTA_EXERCICIOS: "Lista de exercícios",
  RESOLUCAO: "Resolução",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);
  return { title: lesson ? `${lesson.title} — DespolarizaMED` : "Aula — DespolarizaMED" };
}

export default async function AulaPage({ params }: Props) {
  const { slug } = await params;

  // O portão vem antes de qualquer consulta ao conteúdo: sem assinatura
  // vigente o aluno vai para /planos sem que a aula chegue a ser carregada.
  // ADMIN e TEACHER passam sem assinar (ver require-subscription).
  const { session } = await requireAssinatura();

  const lesson = await getLessonBySlug(slug);
  if (!lesson) {
    notFound();
  }

  const [materials, favoritas] = await Promise.all([
    getLessonMaterials(lesson.id),
    idsFavoritas(session.user.id, "LESSON"),
  ]);
  const favorita = favoritas.includes(String(lesson.id));

  let initialPositionSeconds = 0;
  {
    const progress = await db
      .select({ positionSeconds: lessonProgress.positionSeconds })
      .from(lessonProgress)
      .where(
        and(eq(lessonProgress.studentId, session.user.id), eq(lessonProgress.lessonId, lesson.id)),
      )
      .limit(1);
    initialPositionSeconds = progress[0]?.positionSeconds ?? 0;
  }

  const moduleName = typeof lesson.module === "object" ? lesson.module.name : null;
  const subject =
    typeof lesson.module === "object" && typeof lesson.module.subject === "object"
      ? lesson.module.subject
      : null;
  const visual = visualDaMateria(subject?.slug ?? subject?.name);
  const minutos = lesson.durationSeconds
    ? `${Math.round(lesson.durationSeconds / 60)} min`
    : null;

  return (
    <>
      <PageHeader
        migalhas={[
          { rotulo: "Disciplinas", href: "/disciplinas" },
          ...(subject ? [{ rotulo: subject.name, href: `/disciplinas/${subject.slug}` }] : []),
          { rotulo: lesson.title },
        ]}
        titulo={lesson.title}
        descricao={lesson.description ?? undefined}
        acoes={<FavoriteButton tipo="LESSON" id={String(lesson.id)} inicial={favorita} rotulo="Favoritar" />}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            {subject && (
              <Tag tom="materia" cor={visual.cor} icone={visual.icone}>
                {subject.name}
              </Tag>
            )}
            {moduleName && <Tag tom="neutro">{moduleName}</Tag>}
            {minutos && (
              <span className="t-meta inline-flex items-center gap-1.5">
                <Clock3 aria-hidden className="size-3.5" />
                {minutos}
              </span>
            )}
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl cartao">
        {lesson.videoUrl ? (
          <LessonPlayer
            lessonId={lesson.id}
            videoUrl={lesson.videoUrl}
            title={lesson.title}
            initialPositionSeconds={initialPositionSeconds}
          />
        ) : (
          /* Vídeo ausente é um estado legítimo — a aula pode existir só como
             material. O bloco explica em vez de mostrar um retângulo tracejado
             com uma frase em cinza. */
          <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-surface-subtle px-6 text-center">
            <IconTile icone={PlayCircle} cor={visual.cor} tamanho="lg" />
            <p className="t-card-title text-text-primary">Vídeo ainda não disponível</p>
            <p className="max-w-[44ch] text-[0.875rem] text-text-muted">
              Esta aula já está no catálogo, mas a gravação ainda não foi publicada.
              {materials.length > 0 && " Os materiais abaixo já podem ser baixados."}
            </p>
          </div>
        )}
      </div>

      {materials.length > 0 && (
        <section className="secao">
          <SectionHeading icone={FileText}>Materiais da aula</SectionHeading>
          <ul className="grid gap-3 md:grid-cols-2">
            {materials.map((material) => (
              <li key={material.id}>
                <a
                  href={typeof material.file === "object" ? (material.file.url ?? "#") : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full items-center gap-3 cartao cartao-p-sm cartao-interativo"
                >
                  <IconTile icone={FileText} cor={visual.cor} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] font-medium text-text-primary">
                      {material.title}
                    </span>
                    <span className="t-meta block">
                      {MATERIAL_LABELS[material.type] ?? material.type}
                    </span>
                  </span>
                  <Download aria-hidden className="size-4 shrink-0 text-text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {subject && (
        <div className="mt-8 border-t border-border pt-6">
          <Link
            href={`/disciplinas/${subject.slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Ver todas as aulas de {subject.name}
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Link>
        </div>
      )}
    </>
  );
}
