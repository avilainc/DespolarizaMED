import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/auth/rbac";
import { AppSidebar } from "@/features/shell/app-sidebar";
import { AppHeader } from "@/features/shell/app-header";
import type { Metadata } from "next";

/**
 * Nada da área logada entra em índice de buscador.
 *
 * Toda rota aqui já exige sessão e devolveria um redirect para o login, mas
 * aparecer no índice com título de página privada é ruim de qualquer forma e
 * gasta orçamento de rastreio. O `robots.txt` também pede isso; esta é a
 * segunda camada, porque `robots.txt` é pedido, não garantia.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role?: UserRole }).role ?? "STUDENT";

  return (
    <div className="flex min-h-screen">
      <AppSidebar role={role} userName={session.user.name} userEmail={session.user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader role={role} userName={session.user.name} userEmail={session.user.email} />
        <main className="flex-1 bg-[var(--app-bg)]">{children}</main>
      </div>
    </div>
  );
}
