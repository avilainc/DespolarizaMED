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
      title={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      // Alvo de 36px mesmo quando é só o ícone: 24px é menor que o mínimo
      // confortável de toque, e esta estrela aparece no meio de listas densas.
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[0.875rem] font-medium text-text-muted transition-colors hover:bg-surface-subtle hover:text-warning-text disabled:opacity-50 ${
        rotulo ? "px-3" : "w-9 justify-center"
      }`}
    >
      {/* A cor de "favoritado" é o `--warning` da marca, não um amber solto do
          Tailwind: é a mesma cor da estrela em todo o produto. */}
      <Star
        aria-hidden
        className={`size-[1.125rem] shrink-0 ${favorito ? "fill-warning text-warning" : ""}`}
      />
      {rotulo}
    </button>
  );
}
