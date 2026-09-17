"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function MobileNav({ links }: { links: { href: string; rotulo: string }[] }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {aberto && (
        <nav
          id="menu-mobile"
          className="absolute inset-x-0 top-16 z-40 border-b border-border bg-background px-4 py-3 shadow-md"
        >
          <ul className="grid grid-cols-2 gap-1">
            {links.map((l) => {
              const ativo = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setAberto(false)}
                    aria-current={ativo ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm ${ativo ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted"}`}
                  >
                    {l.rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
