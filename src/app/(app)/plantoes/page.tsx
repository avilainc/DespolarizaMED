import type { Metadata } from "next";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getSubjects } from "@/lib/payload/queries";
import { listarPalestras, plantoesPassados, proximosPlantoes } from "@/features/live/queries";
import { meetDisponivel } from "@/features/live/janela";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic2, PlayCircle, Video } from "lucide-react";

export const metadata: Metadata = { title: "Plantões e palestras — DespolarizaMED" };

function quando(d: Date) {
  return d.toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

export default async function PlantoesPage() {
  await requireAssinatura();
  const [proximos, passados, palestras, disciplinas] = await Promise.all([
    proximosPlantoes(),
    plantoesPassados(),
    listarPalestras(),
    getSubjects(),
  ]);
  const nomeDisciplina = new Map(disciplinas.map((d) => [d.id, d.name]));
  const agora = new Date();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Plantões e palestras</h1>
      <p className="mt-1 text-muted-foreground">
        Tire dúvidas ao vivo com os professores pelo Google Meet. O link aparece 15 minutos antes.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Video className="size-4" /> Próximos plantões
        </h2>
        {proximos.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum plantão agendado no momento. Você recebe um e-mail quando um novo for marcado.
          </p>
        ) : (
          <ul className="space-y-3">
            {proximos.map((p) => {
              const aoVivo = meetDisponivel(p.startsAt, p.endsAt, agora);
              return (
                <li key={p.id} className={`rounded-lg border bg-card p-5 ${aoVivo ? "border-primary" : "border-border"}`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {aoVivo && <Badge>ao vivo agora</Badge>}
                    {p.subjectId && nomeDisciplina.has(p.subjectId) && (
                      <Badge variant="secondary">{nomeDisciplina.get(p.subjectId)}</Badge>
                    )}
                    <span className="capitalize text-muted-foreground">{quando(p.startsAt)}</span>
                    <span className="text-muted-foreground">
                      às {p.endsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">com {p.professor}</p>
                  {p.description && <p className="mt-2 text-sm text-foreground">{p.description}</p>}
                  <div className="mt-4">
                    {aoVivo && p.meetUrl ? (
                      <Button render={<a href={p.meetUrl} target="_blank" rel="noopener noreferrer" />}>
                        <Video data-icon="inline-start" /> Entrar no Google Meet
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {p.meetUrl ? "O botão de entrar aparece 15 minutos antes do início." : "Link do Meet ainda não informado."}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {passados.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <PlayCircle className="size-4" /> Plantões anteriores
          </h2>
          <ul className="space-y-2">
            {passados.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.startsAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} · {p.professor}
                    {p.subjectId && nomeDisciplina.has(p.subjectId) ? ` · ${nomeDisciplina.get(p.subjectId)}` : ""}
                  </p>
                </div>
                {p.recordingUrl ? (
                  <Button variant="outline" size="sm" render={<a href={p.recordingUrl} target="_blank" rel="noopener noreferrer" />}>
                    <PlayCircle data-icon="inline-start" /> Gravação
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">sem gravação</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Mic2 className="size-4" /> Palestras
        </h2>
        {palestras.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Em breve: estratégia de estudo, profissões da área médica e conversas com médicos.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {palestras.map((p) => {
              const futura = p.scheduledFor && p.scheduledFor.getTime() > agora.getTime();
              return (
                <li key={p.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {futura && <Badge variant="outline">agendada</Badge>}
                    {p.scheduledFor && (
                      <span className="text-muted-foreground">
                        {p.scheduledFor.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-foreground">{p.title}</h3>
                  {p.speaker && <p className="text-sm text-muted-foreground">{p.speaker}</p>}
                  {p.description && <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.description}</p>}
                  {p.videoUrl && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" render={<a href={p.videoUrl} target="_blank" rel="noopener noreferrer" />}>
                        <PlayCircle data-icon="inline-start" /> {futura ? "Entrar" : "Assistir"}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
