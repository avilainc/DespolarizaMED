"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
// O CSS da biblioteca e o tema da marca vivem em globals.css, em camadas
// distintas — ver o comentario do import la.

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
 * As quatro categorias, com a cor e o rótulo num lugar só. As cores vêm dos
 * tokens da marca — antes eram hex soltos (#0ea5e9, #8b5cf6, #ef4444) que não
 * existiam em nenhuma outra tela do produto.
 */
const CATEGORIAS: Record<EventoCalendario["tipo"], { cor: string; rotulo: string }> = {
  PLANO: { cor: "var(--brand-600)", rotulo: "Plano de estudos" },
  PLANTAO: { cor: "var(--materia-fis)", rotulo: "Plantão" },
  PALESTRA: { cor: "var(--materia-quim)", rotulo: "Palestra" },
  PROVA: { cor: "var(--danger)", rotulo: "Prova" },
};

/**
 * O calendário.
 *
 * A biblioteca (react-big-calendar) traz um CSS de 2016 que não conversa com
 * nenhum token do produto; o tema vive em `globals.css`, sob
 * `.calendario-marca`, e não aqui em trinta modificadores `[&_.rbc-*]`
 * empilhados numa `className` — daquele jeito, nenhuma das regras era
 * localizável quando algo saía do lugar.
 *
 * A visão inicial depende da largura: o mês com 42 células numa tela de 390px
 * dá células de 50px, que não cabem nem a hora do evento. No celular a visão
 * padrão é a agenda, que é uma lista — legível de verdade. A troca acontece só
 * na montagem para não sobrescrever a escolha de quem mudar a visão à mão.
 */
export function CalendarView({ eventos }: { eventos: EventoCalendario[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [data, setData] = useState(new Date());

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setView("agenda");
  }, []);

  const lista = useMemo(
    () => eventos.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })),
    [eventos],
  );

  return (
    <div className="calendario-marca">
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {(Object.keys(CATEGORIAS) as EventoCalendario["tipo"][]).map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 text-[0.8125rem] text-text-secondary"
          >
            <span
              aria-hidden
              className="inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: CATEGORIAS[t].cor }}
            />
            {CATEGORIAS[t].rotulo}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 shadow-xs sm:p-4">
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
          style={{ height: 660 }}
          eventPropGetter={(e) => ({
            // A agenda recebe um estilo diferente do mês/semana porque a
            // biblioteca aplica isto na LINHA inteira da tabela: pintar o
            // fundo ali cobriria também as colunas de data e hora. Na agenda a
            // cor vira `currentColor`, que a borda esquerda da linha usa (ver
            // `.rbc-agenda-view` em globals.css); no mês e na semana ela
            // continua sendo o fundo da etiqueta.
            style:
              view === "agenda"
                ? {
                    color: CATEGORIAS[e.tipo].cor,
                    opacity: e.concluido ? 0.55 : 1,
                    textDecoration: e.concluido ? "line-through" : undefined,
                  }
                : {
                    backgroundColor: CATEGORIAS[e.tipo].cor,
                    color: "white",
                    // Item do plano já concluído fica apagado E riscado: só a
                    // opacidade não distingue "feito" de "cancelado".
                    opacity: e.concluido ? 0.45 : 1,
                    textDecoration: e.concluido ? "line-through" : undefined,
                  },
          })}
          onSelectEvent={(e) => {
            if (e.href) router.push(e.href);
          }}
        />
      </div>
    </div>
  );
}
