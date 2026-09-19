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
    <footer className="border-t border-border bg-surface-subtle">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="max-w-xs">
            <Logo tamanho={36} href={null} />
            <p className="mt-3 text-[0.875rem] leading-relaxed text-text-secondary">
              Plataforma de preparação para vestibulares de Medicina: aulas, banco de questões,
              provas antigas e plantões ao vivo.
            </p>
          </div>

          {colunas.map((coluna) => (
            <nav key={coluna.title} aria-label={coluna.title}>
              <p className="t-eyebrow">{coluna.title}</p>
              <ul className="mt-3.5 space-y-0.5">
                {coluna.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="-mx-2 block rounded-md px-2 py-2 text-[0.875rem] text-text-secondary transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="t-meta mt-12 border-t border-border pt-6">
          © {new Date().getFullYear()} DespolarizaMED. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
