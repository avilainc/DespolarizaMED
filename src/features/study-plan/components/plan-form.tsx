"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  Clock3,
  GraduationCap,
  ListChecks,
  Loader2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, OptionCard, SelectField, TextField } from "@/components/ui/field";
import { visualDaMateria } from "@/lib/materias";
import { salvarPlano } from "../actions";

const VESTIBULARES = ["ENEM", "FUVEST", "UNICAMP", "UNESP", "FAMERP", "FAMEMA", "UFSCar", "Outro"];

const ETAPAS = [
  { numero: 1, titulo: "Vestibular", icone: GraduationCap },
  { numero: 2, titulo: "Data da prova", icone: CalendarDays },
  { numero: 3, titulo: "Disponibilidade", icone: Clock3 },
  { numero: 4, titulo: "Prioridades", icone: Target },
];

/**
 * Formulário do plano de estudos.
 *
 * Continua sendo UM formulário enviado de uma vez — quebrar em quatro telas
 * com estado entre elas seria trocar um problema visual por um problema de
 * dados, e são só quatro campos. O que mudou é a leitura: cada etapa é uma
 * seção numerada, com ícone e uma frase explicando por que a pergunta existe.
 * Antes eram quatro `<input>` de 32px em duas colunas, indistinguíveis de um
 * cadastro de sistema interno.
 *
 * As disciplinas difíceis usam cartão com ícone e cor da matéria, e não
 * "pílulas" de texto: é a mesma linguagem visual do resto da plataforma, e o
 * alvo de toque passa de 26px para 44px.
 */
export function PlanForm({
  disciplinas,
  inicial,
}: {
  disciplinas: { id: number; name: string; slug?: string }[];
  inicial?: {
    targetVestibular: string | null;
    examDate: string | null;
    daysPerWeek: number | null;
    hoursPerDay: number | null;
  } | null;
}) {
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await salvarPlano(form);
      if (!r.ok) setErro(r.erro);
    });
  }

  // A data mínima é amanhã: um cronograma até uma prova que já passou não
  // gera item nenhum, e o aluno ficaria olhando uma semana vazia sem entender.
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  return (
    <form onSubmit={enviar} className="space-y-8">
      <Etapa etapa={ETAPAS[0]} descricao="Define o formato da prova e o peso das matérias.">
        <Field rotulo="Vestibular pretendido" obrigatorio htmlFor="targetVestibular">
          <TextField
            id="targetVestibular"
            name="targetVestibular"
            list="vestibulares"
            defaultValue={inicial?.targetVestibular ?? ""}
            required
            maxLength={80}
            placeholder="FUVEST"
            autoComplete="off"
          />
        </Field>
        <datalist id="vestibulares">
          {VESTIBULARES.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </Etapa>

      <Etapa
        etapa={ETAPAS[1]}
        descricao="É a partir dela que o cronograma distribui as aulas e as revisões."
      >
        <Field rotulo="Data da prova" obrigatorio htmlFor="examDate">
          <TextField
            id="examDate"
            name="examDate"
            type="date"
            min={amanha.toISOString().slice(0, 10)}
            defaultValue={inicial?.examDate ?? ""}
            required
          />
        </Field>
      </Etapa>

      <Etapa
        etapa={ETAPAS[2]}
        descricao="Seja honesto: um plano de 6 horas por dia que você não cumpre vale menos que um de 2 horas que você cumpre."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field rotulo="Dias de estudo por semana" obrigatorio htmlFor="daysPerWeek">
            <SelectField
              id="daysPerWeek"
              name="daysPerWeek"
              defaultValue={String(inicial?.daysPerWeek ?? 5)}
              required
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "dia por semana" : "dias por semana"}
                </option>
              ))}
            </SelectField>
          </Field>

          <Field rotulo="Horas por dia" obrigatorio htmlFor="hoursPerDay">
            <SelectField
              id="hoursPerDay"
              name="hoursPerDay"
              defaultValue={String(inicial?.hoursPerDay ?? 3)}
              required
            >
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "hora por dia" : "horas por dia"}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      </Etapa>

      {disciplinas.length > 0 && (
        <Etapa
          etapa={ETAPAS[3]}
          descricao="As disciplinas marcadas aparecem com o dobro da frequência no cronograma."
        >
          <fieldset>
            <legend className="t-label mb-2">Disciplinas com mais dificuldade</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {disciplinas.map((d) => {
                const visual = visualDaMateria(d.slug ?? d.name);
                return (
                  <OptionCard
                    key={d.id}
                    tipo="checkbox"
                    name="disciplinasDificeis"
                    value={String(d.id)}
                    icone={visual.icone}
                    cor={visual.cor}
                  >
                    {d.name}
                  </OptionCard>
                );
              })}
            </div>
          </fieldset>
        </Etapa>
      )}

      {erro && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-[0.875rem] text-danger-text">
          {erro}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" variant="brand" disabled={pendente}>
          {pendente ? (
            <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
          ) : (
            <ListChecks data-icon="inline-start" aria-hidden />
          )}
          {inicial ? "Refazer cronograma" : "Montar meu cronograma"}
        </Button>
        {inicial && (
          <p className="t-meta max-w-prose">
            Refazer substitui os itens pendentes de hoje em diante; o que você já concluiu fica.
          </p>
        )}
      </div>
    </form>
  );
}

/** Uma etapa do formulário: número, ícone, título e a razão da pergunta. */
function Etapa({
  etapa,
  descricao,
  children,
}: {
  etapa: (typeof ETAPAS)[number];
  descricao: string;
  children: React.ReactNode;
}) {
  const Icone = etapa.icone;
  return (
    <section>
      <div className="mb-3 flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display text-[0.9375rem] font-semibold text-brand-700"
        >
          {etapa.numero}
        </span>
        <div className="min-w-0">
          <h3 className="t-card-title flex items-center gap-2 text-text-primary">
            <Icone aria-hidden className="size-4 text-brand-600" />
            {etapa.titulo}
          </h3>
          <p className="t-meta mt-0.5 max-w-[60ch]">{descricao}</p>
        </div>
      </div>
      <div className="sm:pl-12">{children}</div>
    </section>
  );
}
