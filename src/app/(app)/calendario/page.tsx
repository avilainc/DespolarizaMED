import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CalendarClock, CalendarDays, GraduationCap } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { diaParaData } from "@/lib/datas";
import { itensDoPeriodo, planoDoAluno } from "@/features/study-plan/queries";
import { palestrasNoPeriodo, plantoesNoPeriodo } from "@/features/live/queries";
import { CalendarView, type EventoCalendario } from "@/features/study-plan/components/calendar-view";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Calendário — DespolarizaMED" };

function quandoCurto(d: Date, agora: Date) {
  const mesmoDia = d.toDateString() === agora.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (mesmoDia) return `Hoje, ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}, ${hora}`;
}

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

  // Cartões do topo: só aparecem quando há dado real por trás. Um cartão
  // "Próxima atividade — —" é pior que nenhum cartão.
  const agora = new Date();
  const hoje = itens.filter(
    (i) => i.scheduledFor.toDateString() === agora.toDateString() && !i.completed,
  );
  const proximoPlantao = plantoes.find((p) => p.startsAt.getTime() > agora.getTime());
  const diasParaProva = plano?.examDate
    ? Math.ceil((diaParaData(plano.examDate).getTime() - agora.getTime()) / 86_400_000)
    : null;

  return (
    <>
      <PageHeader
        titulo="Calendário"
        descricao="Seu cronograma, plantões, palestras e provas em um só lugar."
        acoes={
          !plano ? (
            <Link href="/plano" className={buttonVariants()}>
              <CalendarCheck data-icon="inline-start" aria-hidden />
              Montar plano de estudos
            </Link>
          ) : undefined
        }
      />

      {(hoje.length > 0 || proximoPlantao || diasParaProva !== null) && (
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hoje.length > 0 && (
            <MetricCard
              icone={CalendarDays}
              rotulo="Hoje"
              valor={hoje.length}
              apoio={`${hoje.length === 1 ? "item pendente" : "itens pendentes"} no plano`}
              href="/plano"
            />
          )}
          {proximoPlantao && (
            <MetricCard
              icone={CalendarClock}
              rotulo="Próximo plantão"
              valor={
                <span className="text-[1.25rem] leading-snug">{proximoPlantao.title}</span>
              }
              apoio={quandoCurto(proximoPlantao.startsAt, agora)}
              href="/plantoes"
            />
          )}
          {diasParaProva !== null && plano && (
            <MetricCard
              icone={GraduationCap}
              rotulo={`Prova · ${plano.targetVestibular ?? "vestibular"}`}
              valor={diasParaProva}
              apoio={diasParaProva === 1 ? "dia" : "dias"}
              href="/plano"
              tom={diasParaProva <= 30 ? "atencao" : "neutro"}
            />
          )}
        </div>
      )}

      {eventos.length === 0 ? (
        <EmptyState
          ilustracao="/illustrations/vazio-calendario.svg"
          titulo="Nada marcado ainda"
          descricao="Monte seu plano de estudos e o cronograma aparece aqui, junto dos plantões, das palestras e da data da sua prova."
          acao={
            <Link href="/plano" className={buttonVariants()}>
              <CalendarCheck data-icon="inline-start" aria-hidden />
              Montar plano de estudos
            </Link>
          }
        />
      ) : (
        <CalendarView eventos={eventos} />
      )}
    </>
  );
}
