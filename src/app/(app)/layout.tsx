import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { hasRole, type UserRole } from "@/lib/auth/rbac";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role?: UserRole }).role ?? "STUDENT";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary">
              DespolarizaMED
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/disciplinas" className="transition-colors hover:text-foreground">
                Disciplinas
              </Link>
              {hasRole(role, "TEACHER") && (
                <Link href="/professor" className="transition-colors hover:text-foreground">
                  Professor
                </Link>
              )}
              {/* /gestao, nao /admin: /admin e do painel do Payload CMS e as
                  duas rotas colidem (optional catch-all), derrubando o app. */}
              {hasRole(role, "ADMIN") && (
                <Link href="/gestao" className="transition-colors hover:text-foreground">
                  Administração
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-secondary/20">{children}</main>
    </div>
  );
}
