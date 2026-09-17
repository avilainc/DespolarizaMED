"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { avisarAlunosDoPlantao, excluirPalestra, excluirPlantao } from "../actions";

export function DeleteLiveButton({ id, tipo }: { id: string; tipo: "plantao" | "palestra" }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, startTransition] = useTransition();

  if (!confirmando) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(true)} aria-label="Excluir">
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
        onClick={() =>
          startTransition(async () => {
            if (tipo === "plantao") await excluirPlantao(id);
            else await excluirPalestra(id);
          })
        }
      >
        {pendente ? <Loader2 className="animate-spin" /> : "Sim"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)} disabled={pendente}>
        Não
      </Button>
    </span>
  );
}

export function NotifyButton({ id }: { id: string }) {
  const [pendente, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  if (resultado) return <span className="text-xs text-muted-foreground">{resultado}</span>;

  if (!confirmando) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirmando(true)}>
        <Mail data-icon="inline-start" /> Avisar alunos
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">E-mail para todos os assinantes?</span>
      <Button
        size="sm"
        disabled={pendente}
        onClick={() =>
          startTransition(async () => {
            const r = await avisarAlunosDoPlantao(id);
            setResultado(r.ok ? `${r.dados.enviados} e-mails enviados` : r.erro);
          })
        }
      >
        {pendente ? <Loader2 className="animate-spin" /> : "Enviar"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)} disabled={pendente}>
        Não
      </Button>
    </span>
  );
}
