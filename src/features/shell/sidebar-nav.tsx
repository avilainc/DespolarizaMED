"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { hasRole, type UserRole } from "@/lib/auth/rbac";
import { navParaPapel } from "./nav-config";

/**
 * Lista de grupos/links usada tanto pela sidebar desktop quanto pelo drawer
 * mobile. Recebe `role` (string serializável), não os grupos já resolvidos:
 * NavGroup carrega componentes de ícone (LucideIcon), que não podem atravessar
 * a fronteira server->client como prop — precisam nascer dentro do client
 * component que os renderiza.
 */
export function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = navParaPapel(role, hasRole);

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((grupo) => (
        <div key={grupo.titulo}>
          <p className="px-3 pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {grupo.titulo}
          </p>
          <ul className="flex flex-col gap-0.5">
            {grupo.itens.map((item) => {
              const ativo = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={ativo ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      ativo
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={2} />
                    <span className="truncate">{item.rotulo}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
