"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { UserRole } from "@/lib/auth/rbac";
import { SidebarNav } from "./sidebar-nav";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.at(-1)?.[0] ?? "")).toUpperCase();
}

/** Sidebar vira drawer no mobile: mesmo conteúdo da sidebar desktop, atrás de um botão de menu. */
export function MobileDrawer({ role, userName, userEmail }: { role: UserRole; userName: string; userEmail: string }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", fechar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fechar);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        aria-label="Abrir menu"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[1px]"
          />
          <div
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-sidebar shadow-lg"
          >
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Link href="/dashboard" onClick={() => setAberto(false)} className="text-lg font-bold tracking-tight text-primary">
                DespolarizaMED
              </Link>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNav role={role} onNavigate={() => setAberto(false)} />
            </div>
            <div className="border-t border-sidebar-border p-3">
              <div className="flex items-center gap-2.5 px-1 py-1">
                <Avatar size="sm">
                  <AvatarFallback>{iniciais(userName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-1">
                <Link
                  href="/minha-conta"
                  onClick={() => setAberto(false)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Minha conta
                </Link>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
