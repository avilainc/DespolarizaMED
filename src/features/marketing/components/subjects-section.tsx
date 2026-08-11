import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subjects } from "@/features/marketing/content";
import { Atom, Dna, FlaskConical } from "lucide-react";

const icons = {
  biologia: Dna,
  fisica: Atom,
  quimica: FlaskConical,
} as const;

export function SubjectsSection() {
  return (
    <section id="disciplinas" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Disciplinas
        </h2>
        <p className="mt-3 text-muted-foreground">
          Conteúdo organizado em Disciplina → Módulo → Aula, cobrindo exatamente o que cai nos
          principais vestibulares de Medicina.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {subjects.map((subject) => {
          const Icon = icons[subject.slug as keyof typeof icons];
          return (
            <Card key={subject.slug} className="border-none bg-secondary/40">
              <CardHeader>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <CardTitle className="mt-4 text-xl">{subject.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{subject.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
