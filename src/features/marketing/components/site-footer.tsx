import Link from "next/link";
import { Logo } from "./logo";

const columns = [
  {
    title: "Plataforma",
    links: [
      { href: "#disciplinas", label: "Disciplinas" },
      { href: "#planos", label: "Planos" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Conta",
    links: [
      { href: "/login", label: "Entrar" },
      { href: "/cadastro", label: "Criar conta" },
    ],
  },
  {
    title: "Redes",
    links: [
      { href: "https://instagram.com/despolarizamed", label: "Instagram" },
      { href: "https://youtube.com/@despolarizamed", label: "YouTube" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo tamanho={32} href={null} />
            <p className="mt-2 text-sm text-muted-foreground">
              Plataforma completa de preparação para vestibulares de Medicina.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} DespolarizaMED. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
