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

  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2">
      <button
        type="button"
        onClick={alternar}
        disabled={pendente}
        aria-pressed={feito}
        aria-label={feito ? "Desmarcar" : "Concluir"}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
          feito ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
        }`}
      >
        {pendente ? <Loader2 className="size-3 animate-spin" /> : feito ? <Check className="size-3" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <span className="mr-2 text-xs text-muted-foreground">{item.hora}</span>
        {item.href ? (
          <Link href={item.href} className={`text-sm hover:underline ${feito ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {item.title}
          </Link>
        ) : (
          <span className={`text-sm ${feito ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.title}</span>
        )}
      </div>
    </li>
  );
}
