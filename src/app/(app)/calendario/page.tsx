import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CalendarDays, Target } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { diaParaData, diasAte } from "@/lib/datas";
import { itensDoPeriodo, planoDoAluno } from "@/features/study-plan/queries";
import { palestrasNoPeriodo, plantoesNoPeriodo } from "@/features/live/queries";
import { CalendarView, type EventoCalendario } from "@/features/study-plan/components/calendar-view";
import { MetricCard } from "@/components/metric-card";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Calendário — DespolarizaMED" };

/**
 * Junta num calendário só: itens do plano de estudos (pessoais), plantões,
 * palestras e a data da prova do aluno. Janela de -2 a +6 meses; o resto
 * não cabe na tela e não muda o que o aluno decide hoje.
 */
export default async function CalendarioPage() {
  const { session } = await requireAssinatura();

  const de = new Date();
  de.setMonth(de.getMonth() - 2);
  const ate = new Date();
  ate.setMonth(ate.getMonth() + 6);

  const [plano, itens, plantoes, palestras] = await Promise.all([
    planoDoAluno(session.user.id),
    itensDoPeriodo(session.user.id, de, ate),
    plantoesNoPeriodo(de, ate),
    palestrasNoPeriodo(de, ate),
  ]);

  const eventos: EventoCalendario[] = [
    ...itens.map((i) => {
      const fim = new Date(i.scheduledFor);
      fim.setMinutes(fim.getMinutes() + 45);
      return {
        id: `plano-${i.id}`,
        title: i.title,
        start: i.scheduledFor.toISOString(),
        end: fim.toISOString(),
        tipo: "PLANO" as const,
        href: "/plano",
        concluido: i.completed,
      };
    }),
    ...plantoes.map((p) => ({
      id: `plantao-${p.id}`,
      title: `Plantão: ${p.title}`,
      start: p.startsAt.toISOString(),
      end: p.endsAt.toISOString(),
      tipo: "PLANTAO" as const,
      href: "/plantoes",
    })),
    ...palestras
      .filter((p) => p.scheduledFor)
      .map((p) => {
        const fim = new Date(p.scheduledFor!);
        fim.setHours(fim.getHours() + 1);
        return {
          id: `palestra-${p.id}`,
          title: `Palestra: ${p.title}`,
          start: p.scheduledFor!.toISOString(),
          end: fim.toISOString(),
          tipo: "PALESTRA" as const,
          href: "/plantoes",
        };
      }),
  ];

  if (plano?.examDate) {
    const inicio = diaParaData(plano.examDate);
    inicio.setHours(8, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setHours(18);
    eventos.push({
      id: "prova",
      title: `Prova: ${plano.targetVestibular ?? "vestibular"}`,
      start: inicio.toISOString(),
      end: fim.toISOString(),
      tipo: "PROVA",
      href: "/plano",
    });
  }

  // Cartões do topo: só entram quando existe o dado. Um cartão "Próxima
  // atividade: sem dados" ocuparia espaço para dizer nada.
  const agora = new Date();
  const proxima = eventos
    .filter((e) => e.tipo !== "PROVA" && new Date(e.start).getTime() >= agora.getTime())
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const diasAteProva = plano?.examDate ? diasAte(plano.examDate) : null;

  return (
    <PageShell largura="larga">
      <PageHeader
        titulo="Calendário"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Calendário" }]}
        descricao="Seu cronograma, plantões, palestras e provas em um só lugar."
        acoes={
          !plano ? (
            <Button render={<Link href="/plano" />}>Montar plano de estudos</Button>
          ) : (
            <Button variant="outline" render={<Link href="/plano" />}>
              Ver o plano da semana
            </Button>
          )
        }
      />

      {(proxima || diasAteProva !== null) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            rotulo="Hoje"
            valor={agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            apoio={agora.toLocaleDateString("pt-BR", { weekday: "long" })}
            icone={CalendarDays}
          />
          {proxima && (
            <MetricCard
              rotulo="Próxima atividade"
              valor={new Date(proxima.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              apoio={proxima.title}
              icone={CalendarClock}
            />
          )}
          {diasAteProva !== null && (
            <MetricCard
              rotulo="Próxima prova"
              valor={`${diasAteProva} ${diasAteProva === 1 ? "dia" : "dias"}`}
              apoio={plano?.targetVestibular ?? undefined}
              icone={Target}
            />
          )}
        </div>
      )}

      <CalendarView eventos={eventos} />
    </PageShell>
  );
}
