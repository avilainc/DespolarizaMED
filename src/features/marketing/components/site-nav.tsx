"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { navLinks } from "@/features/marketing/nav";

/**
 * Menu do site público abaixo de `md`.
 *
 * Mesmo padrão do `MobileNav` da área logada (botão que alterna, painel
 * ancorado sob o cabeçalho de 64px, fecha ao navegar), porque é a mesma
 * interação — mas com os links da landing, que aquele componente não tem.
 *
 * Não marca item ativo: são âncoras da mesma página, e `usePathname()` seria
 * `/` para todas.
 */
export function MenuDoSite() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-do-site"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
      >
        {aberto ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>

      {aberto && (
        <nav
          id="menu-do-site"
          aria-label="Navegação principal"
          className="absolute inset-x-0 top-16 z-40 border-b border-border bg-background px-4 py-3 shadow-md"
        >
          <ul className="grid gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setAberto(false)}
                  className="block rounded-md px-3 py-3 text-sm text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {/* "Entrar" sai do cabeçalho abaixo de `sm` (não cabe ao lado do
                emblema, do CTA e deste botão) e reaparece aqui — some do
                cabeçalho, não do site. */}
            <li className="border-t border-border pt-1 sm:hidden">
              <Link
                href="/login"
                onClick={() => setAberto(false)}
                className="block rounded-md px-3 py-3 text-sm font-medium text-primary hover:bg-muted"
              >
                Entrar
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
