import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { UserRole } from "@/lib/auth/rbac";
import { SidebarNav } from "./sidebar-nav";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.at(-1)?.[0] ?? "")).toUpperCase();
}

/** Sidebar desktop fixa: navegação agrupada + rodapé com identidade do usuário. */
export function AppSidebar({
  role,
  userName,
  userEmail,
}: {
  role: UserRole;
  userName: string;
  userEmail: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary">
          DespolarizaMED
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav role={role} />
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
          <Link href="/minha-conta" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Minha conta
          </Link>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
