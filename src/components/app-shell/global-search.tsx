"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Suspense, useState } from "react";

/**
 * Busca global do cabeçalho.
 *
 * Envia para /busca por GET, mantendo o termo na URL — a mesma decisão dos
 * filtros do banco de questões, e o que permite compartilhar um resultado.
 * No celular o campo vira só o ícone, que leva para a central de busca: um
 * campo de texto no cabeçalho de 390px espreme a marca e o avatar.
 */
function CampoBusca() {
  const router = useRouter();
  const params = useSearchParams();
  const [termo, setTermo] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(termo.trim() ? `/busca?q=${encodeURIComponent(termo.trim())}` : "/busca");
      }}
      className="relative hidden w-full max-w-sm md:block"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        aria-label="Buscar em aulas, questões, glossário e provas"
        placeholder="Busque por assunto, aula, questão ou termo…"
        className="campo h-10 rounded-full pl-9 pr-3 text-[0.875rem]"
      />
    </form>
  );
}

export function GlobalSearch() {
  // `useSearchParams` exige Suspense para não forçar a renderização dinâmica
  // do cabeçalho inteiro.
  return (
    <Suspense fallback={<div className="hidden w-full max-w-sm md:block" />}>
      <CampoBusca />
    </Suspense>
  );
}
