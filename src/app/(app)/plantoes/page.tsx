import type { Metadata } from "next";
import { Clock, Mic2, PlayCircle, Video } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getSubjects } from "@/lib/payload/queries";
import { listarPalestras, plantoesPassados, proximosPlantoes } from "@/features/live/queries";
import { ANTECEDENCIA_MEET_MIN, meetDisponivel } from "@/features/live/janela";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationVideo, IllustrationCalendar } from "@/components/illustrations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Plantões e palestras — DespolarizaMED" };

function dataLonga(d: Date) {
  return d.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hora(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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
    <PageShell>
      <PageHeader
        titulo="Plantões e palestras"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Plantões e palestras" }]}
        descricao={`Tire dúvidas ao vivo com os professores pelo Google Meet. O link de entrada aparece ${ANTECEDENCIA_MEET_MIN} minutos antes do início.`}
      />

      <section>
        <SectionHeading titulo="Próximos plantões" icone={Video} />
        {proximos.length === 0 ? (
          <EmptyState
            ilustracao={<IllustrationVideo />}
            titulo="Nenhum plantão marcado"
            descricao="Quando um novo encontro for agendado, ele aparece aqui e você recebe um e-mail avisando."
          />
        ) : (
          <ul className="space-y-4">
            {proximos.map((p) => {
              const aoVivo = meetDisponivel(p.startsAt, p.endsAt, agora);
              const abreAs = new Date(p.startsAt.getTime() - ANTECEDENCIA_MEET_MIN * 60_000);
              const nome = p.subjectId ? nomeDisciplina.get(p.subjectId) : null;
              return (
                <li
                  key={p.id}
                  className={cn(
                    "rounded-xl bg-card p-5 shadow-xs ring-1",
                    aoVivo ? "ring-2 ring-primary" : "ring-foreground/8",
                  )}
                >
                  <div className="flex items-start gap-4">
                    {nome ? (
                      <SubjectIcon disciplina={nome} size="lg" />
                    ) : (
                      <span
                        className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                        aria-hidden
                      >
                        <Video className="size-7" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {aoVivo && (
                          <Badge>
                            {/* O ponto pulsante é a única animação de laço da
                                área logada, e some com prefers-reduced-motion. */}
                            <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
                            ao vivo agora
                          </Badge>
                        )}
                        {nome && <Badge variant="secondary">{nome}</Badge>}
                      </div>
                      <h3 className="mt-2 font-heading text-lg leading-snug font-semibold text-foreground">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="capitalize">{dataLonga(p.startsAt)}</span> às {hora(p.endsAt)} · com{" "}
                        {p.professor}
                      </p>
                      {p.description && (
                        <p className="mt-3 text-[0.9375rem] leading-relaxed text-foreground">{p.description}</p>
                      )}

                      <div className="mt-4">
                        {aoVivo && p.meetUrl ? (
                          <Button render={<a href={p.meetUrl} target="_blank" rel="noopener noreferrer" />}>
                            <Video data-icon="inline-start" /> Entrar no plantão
                          </Button>
                        ) : (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="size-4 shrink-0" aria-hidden />
                            {p.meetUrl
                              ? `Link disponível às ${hora(abreAs)}`
                              : "Link do Meet ainda não informado"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {passados.length > 0 && (
        <section className="mt-10">
          <SectionHeading titulo="Plantões anteriores" icone={PlayCircle} />
          <ul className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
            {passados.map((p, i) => (
              <li
                key={p.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3.5",
                  i > 0 && "border-t border-border",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.startsAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                    {p.professor}
                    {p.subjectId && nomeDisciplina.has(p.subjectId) ? ` · ${nomeDisciplina.get(p.subjectId)}` : ""}
                  </p>
                </div>
                {p.recordingUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<a href={p.recordingUrl} target="_blank" rel="noopener noreferrer" />}
                  >
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
        <SectionHeading titulo="Palestras" icone={Mic2} />
        {palestras.length === 0 ? (
          <EmptyState
            ilustracao={<IllustrationCalendar />}
            titulo="Nenhuma palestra agendada"
            descricao="Estão sendo preparadas conversas sobre estratégia de estudo, profissões da área médica e rotina de quem já passou."
          />
        ) : (
          <ul className="grid auto-rows-fr gap-4 sm:grid-cols-2">
            {palestras.map((p) => {
              const futura = p.scheduledFor && p.scheduledFor.getTime() > agora.getTime();
              return (
                <li key={p.id} className="flex h-full flex-col rounded-xl bg-card p-5 shadow-xs ring-1 ring-foreground/8">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                    aria-hidden
                  >
                    <Mic2 className="size-5" />
                  </span>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {futura && <Badge variant="outline">agendada</Badge>}
                    {p.scheduledFor && (
                      <span className="text-xs text-muted-foreground">
                        {p.scheduledFor.toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-heading text-lg leading-snug font-semibold text-foreground">{p.title}</h3>
                  {p.speaker && <p className="mt-0.5 text-sm text-muted-foreground">{p.speaker}</p>}
                  {p.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  )}
                  {p.videoUrl && (
                    <div className="mt-auto pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<a href={p.videoUrl} target="_blank" rel="noopener noreferrer" />}
                      >
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
    </PageShell>
  );
}
