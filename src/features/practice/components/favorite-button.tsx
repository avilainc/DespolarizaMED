"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { alternarFavorito } from "../actions";

export function FavoriteButton({
  tipo,
  id,
  inicial,
  rotulo,
}: {
  tipo: "QUESTION" | "GLOSSARY_TERM" | "LESSON";
  id: string;
  inicial: boolean;
  rotulo?: string;
}) {
  const [favorito, setFavorito] = useState(inicial);
  const [pendente, startTransition] = useTransition();

  function alternar() {
    startTransition(async () => {
      const r = await alternarFavorito({ tipo, id });
      if (r.ok) setFavorito(r.dados.favorito);
    });
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendente}
      aria-pressed={favorito}
      aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className="inline-flex items-center gap-1.5 rounded-md p-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      <Star className={`size-4 ${favorito ? "fill-amber-400 text-amber-400" : ""}`} />
      {rotulo}
    </button>
  );
}
