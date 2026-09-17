import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "./logo";
import { navLinks } from "@/features/marketing/nav";
import { MenuDoSite } from "./site-nav";

/**
 * Cabeçalho do site público.
 *
 * Dois defeitos que moravam aqui:
 *
 * 1. O `<nav>` era `hidden md:flex` sem nenhuma alternativa — abaixo de 768px
 *    o visitante perdia Disciplinas, Professores, Planos e FAQ, sobrando só
 *    "Entrar" e "Criar conta". Como o tráfego de vestibulando vem sobretudo do
 *    Instagram, isso era a maior parte do público sem navegação nenhuma.
 *    (O `MobileNav` que existe em `features/auth` é da área logada e nunca
 *    cobriu a landing.)
 * 2. Os links eram âncoras relativas (`#planos`). Fora da home elas viram
 *    `/blog#planos` e não levam a lugar nenhum. Agora são absolutas (`/#planos`).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Logo prioridade nomeSoDesdeSm />

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* "Entrar" some abaixo de `sm` e reaparece dentro do menu: em 320px
              não cabem emblema, dois botões e o menu na mesma linha. O CTA
              principal ("Criar conta") é o que fica, porque é o que converte. */}
          <Link
            href="/login"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "hidden h-10 px-3 sm:inline-flex",
            })}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={buttonVariants({ size: "sm", className: "h-10 px-2.5 text-xs sm:px-3 sm:text-sm" })}
          >
            Criar conta
          </Link>
          <MenuDoSite />
        </div>
      </div>
    </header>
  );
}
