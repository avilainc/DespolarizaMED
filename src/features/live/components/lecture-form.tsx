"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { salvarPalestra } from "../actions";

function paraInputLocal(d: Date | null | undefined) {
  if (!d) return "";
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
}

export function LectureForm({
  inicial,
}: {
  inicial?: {
    id: string;
    title: string;
    description: string | null;
    speaker: string | null;
    scheduledFor: Date | null;
    videoUrl: string | null;
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
      const r = await salvarPalestra(form);
      if (r.ok) router.push("/professor/plantoes");
      else setErro(r.erro);
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {inicial && <input type="hidden" name="id" value={inicial.id} />}
      <div className="space-y-1.5">
        <Label htmlFor="l-title">Título</Label>
        <Input id="l-title" name="title" defaultValue={inicial?.title ?? ""} required maxLength={140} placeholder="Como organizar os estudos" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="l-speaker">Palestrante</Label>
          <Input id="l-speaker" name="speaker" defaultValue={inicial?.speaker ?? ""} maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="l-scheduledFor">Data (vazio = já disponível)</Label>
          <Input id="l-scheduledFor" name="scheduledFor" type="datetime-local" defaultValue={paraInputLocal(inicial?.scheduledFor)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="l-description">Descrição</Label>
        <textarea
          id="l-description"
          name="description"
          defaultValue={inicial?.description ?? ""}
          rows={3}
          maxLength={2000}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="l-videoUrl">Link do vídeo ou do Meet</Label>
        <Input id="l-videoUrl" name="videoUrl" type="url" defaultValue={inicial?.videoUrl ?? ""} placeholder="https://…" />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {inicial ? "Salvar" : "Publicar palestra"}
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
