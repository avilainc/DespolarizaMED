import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "./logo";

const navLinks = [
  { href: "#disciplinas", label: "Disciplinas" },
  { href: "#professores", label: "Professores" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo prioridade />

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Entrar
          </Link>
          <Link href="/cadastro" className={buttonVariants({ size: "sm" })}>
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
