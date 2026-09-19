import Image from "next/image";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import type { UserRole } from "@/lib/auth/rbac";
import { InitialsAvatar } from "@/components/ui/chip";
import { GlobalSearch } from "./global-search";
import { MobileNav } from "./mobile-nav";
import { NavGroups } from "./nav-links";
import { UserFooter } from "./user-footer";

/**
 * O invólucro da área logada: barra lateral fixa no desktop, cabeçalho fino no
 * topo e gaveta no celular.
 *
 * Por que barra lateral e não a barra horizontal anterior: são dezesseis
 * destinos. Na horizontal eles cabem em 1440px e não cabem em 1280px, o que é
 * a largura da maior parte dos notebooks — daí a impressão de "cabeçalho
 * carregado" e o estouro de largura. Na vertical há espaço de sobra, os itens
 * ganham ícone e agrupamento, e o topo fica livre para busca e conta.
 *
 * O conteúdo NÃO é centralizado numa coluna de 1152px como antes: com a barra
 * ocupando 264px à esquerda, centralizar de novo criava a faixa vazia enorme
 * à direita que aparecia nas capturas. Agora a área útil ocupa a largura toda
 * até `--content-max`, com respiro nas laterais.
 */
export function AppShell({
  role,
  nome,
  plano,
  children,
}: {
  role: UserRole;
  nome: string;
  plano: string | null;
  children: React.ReactNode;
}) {
  const rodape = <UserFooter nome={nome} plano={plano} />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[var(--shell-sidebar)_minmax(0,1fr)]">
      {/* --- barra lateral (desktop) --- */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-[var(--shell-header)] shrink-0 items-center border-b border-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg"
            aria-label="DespolarizaMED — início"
          >
            <Image src="/logo.png" alt="" aria-hidden width={32} height={32} priority />
            <span className="font-display text-[0.9375rem] font-semibold tracking-tight text-text-primary">
              Despolariza<span className="text-brand-600">MED</span>
            </span>
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <NavGroups role={role} />
        </div>

        <div className="shrink-0">{rodape}</div>
      </aside>

      {/* --- coluna de conteúdo --- */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-[var(--shell-header)] shrink-0 items-center gap-2 border-b border-border bg-surface/90 px-3 backdrop-blur-md sm:px-5">
          <MobileNav role={role} rodape={rodape} />

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg lg:hidden"
            aria-label="DespolarizaMED — início"
          >
            <Image src="/logo.png" alt="" aria-hidden width={28} height={28} priority />
            <span className="font-display text-[0.875rem] font-semibold tracking-tight text-text-primary">
              Despolariza<span className="text-brand-600">MED</span>
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1 md:ml-4 md:justify-between">
            <GlobalSearch />

            <div className="flex shrink-0 items-center gap-0.5">
              <Link
                href="/busca"
                aria-label="Buscar"
                className="inline-flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary md:hidden"
              >
                <Search className="size-5" aria-hidden />
              </Link>
              <Link
                href="/favoritos"
                aria-label="Favoritos"
                title="Favoritos"
                className="inline-flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
              >
                <Star className="size-5" aria-hidden />
              </Link>
              <Link
                href="/minha-conta"
                aria-label={`Minha conta — ${nome}`}
                title="Minha conta"
                className="ml-1 inline-flex items-center rounded-full ring-offset-2 ring-offset-surface transition-shadow hover:ring-2 hover:ring-brand-200"
              >
                <InitialsAvatar nome={nome} tamanho="sm" />
              </Link>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-(--content-max) px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
