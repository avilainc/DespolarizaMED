"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { aplicarTema, temaSalvo, type Tema } from "@/lib/tema";

/**
 * Botão de alternar entre o tema escuro (padrão) e o claro.
 *
 * Até montar no cliente o componente não sabe o tema salvo — o servidor nunca
 * sabe, ver `lib/tema.ts`. Por isso o primeiro render mostra o ícone do
 * padrão e só depois corrige; o que importa (as cores da página) já foi
 * resolvido pelo script do <head>, antes disso.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [tema, setTema] = useState<Tema>("escuro");

  useEffect(() => {
    setTema(temaSalvo());
  }, []);

  const proximo: Tema = tema === "escuro" ? "claro" : "escuro";
  const rotulo = proximo === "claro" ? "Usar tema claro" : "Usar tema escuro";

  return (
    <button
      type="button"
      onClick={() => {
        aplicarTema(proximo);
        setTema(proximo);
      }}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
    >
      {tema === "escuro" ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
}
