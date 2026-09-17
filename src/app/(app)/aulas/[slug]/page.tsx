import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLessonBySlug, getLessonMaterials } from "@/lib/payload/queries";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { db } from "@/lib/db";
import { lessonProgress } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { LessonPlayer } from "@/features/courses/components/lesson-player";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { idsFavoritas } from "@/features/practice/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

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
  const subjectSlug =
    typeof lesson.module === "object" && typeof lesson.module.subject === "object"
      ? lesson.module.subject.slug
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {subjectSlug && (
        <Link
          href={`/disciplinas/${subjectSlug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {moduleName ?? "Voltar"}
        </Link>
      )}

      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
        <FavoriteButton tipo="LESSON" id={String(lesson.id)} inicial={favorita} rotulo="Favoritar" />
      </div>
      {lesson.description && <p className="mt-1 text-muted-foreground">{lesson.description}</p>}

      <div className="mt-6">
        {lesson.videoUrl ? (
          <LessonPlayer
            lessonId={lesson.id}
            videoUrl={lesson.videoUrl}
            title={lesson.title}
            initialPositionSeconds={initialPositionSeconds}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Vídeo ainda não disponível para esta aula.
          </div>
        )}
      </div>

      {materials.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Materiais</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {materials.map((material) => (
                <li key={material.id}>
                  <a
                    href={typeof material.file === "object" ? (material.file.url ?? "#") : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-primary"
                  >
                    <FileText className="size-5 shrink-0 text-primary/70" />
                    <span className="text-foreground">
                      {MATERIAL_LABELS[material.type] ?? material.type} — {material.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
