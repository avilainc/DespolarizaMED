import Link from "next/link";
import { Logo } from "./logo";

/**
 * Rodapé do site público.
 *
 * As âncoras eram relativas (`#planos`) e morriam fora da home — mesmo defeito
 * do cabeçalho, corrigido do mesmo jeito. Ver `site-nav.tsx`.
 *
 * A coluna "Legal" está aqui com o que existe hoje. Termos de Uso, Política de
 * Privacidade e Política de Cancelamento ainda não têm página: elas exigem
 * razão social, CNPJ e canal de atendimento, que são dados que só a empresa
 * tem — inventá-los seria pior que a ausência. Enquanto isso, o rodapé ao menos
 * oferece um caminho de contato real em vez de nenhum.
 */
const colunas = [
  {
    title: "Plataforma",
    links: [
      { href: "/#disciplinas", label: "Disciplinas" },
      { href: "/#professores", label: "Professores" },
      { href: "/#planos", label: "Planos" },
      { href: "/#faq", label: "Perguntas frequentes" },
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

          {colunas.map((coluna) => (
            <div key={coluna.title}>
              <p className="text-sm font-semibold text-foreground">{coluna.title}</p>
              <ul className="mt-3 space-y-1">
                {coluna.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="-mx-2 block rounded px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
