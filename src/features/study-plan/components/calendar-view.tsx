"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

export type EventoCalendario = {
  id: string;
  title: string;
  start: string;
  end: string;
  tipo: "PLANO" | "PLANTAO" | "PALESTRA" | "PROVA";
  href: string | null;
  concluido?: boolean;
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales: { "pt-BR": ptBR },
});

const MENSAGENS = {
  today: "Hoje",
  previous: "Anterior",
  next: "Próximo",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Nada neste período.",
  showMore: (n: number) => `+${n} mais`,
};

/**
 * Cor por tipo de evento, como variável do tema em vez de hex solto.
 * Reaproveita as cores que já existem: o azul institucional para o plano, e
 * as de matéria para plantão e palestra, para o calendário não introduzir uma
 * paleta própria que não aparece em nenhum outro lugar do produto.
 */
const COR: Record<EventoCalendario["tipo"], string> = {
  PLANO: "var(--primary)",
  PLANTAO: "var(--brand-blue)",
  PALESTRA: "var(--subject-fisica)",
  PROVA: "var(--destructive)",
};

const ROTULO: Record<EventoCalendario["tipo"], string> = {
  PLANO: "Plano de estudos",
  PLANTAO: "Plantão",
  PALESTRA: "Palestra",
  PROVA: "Prova",
};

export function CalendarView({ eventos }: { eventos: EventoCalendario[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [data, setData] = useState(new Date());

  /**
   * No celular a visão de mês vira uma grade de 7 colunas com 2mm cada, onde
   * nenhum evento cabe. A tela pequena abre em agenda, que é lista, e o aluno
   * troca para mês se quiser.
   *
   * A decisão roda depois da montagem (e não em `useState`) porque `window`
   * não existe na renderização do servidor, e um valor inicial diferente
   * entre servidor e cliente quebraria a hidratação.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) setView("agenda");
  }, []);

  const lista = useMemo(
    () => eventos.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })),
    [eventos],
  );

  return (
    <div className="calendario rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/8">
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {(Object.keys(COR) as EventoCalendario["tipo"][]).map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: COR[t] }} aria-hidden />
            {ROTULO[t]}
          </li>
        ))}
      </ul>
      <Calendar
        localizer={localizer}
        culture="pt-BR"
        events={lista}
        view={view}
        onView={setView}
        date={data}
        onNavigate={setData}
        views={["month", "week", "agenda"]}
        messages={MENSAGENS}
        popup
        style={{ height: 640 }}
        eventPropGetter={(e) => ({
          style: {
            backgroundColor: COR[e.tipo],
            borderColor: COR[e.tipo],
            // Item do plano já concluído continua visível, mas apagado e
            // riscado: some da atenção sem sumir do histórico da semana.
            opacity: e.concluido ? 0.45 : 1,
            textDecoration: e.concluido ? "line-through" : undefined,
          },
        })}
        onSelectEvent={(e) => {
          if (e.href) router.push(e.href);
        }}
      />
    </div>
  );
}
