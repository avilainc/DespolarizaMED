import Link from "next/link";
import { Search, Star } from "lucide-react";
import type { UserRole } from "@/lib/auth/rbac";
import { MobileDrawer } from "./mobile-drawer";

/** Header fino: no desktop só ações globais (busca, favoritos); no mobile também carrega o menu e a marca. */
export function AppHeader({ role, userName, userEmail }: { role: UserRole; userName: string; userEmail: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileDrawer role={role} userName={userName} userEmail={userEmail} />
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary md:hidden">
          DespolarizaMED
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/busca"
          aria-label="Buscar"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="size-4.5" />
        </Link>
        <Link
          href="/favoritos"
          aria-label="Favoritos"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Star className="size-4.5" />
        </Link>
      </div>
    </header>
  );
}
