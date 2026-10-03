"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { UserRole } from "@/lib/auth/rbac";
import { NavGroups } from "./nav-links";

/**
 * Menu do celular.
 *
 * É gaveta lateral, e não o painel que caía do cabeçalho: a lista tem agora
 * cinco grupos e dezesseis itens, o que em `grid-cols-2` dentro do cabeçalho
 * virava um bloco de dois por oito com rótulos cortados. Na gaveta cada item
 * tem 44px de alvo, o rótulo cabe inteiro e o resumo explica o que a tela faz.
 *
 * O que o componente precisa garantir, e por isso não é só um `useState`:
 *   - fecha ao trocar de rota (senão a gaveta fica aberta por cima da página);
 *   - fecha no Esc e no clique fora;
 *   - trava a rolagem do corpo enquanto está aberta;
 *   - devolve o foco ao botão que a abriu.
 */
export function MobileNav({
  role,
  rodape,
}: {
  role: UserRole;
  /** Bloco de identidade (avatar, conta, sair) renderizado no servidor. */
  rodape: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (!aberto) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar);

    painelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto(true)}
        aria-expanded={aberto}
        aria-controls="menu-lateral"
        aria-label="Abrir menu"
        className="inline-flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]"
          />
          <div
            id="menu-lateral"
            ref={painelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col bg-surface shadow-lg"
          >
            <div className="flex h-[var(--shell-header)] shrink-0 items-center justify-between border-b border-border px-4">
              <span className="font-display text-[0.9375rem] font-semibold tracking-tight text-text-primary">
                Despolariza<span className="text-brand-orange-texto">MED</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  botaoRef.current?.focus();
                }}
                aria-label="Fechar menu"
                className="inline-flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-subtle"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <NavGroups role={role} comResumo aoNavegar={() => setAberto(false)} />
            </div>

            <div className="shrink-0">{rodape}</div>
          </div>
        </div>
      )}
    </>
  );
}
