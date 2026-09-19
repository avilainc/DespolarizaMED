"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubjectIcon } from "@/components/subject-icon";
import { IllustrationCalendar } from "@/components/illustrations";
import { cn } from "@/lib/utils";
import { salvarPlano } from "../actions";

const VESTIBULARES = ["ENEM", "FUVEST", "UNICAMP", "UNESP", "FAMERP", "FAMEMA", "UFSCar", "Outro"];

const ETAPAS = [
  { id: 1, rotulo: "Vestibular" },
  { id: 2, rotulo: "Data" },
  { id: 3, rotulo: "Disponibilidade" },
  { id: 4, rotulo: "Prioridades" },
] as const;

/**
 * Montagem do plano em etapas.
 *
 * Era um formulário de quatro campos empilhados com cara de cadastro
 * administrativo: o aluno via "targetVestibular", "daysPerWeek" e um
 * checkbox list de uma vez, sem entender o que sairia disso. Agora são
 * quatro perguntas, uma por vez, com a explicação ao lado de cada uma.
 *
 * Todos os campos ficam montados o tempo inteiro, só escondidos por CSS:
 * desmontar a etapa anterior tiraria o campo do FormData e o envio chegaria
 * pela metade.
 */
export function PlanForm({
  disciplinas,
  inicial,
}: {
  disciplinas: { id: number; name: string }[];
  inicial?: {
    targetVestibular: string | null;
    examDate: string | null;
    daysPerWeek: number | null;
    hoursPerDay: number | null;
  } | null;
}) {
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const ultima = disciplinas.length > 0 ? 4 : 3;

  /**
   * Validação por etapa, na mão.
   *
   * O formulário leva `noValidate` porque as etapas escondidas continuam no
   * DOM com os campos obrigatórios dentro: a validação nativa tentaria focar
   * um campo com `display: none` e o navegador recusa o envio sem dizer o
   * porquê ("An invalid form control is not focusable"). Então cada etapa
   * valida só os próprios campos, no momento de avançar.
   */
  function etapaValida(n: number) {
    const bloco = formRef.current?.querySelector<HTMLElement>(`[data-etapa="${n}"]`);
    if (!bloco) return true;
    const campos = bloco.querySelectorAll<HTMLInputElement>("input, select, textarea");
    for (const campo of campos) {
      if (!campo.checkValidity()) {
        campo.reportValidity();
        return false;
      }
    }
    return true;
  }

  function avancar() {
    if (!etapaValida(etapa)) return;
    setEtapa((n) => n + 1);
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    // Revalida tudo: o aluno pode ter voltado e apagado um campo de uma
    // etapa anterior antes de enviar.
    for (let n = 1; n <= ultima; n++) {
      if (!etapaValida(n)) {
        setEtapa(n);
        return;
      }
    }
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await salvarPlano(form);
      if (!r.ok) setErro(r.erro);
    });
  }

  return (
    <form ref={formRef} onSubmit={enviar} noValidate className="grid gap-8 lg:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2">
          {ETAPAS.filter((e) => e.id <= ultima).map((e) => {
            const feita = etapa > e.id;
            const atual = etapa === e.id;
            return (
              <li key={e.id} className="flex items-center gap-2">
                <button
                  type="button"
                  // Voltar a uma etapa já respondida é livre; pular adiante
                  // não, porque a etapa seguinte depende do que veio antes.
                  onClick={() => feita && setEtapa(e.id)}
                  disabled={!feita && !atual}
                  aria-current={atual ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-sm font-medium transition-colors",
                    atual
                      ? "bg-primary/10 text-primary"
                      : feita
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      atual ? "bg-primary text-primary-foreground" : feita ? "bg-emerald-600 text-white" : "bg-muted",
                    )}
                    aria-hidden
                  >
                    {feita ? <Check className="size-3.5" strokeWidth={3} /> : e.id}
                  </span>
                  <span className="max-sm:sr-only">{e.rotulo}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <Etapa numero={1} ativa={etapa === 1} titulo="Qual vestibular você vai prestar?" ajuda="É por ele que o cronograma calcula o tempo que falta.">
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="targetVestibular">Vestibular pretendido</Label>
            <Input
              id="targetVestibular"
              name="targetVestibular"
              list="vestibulares"
              defaultValue={inicial?.targetVestibular ?? ""}
              required
              maxLength={80}
              placeholder="FUVEST"
            />
            <datalist id="vestibulares">
              {VESTIBULARES.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
        </Etapa>

        <Etapa numero={2} ativa={etapa === 2} titulo="Quando é a prova?" ajuda="O cronograma vai da data de hoje até esse dia, sem passar dele.">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="examDate">Data da prova</Label>
            <Input id="examDate" name="examDate" type="date" defaultValue={inicial?.examDate ?? ""} required />
          </div>
        </Etapa>

        <Etapa
          numero={3}
          ativa={etapa === 3}
          titulo="Quanto tempo você tem por semana?"
          ajuda="Seja realista. Um cronograma que você não consegue cumprir vira culpa, não plano."
        >
          <div className="grid max-w-md gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="daysPerWeek">Dias de estudo por semana</Label>
              <Input
                id="daysPerWeek"
                name="daysPerWeek"
                type="number"
                min={1}
                max={7}
                defaultValue={inicial?.daysPerWeek ?? 5}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hoursPerDay">Horas por dia</Label>
              <Input
                id="hoursPerDay"
                name="hoursPerDay"
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                defaultValue={inicial?.hoursPerDay ?? 3}
                required
              />
            </div>
          </div>
        </Etapa>

        {disciplinas.length > 0 && (
          <Etapa
            numero={4}
            ativa={etapa === 4}
            titulo="Onde você tem mais dificuldade?"
            ajuda="As disciplinas marcadas aparecem com o dobro da frequência no cronograma. Pode deixar em branco."
          >
            <fieldset>
              <legend className="sr-only">Disciplinas com mais dificuldade</legend>
              <div className="flex flex-wrap gap-2">
                {disciplinas.map((d) => (
                  <label
                    key={d.id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card py-2 pr-4 pl-2 text-sm font-medium transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary/10"
                  >
                    <input type="checkbox" name="disciplinasDificeis" value={d.id} className="sr-only" />
                    <SubjectIcon disciplina={d.name} size="sm" />
                    {d.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </Etapa>
        )}

        {erro && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {etapa > 1 && (
            <Button type="button" variant="outline" onClick={() => setEtapa((n) => n - 1)}>
              <ArrowLeft />
              Voltar
            </Button>
          )}
          {etapa < ultima ? (
            <Button type="button" onClick={avancar}>
              Continuar
              <ArrowRight />
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={pendente}>
              {pendente && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {inicial ? "Refazer cronograma" : "Montar meu cronograma"}
            </Button>
          )}
        </div>

        {inicial && etapa === ultima && (
          <p className="mt-3 text-xs text-muted-foreground">
            Refazer substitui os itens pendentes de hoje em diante; o que você já concluiu fica.
          </p>
        )}
      </div>

      <IllustrationCalendar
        className="hidden h-44 w-auto self-start text-primary/25 lg:block"
        aria-hidden
      />
    </form>
  );
}

function Etapa({
  numero,
  ativa,
  titulo,
  ajuda,
  children,
}: {
  numero: number;
  ativa: boolean;
  titulo: string;
  ajuda: string;
  children: React.ReactNode;
}) {
  return (
    <div data-etapa={numero} className={cn(!ativa && "hidden")} aria-hidden={!ativa}>
      <h3 className="font-heading text-xl leading-snug font-semibold text-foreground">{titulo}</h3>
      <p className="mt-1.5 max-w-lg text-[0.9375rem] leading-relaxed text-muted-foreground">{ajuda}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
