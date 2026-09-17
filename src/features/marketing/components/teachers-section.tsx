import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { teachers } from "@/features/marketing/content";
import { cn } from "@/lib/utils";

/**
 * Iniciais de quem tem título no nome.
 *
 * Era `name.slice(0, 2)`, que em "Prof. João Ávila" devolve "Pr" — e como a
 * foto apontava para um arquivo inexistente, o card caía justamente nesse
 * fallback. Descartar os títulos e pegar a inicial do primeiro e do último
 * nome dá "JA", que é o que se espera ver.
 */
function iniciais(nome: string) {
  const TITULOS = /^(prof(a|\.|essor|essora)?|dr(a|\.)?|me\.|ms\.|phd)$/i;
  const partes = nome
    .split(/\s+/)
    .filter((p) => p.length > 0 && !TITULOS.test(p.replace(/\.$/, "")));
  if (partes.length === 0) return nome.slice(0, 2).toUpperCase();
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export function TeachersSection() {
  // Com um professor só, `sm:grid-cols-2` deixava a metade direita vazia e a
  // seção parecia quebrada. A grade passa a acompanhar quantos existem.
  const colunas =
    teachers.length === 1 ? "max-w-md" : teachers.length === 2 ? "max-w-3xl sm:grid-cols-2" : "max-w-5xl sm:grid-cols-2 lg:grid-cols-3";

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

        <div className={cn("mx-auto mt-12 grid gap-6", colunas)}>
          {teachers.map((teacher) => (
            <Card key={teacher.name} className="border-none bg-card shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
                <Avatar className="size-20">
                  {/* `photo` é opcional: apontar para um arquivo que não existe
                      em public/ gerava 404 no console e caía no fallback. */}
                  {teacher.photo && <AvatarImage src={teacher.photo} alt="" />}
                  <AvatarFallback className="text-lg font-medium">
                    {iniciais(teacher.name)}
                  </AvatarFallback>
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
