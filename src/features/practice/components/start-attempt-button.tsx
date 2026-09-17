"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { iniciarTentativa } from "../actions";

export function StartAttemptButton({ documentId, retomar }: { documentId: string; retomar: boolean }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function iniciar() {
    setErro(null);
    startTransition(async () => {
      const r = await iniciarTentativa(documentId);
      if (r.ok) router.push(`/provas/${documentId}/${r.dados.attemptId}`);
      else setErro(r.erro);
    });
  }

  return (
    <div>
      <Button size="lg" onClick={iniciar} disabled={pendente}>
        {pendente ? <Loader2 className="animate-spin" /> : <Play data-icon="inline-start" />}
        {retomar ? "Continuar prova" : "Iniciar prova"}
      </Button>
      {erro && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
