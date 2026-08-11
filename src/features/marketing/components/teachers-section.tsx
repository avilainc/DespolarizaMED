import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { teachers } from "@/features/marketing/content";

export function TeachersSection() {
  return (
    <section id="professores" className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Quem ensina
          </h2>
          <p className="mt-3 text-muted-foreground">
            Professores dedicados a transformar conteúdo gratuito em uma jornada organizada de
            aprendizagem.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {teachers.map((teacher) => (
            <Card key={teacher.name} className="border-none bg-card shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
                <Avatar className="size-20">
                  <AvatarImage src={teacher.photo} alt={teacher.name} />
                  <AvatarFallback>{teacher.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{teacher.name}</p>
                  <p className="text-sm text-primary">{teacher.role}</p>
                </div>
                <p className="text-sm text-muted-foreground">{teacher.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
