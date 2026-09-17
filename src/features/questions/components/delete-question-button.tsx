"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { excluirQuestao } from "../actions";

export function DeleteQuestionButton({ id }: { id: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, startTransition] = useTransition();

  if (!confirmando) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(true)} aria-label="Excluir questão">
        <Trash2 />
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">Excluir?</span>
      <Button
        variant="destructive"
        size="sm"
        disabled={pendente}
        onClick={() => startTransition(async () => void (await excluirQuestao(id)))}
      >
        {pendente ? <Loader2 className="animate-spin" /> : "Sim"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)} disabled={pendente}>
        Não
      </Button>
    </span>
  );
}
