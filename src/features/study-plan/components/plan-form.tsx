"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { salvarPlano } from "../actions";

const VESTIBULARES = ["ENEM", "FUVEST", "UNICAMP", "UNESP", "FAMERP", "FAMEMA", "UFSCar", "Outro"];

export function PlanForm({
  disciplinas,
  inicial,
}: {
  disciplinas: { id: number; name: string }[];
  inicial?: {
    targetVestibular: string | null;
    examDate: Date | null;
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

  const dataInicial = inicial?.examDate ? new Date(inicial.examDate).toISOString().slice(0, 10) : "";

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="targetVestibular">Vestibular pretendido</Label>
          <Input id="targetVestibular" name="targetVestibular" list="vestibulares" defaultValue={inicial?.targetVestibular ?? ""} required maxLength={80} placeholder="FUVEST" />
          <datalist id="vestibulares">
            {VESTIBULARES.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="examDate">Data da prova</Label>
          <Input id="examDate" name="examDate" type="date" defaultValue={dataInicial} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="daysPerWeek">Dias de estudo por semana</Label>
          <Input id="daysPerWeek" name="daysPerWeek" type="number" min={1} max={7} defaultValue={inicial?.daysPerWeek ?? 5} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hoursPerDay">Horas por dia</Label>
          <Input id="hoursPerDay" name="hoursPerDay" type="number" min={0.5} max={12} step={0.5} defaultValue={inicial?.hoursPerDay ?? 3} required />
        </div>
      </div>

      {disciplinas.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Disciplinas com mais dificuldade</legend>
          <p className="text-xs text-muted-foreground">Elas aparecem com o dobro da frequência no cronograma.</p>
          <div className="flex flex-wrap gap-2">
            {disciplinas.map((d) => (
              <label key={d.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm has-checked:border-primary has-checked:bg-primary/10">
                <input type="checkbox" name="disciplinasDificeis" value={d.id} className="accent-primary" />
                {d.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <Button type="submit" disabled={pendente}>
        {pendente && <Loader2 className="animate-spin" data-icon="inline-start" />}
        {inicial ? "Refazer cronograma" : "Montar meu cronograma"}
      </Button>
      {inicial && (
        <p className="text-xs text-muted-foreground">
          Refazer substitui os itens pendentes de hoje em diante; o que você já concluiu fica.
        </p>
      )}
    </form>
  );
}
