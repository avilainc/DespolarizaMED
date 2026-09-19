import type { Metadata } from "next";
import { CalendarClock, Clock3, Mic2, PlayCircle, Radio, Video } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { visualDaMateria } from "@/lib/materias";
import { getSubjects } from "@/lib/payload/queries";
import { listarPalestras, plantoesPassados, proximosPlantoes } from "@/features/live/queries";
import { meetDisponivel } from "@/features/live/janela";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/surface";
import { Tag } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Plantões e palestras — DespolarizaMED" };

const MINUTOS_DE_ANTECEDENCIA = 15;

function quando(d: Date) {
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

/** "Hoje · 19:00" quando é hoje; o dia por extenso quando não é. */
function rotuloDeData(d: Date, agora: Date) {
  const mesmoDia = d.toDateString() === agora.toDateString();
  const amanha = new Date(agora);
  amanha.setDate(amanha.getDate() + 1);
  if (mesmoDia) return `Hoje · ${hora(d)}`;
  if (d.toDateString() === amanha.toDateString()) return `Amanhã · ${hora(d)}`;
  return quando(d);
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
    <>
      <PageHeader
        titulo="Plantões e palestras"
        descricao={`Encontros ao vivo com os professores pelo Google Meet. O botão de entrar aparece ${MINUTOS_DE_ANTECEDENCIA} minutos antes do horário marcado.`}
      />

      <section>
        <SectionHeading icone={Video}>Próximos plantões</SectionHeading>

        {proximos.length === 0 ? (
          <EmptyState
            ilustracao="/illustrations/vazio-plantao.svg"
            titulo="Nenhum plantão marcado"
            descricao="Quando um novo encontro for agendado, ele aparece aqui e você recebe um e-mail com o horário."
          />
        ) : (
          <ul className="space-y-4">
            {proximos.map((p) => {
              const aoVivo = meetDisponivel(p.startsAt, p.endsAt, agora);
              const nome = p.subjectId ? (nomeDisciplina.get(p.subjectId) ?? null) : null;
              const visual = visualDaMateria(nome);
              const liberaEm = new Date(p.startsAt);
              liberaEm.setMinutes(liberaEm.getMinutes() - MINUTOS_DE_ANTECEDENCIA);

              return (
                <li
                  key={p.id}
                  className={`overflow-hidden rounded-xl border bg-surface shadow-xs ${
                    aoVivo ? "border-danger/40" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start gap-4 cartao-p-md">
                    <IconTile icone={Video} cor={visual.cor} tamanho="lg" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {aoVivo && (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-danger-text">
                            <Radio aria-hidden className="size-3 animate-pulse" />
                            AO VIVO AGORA
                          </span>
                        )}
                        {nome && (
                          <Tag tom="materia" cor={visual.cor} icone={visual.icone}>
                            {nome}
                          </Tag>
                        )}
                      </div>

                      <h3 className="t-section mt-2 text-text-primary">{p.title}</h3>
                      <p className="t-meta mt-0.5">com {p.professor}</p>

                      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.875rem] text-text-secondary">
                        <span className="inline-flex items-center gap-1.5 capitalize">
                          <CalendarClock aria-hidden className="size-4 shrink-0 text-text-muted" />
                          {rotuloDeData(p.startsAt, agora)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 aria-hidden className="size-4 shrink-0 text-text-muted" />
                          até {hora(p.endsAt)}
                        </span>
                      </p>

                      {p.description && (
                        <p className="mt-3 text-[0.9375rem] leading-relaxed text-text-secondary">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {aoVivo && p.meetUrl ? (
                        <Button
                         
                          size="lg"
                          render={
                            <a href={p.meetUrl} target="_blank" rel="noopener noreferrer" />
                          }
                        >
                          <Video data-icon="inline-start" aria-hidden />
                          Entrar no plantão
                        </Button>
                      ) : (
                        // A regra dos 15 minutos é de negócio e não mudou; o que
                        // mudou é o aluno saber A QUE HORAS o link libera, em vez
                        // de ler "aparece 15 minutos antes" e ter que calcular.
                        <p className="rounded-lg bg-surface-subtle px-3 py-2 text-[0.8125rem] text-text-muted">
                          {p.meetUrl
                            ? `Link disponível às ${hora(liberaEm)}`
                            : "Link do Meet ainda não informado"}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="secao">
        <SectionHeading icone={Mic2}>Palestras</SectionHeading>

        {palestras.length === 0 ? (
          <EmptyState
            icone={Mic2}
            tamanho="sm"
            titulo="Nenhuma palestra agendada"
            descricao="Em breve: estratégia de estudo, profissões da área médica e conversas com quem já passou."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {palestras.map((p) => {
              const futura = p.scheduledFor && p.scheduledFor.getTime() > agora.getTime();
              return (
                <li
                  key={p.id}
                  className="flex flex-col cartao cartao-p-md"
                >
                  <div className="flex items-start gap-3">
                    <IconTile icone={Mic2} cor="var(--materia-quim)" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {futura ? (
                          <Tag tom="marca">agendada</Tag>
                        ) : (
                          <Tag tom="neutro">realizada</Tag>
                        )}
                        {p.scheduledFor && (
                          <span className="t-meta">
                            {p.scheduledFor.toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="t-card-title mt-1.5 text-text-primary">{p.title}</h3>
                      {p.speaker && <p className="t-meta">{p.speaker}</p>}
                    </div>
                  </div>

                  {p.description && (
                    <p className="mt-3 flex-1 text-[0.875rem] leading-relaxed text-text-secondary">
                      {p.description}
                    </p>
                  )}

                  {p.videoUrl && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        render={<a href={p.videoUrl} target="_blank" rel="noopener noreferrer" />}
                      >
                        <PlayCircle data-icon="inline-start" aria-hidden />
                        {futura ? "Entrar" : "Assistir gravação"}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {passados.length > 0 && (
        <section className="secao">
          <SectionHeading icone={PlayCircle}>Plantões anteriores</SectionHeading>
          <ul className="space-y-2">
            {passados.map((p) => {
              const nome = p.subjectId ? (nomeDisciplina.get(p.subjectId) ?? null) : null;
              const visual = visualDaMateria(nome);
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl cartao px-4 py-3"
                >
                  <IconTile icone={visual.icone} cor={visual.cor} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-medium text-text-primary">{p.title}</p>
                    <p className="t-meta">
                      {p.startsAt.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {p.professor}
                      {nome ? ` · ${nome}` : ""}
                    </p>
                  </div>
                  {p.recordingUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <a href={p.recordingUrl} target="_blank" rel="noopener noreferrer" />
                      }
                    >
                      <PlayCircle data-icon="inline-start" aria-hidden />
                      Gravação
                    </Button>
                  ) : (
                    <span className="t-meta shrink-0">sem gravação</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
