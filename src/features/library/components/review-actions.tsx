"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Undo2, X } from "lucide-react";
import { aprovarQuestao, corrigirGabarito, reabrirQuestao, rejeitarQuestao } from "../actions";

export function ReviewActions({
  id,
  alternativas,
  gabaritoAtual,
  validada,
}: {
  id: string;
  alternativas: { letra: string; texto: string }[];
  gabaritoAtual: string | null;
  validada: boolean;
}) {
  const [letra, setLetra] = useState(gabaritoAtual?.toUpperCase() ?? "");
  const [nota, setNota] = useState("");
  const [pendente, startTransition] = useTransition();
  const [feito, setFeito] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function executar(fn: () => Promise<{ ok: true; dados: unknown } | { ok: false; erro: string }>, rotulo: string) {
    setErro(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) setFeito(rotulo);
      else setErro(r.erro);
    });
  }

  if (feito) {
    return (
      <p className="text-sm text-primary" data-testid="review-feito">
        <Check className="mr-1 inline size-4" /> {feito}
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-dashed border-border p-3" data-testid="review-actions">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor={`gab-${id}`}>
          Gabarito
        </label>
        <select
          id={`gab-${id}`}
          value={letra}
          onChange={(e) => setLetra(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          data-testid="review-letra"
        >
          <option value="">—</option>
          {alternativas.map((a) => (
            <option key={a.letra} value={a.letra.toUpperCase()}>
              {a.letra.toUpperCase()}) {a.texto.slice(0, 40)}
            </option>
          ))}
        </select>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="observação (opcional)"
          maxLength={500}
          className="h-8 min-w-48 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
          data-testid="review-nota"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={pendente || !letra}
          onClick={() => executar(() => corrigirGabarito({ id, letra, nota }), `gabarito ${letra} confirmado e questão aprovada`)}
          data-testid="review-corrigir"
        >
          {pendente ? <Loader2 className="animate-spin" /> : <Check data-icon="inline-start" />}
          {letra && letra !== (gabaritoAtual ?? "").toUpperCase() ? `Corrigir para ${letra} e aprovar` : "Confirmar gabarito e aprovar"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pendente || !gabaritoAtual}
          onClick={() => executar(() => aprovarQuestao({ id, nota }), "aprovada como está")}
          data-testid="review-aprovar"
          title={gabaritoAtual ? "" : "Sem gabarito: escolha a letra e use Corrigir"}
        >
          Aprovar como está
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pendente}
          onClick={() => executar(() => rejeitarQuestao({ id, nota }), "rejeitada")}
          data-testid="review-rejeitar"
        >
          <X data-icon="inline-start" /> Rejeitar
        </Button>
        {validada && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pendente}
            onClick={() => executar(() => reabrirQuestao({ id, nota }), "reaberta para revisão")}
          >
            <Undo2 data-icon="inline-start" /> Reabrir
          </Button>
        )}
      </div>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
