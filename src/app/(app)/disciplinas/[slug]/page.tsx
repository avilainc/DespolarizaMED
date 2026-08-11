import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModulesBySubject, getLessonsByModule, getSubjectBySlug } from "@/lib/payload/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  return { title: subject ? `${subject.name} — DespolarizaMED` : "Disciplina — DespolarizaMED" };
}

export default async function DisciplinaPage({ params }: Props) {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);

  if (!subject) {
    notFound();
  }

  const modules = await getModulesBySubject(subject.id);
  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => ({
      module: mod,
      lessons: await getLessonsByModule(mod.id),
    })),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/disciplinas" className="text-sm text-muted-foreground hover:text-foreground">
        ← Disciplinas
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-foreground">{subject.name}</h1>
      {subject.description && (
        <p className="mt-1 text-muted-foreground">{subject.description}</p>
      )}

      <div className="mt-8 space-y-6">
        {modulesWithLessons.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum módulo publicado ainda.</p>
        )}

        {modulesWithLessons.map(({ module: mod, lessons }) => (
          <Card key={mod.id}>
            <CardHeader>
              <CardTitle className="text-lg">{mod.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma aula publicada ainda.</p>
              ) : (
                <ul className="divide-y">
                  {lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/aulas/${lesson.slug}`}
                        className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-primary"
                      >
                        <PlayCircle className="size-5 shrink-0 text-primary/70" />
                        <span className="text-foreground">{lesson.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
