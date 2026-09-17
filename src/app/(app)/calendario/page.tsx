import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { diaParaData } from "@/lib/datas";
import { itensDoPeriodo, planoDoAluno } from "@/features/study-plan/queries";
import { palestrasNoPeriodo, plantoesNoPeriodo } from "@/features/live/queries";
import { CalendarView, type EventoCalendario } from "@/features/study-plan/components/calendar-view";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
          <p className="mt-1 text-muted-foreground">
            Plano de estudos, plantões, palestras e a data da sua prova, tudo junto.
          </p>
        </div>
        {!plano && (
          <Link href="/plano" className="text-sm text-primary hover:underline">
            Montar plano de estudos →
          </Link>
        )}
      </div>
      <div className="mt-6">
        <CalendarView eventos={eventos} />
      </div>
    </div>
  );
}
