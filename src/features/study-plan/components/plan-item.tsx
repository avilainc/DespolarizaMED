"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";

import { alternarItemDoPlano } from "../actions";

export function PlanItem({
  item,
}: {
  item: {
    id: string;
    title: string;
    hora: string;
    completed: boolean;
    href: string | null;
    /** Cor da matéria do item, quando ele tem disciplina. */
    cor?: string;
  };
}) {
  const [feito, setFeito] = useState(item.completed);
  const [pendente, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      const r = await alternarItemDoPlano(item.id);
      if (r.ok) setFeito(r.dados.completed);
    });
  }

  const cor = item.cor ?? "var(--brand-500)";

  return (
    <li className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:border-brand-200">
      {/* Alvo de 24px com área de toque de 36px: a caixa de 20px anterior era
          difícil de acertar no celular, que é onde o aluno marca o item. */}
      <button
        type="button"
        onClick={alternar}
        disabled={pendente}
        aria-pressed={feito}
        aria-label={feito ? `Desmarcar ${item.title}` : `Concluir ${item.title}`}
        className="-m-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-surface-subtle disabled:opacity-60"
      >
        <span
          aria-hidden
          className="flex size-5 items-center justify-center rounded-md border transition-colors"
          style={
            feito
              ? { borderColor: cor, background: cor, color: "white" }
              : { borderColor: "var(--border-strong)" }
          }
        >
          {pendente ? (
            <Loader2 className="size-3 animate-spin text-text-muted" />
          ) : feito ? (
            <Check className="size-3.5" strokeWidth={3} />
          ) : null}
        </span>
      </button>

      <span className="min-w-0 flex-1">
        <span className="t-meta tabular mr-2">{item.hora}</span>
        {item.href ? (
          <Link
            href={item.href}
            className={`text-[0.875rem] hover:underline ${
              feito ? "text-text-muted line-through" : "text-text-primary"
            }`}
          >
            {item.title}
          </Link>
        ) : (
          <span
            className={`text-[0.875rem] ${feito ? "text-text-muted line-through" : "text-text-primary"}`}
          >
            {item.title}
          </span>
        )}
      </span>
    </li>
  );
}
