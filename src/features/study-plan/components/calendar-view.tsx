"use client";

import { useMemo, useState } from "react";
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

const COR: Record<EventoCalendario["tipo"], string> = {
  PLANO: "var(--primary)",
  PLANTAO: "#0ea5e9",
  PALESTRA: "#8b5cf6",
  PROVA: "#ef4444",
};

export function CalendarView({ eventos }: { eventos: EventoCalendario[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [data, setData] = useState(new Date());

  const lista = useMemo(
    () => eventos.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })),
    [eventos],
  );

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm [&_.rbc-toolbar_button]:rounded-md [&_.rbc-toolbar_button]:border-border [&_.rbc-toolbar_button]:text-foreground [&_.rbc-toolbar_button.rbc-active]:bg-primary [&_.rbc-toolbar_button.rbc-active]:text-primary-foreground [&_.rbc-off-range-bg]:bg-muted/40 [&_.rbc-today]:bg-primary/10 [&_.rbc-header]:border-border [&_.rbc-month-view]:border-border [&_.rbc-day-bg]:border-border [&_.rbc-time-view]:border-border">
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(COR) as EventoCalendario["tipo"][]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: COR[t] }} />
            {{ PLANO: "Plano de estudos", PLANTAO: "Plantão", PALESTRA: "Palestra", PROVA: "Prova" }[t]}
          </span>
        ))}
      </div>
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
            opacity: e.concluido ? 0.5 : 1,
            textDecoration: e.concluido ? "line-through" : undefined,
            fontSize: "0.75rem",
          },
        })}
        onSelectEvent={(e) => {
          if (e.href) router.push(e.href);
        }}
      />
    </div>
  );
}
