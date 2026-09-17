"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { salvarPlantao } from "../actions";

function paraInputLocal(d: Date | null | undefined) {
  if (!d) return "";
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
}

export function SessionForm({
  disciplinas,
  inicial,
}: {
  disciplinas: { id: number; name: string }[];
  inicial?: {
    id: string;
    title: string;
    description: string | null;
    subjectId: number | null;
    meetUrl: string | null;
    startsAt: Date;
    endsAt: Date;
    recordingUrl: string | null;
  } | null;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await salvarPlantao(form);
      if (r.ok) router.push("/professor/plantoes");
      else setErro(r.erro);
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {inicial && <input type="hidden" name="id" value={inicial.id} />}
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={inicial?.title ?? ""} required maxLength={140} placeholder="Plantão de Biologia: Genética" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Início</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={paraInputLocal(inicial?.startsAt)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endsAt">Fim</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={paraInputLocal(inicial?.endsAt)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subjectId">Disciplina</Label>
          <select
            id="subjectId"
            name="subjectId"
            defaultValue={inicial?.subjectId ?? ""}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Geral</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meetUrl">Link do Google Meet</Label>
          <Input id="meetUrl" name="meetUrl" type="url" defaultValue={inicial?.meetUrl ?? ""} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Tema / descrição</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={inicial?.description ?? ""}
          rows={3}
          maxLength={2000}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          placeholder="Genética e Biologia Molecular: dúvidas da lista 3"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="recordingUrl">Gravação (depois do plantão)</Label>
        <Input id="recordingUrl" name="recordingUrl" type="url" defaultValue={inicial?.recordingUrl ?? ""} placeholder="https://…" />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {inicial ? "Salvar" : "Agendar plantão"}
        </Button>
        {inicial && (
          <Button type="button" variant="ghost" onClick={() => router.push("/professor/plantoes")} disabled={pendente}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
