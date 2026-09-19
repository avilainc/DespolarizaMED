import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { getSubjects } from "@/lib/payload/queries";
import { listarPalestras, obterPalestra, obterPlantao, todosPlantoes } from "@/features/live/queries";
import { SessionForm } from "@/features/live/components/session-form";
import { LectureForm } from "@/features/live/components/lecture-form";
import { DeleteLiveButton, NotifyButton } from "@/features/live/components/live-admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Pencil } from "lucide-react";

export const metadata: Metadata = { title: "Plantões e palestras — DespolarizaMED" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function quando(d: Date) {
  return d.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function ProfessorPlantoesPage({
  searchParams,
}: {
  searchParams: Promise<{ plantao?: string; palestra?: string }>;
}) {
  const { session, role } = await requireSessionWithRole("TEACHER");
  const sp = await searchParams;

  const [disciplinas, plantoes, palestras] = await Promise.all([getSubjects(), todosPlantoes(), listarPalestras()]);
  const editandoPlantao = sp.plantao && UUID.test(sp.plantao) ? await obterPlantao(sp.plantao) : null;
  const editandoPalestra = sp.palestra && UUID.test(sp.palestra) ? await obterPalestra(sp.palestra) : null;
  const nomeDisciplina = new Map(disciplinas.map((d) => [d.id, d.name]));
  const agora = new Date();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        migalhas={[
          { rotulo: "Área do professor", href: "/professor" },
          { rotulo: "Plantões e palestras" },
        ]}
        titulo="Plantões e palestras"
        descricao="Agende o plantão, cole o link do Meet e avise os alunos. Depois, adicione a gravação."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Plantões</h2>
            {plantoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plantão agendado.</p>
            ) : (
              <ul className="space-y-2">
                {plantoes.map((p) => {
                  const passado = p.endsAt < agora;
                  const meu = p.teacherId === session.user.id || role === "ADMIN";
                  return (
                    <li key={p.id} className={`rounded-lg border border-border bg-card p-4 ${passado ? "opacity-70" : ""}`}>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant={passado ? "outline" : "default"}>{passado ? "realizado" : "agendado"}</Badge>
                        {p.subjectId && nomeDisciplina.has(p.subjectId) && (
                          <Badge variant="secondary">{nomeDisciplina.get(p.subjectId)}</Badge>
                        )}
                        <span className="text-muted-foreground">
                          {quando(p.startsAt)} → {p.endsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-muted-foreground">· {p.professor}</span>
                        {meu && (
                          <span className="ml-auto flex items-center gap-1">
                            {!passado && <NotifyButton id={p.id} />}
                            <Button variant="ghost" size="sm" render={<Link href={`/professor/plantoes?plantao=${p.id}`} />} aria-label="Editar">
                              <Pencil />
                            </Button>
                            <DeleteLiveButton id={p.id} tipo="plantao" />
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-medium text-foreground">{p.title}</p>
                      {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.meetUrl ? "Meet configurado" : "Sem link do Meet"}
                        {p.recordingUrl ? " · gravação disponível" : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Palestras</h2>
            {palestras.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma palestra publicada.</p>
            ) : (
              <ul className="space-y-2">
                {palestras.map((p) => (
                  <li key={p.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {p.scheduledFor && <span className="text-muted-foreground">{quando(p.scheduledFor)}</span>}
                      {p.speaker && <span className="text-muted-foreground">· {p.speaker}</span>}
                      <span className="ml-auto flex items-center gap-1">
                        <Button variant="ghost" size="sm" render={<Link href={`/professor/plantoes?palestra=${p.id}`} />} aria-label="Editar">
                          <Pencil />
                        </Button>
                        <DeleteLiveButton id={p.id} tipo="palestra" />
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-foreground">{p.title}</p>
                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editandoPlantao ? "Editar plantão" : "Novo plantão"}</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionForm
                key={editandoPlantao?.id ?? "novo"}
                disciplinas={disciplinas.map((d) => ({ id: d.id, name: d.name }))}
                inicial={editandoPlantao}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editandoPalestra ? "Editar palestra" : "Nova palestra"}</CardTitle>
            </CardHeader>
            <CardContent>
              <LectureForm key={editandoPalestra?.id ?? "nova"} inicial={editandoPalestra} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
