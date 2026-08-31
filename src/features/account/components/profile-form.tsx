"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alterarNome } from "../actions";
import { Loader2, Check } from "lucide-react";

export function ProfileForm({ nomeInicial }: { nomeInicial: string }) {
  const [nome, setNome] = useState(nomeInicial);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const mudou = nome.trim() !== nomeInicial;

  function salvar(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvo(false);

    startTransition(async () => {
      const form = new FormData();
      form.set("nome", nome);
      const r = await alterarNome(form);
      if (r.ok) setSalvo(true);
      else setErro(r.erro);
    });
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setSalvo(false);
          }}
          maxLength={120}
          required
        />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pendente || !mudou}>
          {pendente && <Loader2 className="mr-2 size-4 animate-spin" />}
          Salvar
        </Button>
        {salvo && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Check className="size-4" aria-hidden /> Salvo
          </span>
        )}
      </div>
    </form>
  );
}
