import Link from "next/link";
import type { Metadata } from "next";
import { getSubjects } from "@/lib/payload/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Disciplinas — DespolarizaMED",
};

export default async function DisciplinasPage() {
  const subjects = await getSubjects();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Disciplinas</h1>
      <p className="mt-1 text-muted-foreground">
        Escolha uma disciplina para continuar seus estudos.
      </p>

      {subjects.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nenhuma disciplina publicada ainda.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link key={subject.id} href={`/disciplinas/${subject.slug}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {subject.name}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                {subject.description && (
                  <CardContent className="text-sm text-muted-foreground">
                    {subject.description}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
