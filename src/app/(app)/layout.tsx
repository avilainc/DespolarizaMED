import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { hasRole, type UserRole } from "@/lib/auth/rbac";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { Search, Star } from "lucide-react";
import { MobileNav } from "@/features/auth/components/mobile-nav";

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
            <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
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
              <Link href="/questoes" className="transition-colors hover:text-foreground">
                Questões
              </Link>
              <Link href="/provas" className="transition-colors hover:text-foreground">
                Provas
              </Link>
              <Link href="/plano" className="transition-colors hover:text-foreground">
                Plano
              </Link>
              <Link href="/calendario" className="transition-colors hover:text-foreground">
                Calendário
              </Link>
              <Link href="/plantoes" className="transition-colors hover:text-foreground">
                Plantões
              </Link>
              <Link href="/planos" className="transition-colors hover:text-foreground">
                Planos
              </Link>
              {/* /gestao, nao /admin: /admin e do painel do Payload CMS e as
                  duas rotas colidem (optional catch-all), derrubando o app. */}
              {hasRole(role, "ADMIN") && (
                <Link href="/gestao" className="transition-colors hover:text-foreground">
                  Administração
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/busca"
              aria-label="Buscar"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="size-4" />
            </Link>
            <Link
              href="/favoritos"
              aria-label="Favoritos"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Star className="size-4" />
            </Link>
            <Link
              href="/minha-conta"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              {session.user.name}
            </Link>
            <SignOutButton />
            <MobileNav
              links={[
                { href: "/dashboard", rotulo: "Dashboard" },
                { href: "/disciplinas", rotulo: "Disciplinas" },
                { href: "/questoes", rotulo: "Questões" },
                { href: "/provas", rotulo: "Provas" },
                { href: "/plano", rotulo: "Plano de estudos" },
                { href: "/calendario", rotulo: "Calendário" },
                { href: "/plantoes", rotulo: "Plantões" },
                { href: "/glossario", rotulo: "Glossário" },
                { href: "/desempenho", rotulo: "Desempenho" },
                { href: "/atividades", rotulo: "Atividades" },
                { href: "/favoritos", rotulo: "Favoritos" },
                { href: "/planos", rotulo: "Planos" },
                ...(hasRole(role, "TEACHER") ? [{ href: "/professor", rotulo: "Professor" }] : []),
                ...(hasRole(role, "ADMIN") ? [{ href: "/gestao", rotulo: "Administração" }] : []),
              ]}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-secondary/20">{children}</main>
    </div>
  );
}
