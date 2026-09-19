import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/auth/rbac";
import { nomeDoPlanoVigente } from "@/features/billing/queries";
import { AppShell } from "@/components/app-shell/app-shell";

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
  const plano = await nomeDoPlanoVigente(session.user.id);

  return (
    <AppShell role={role} nome={session.user.name} plano={plano}>
      {children}
    </AppShell>
  );
}
