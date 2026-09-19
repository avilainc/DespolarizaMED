"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ItemNav } from "./navegacao";
import { navegacaoDoAluno } from "./navegacao";
import type { UserRole } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";

/**
 * `/questoes` precisa ficar ativo em `/questoes/<id>`, mas `/plano` NÃO pode
 * ficar ativo em `/planos` — são rotas diferentes cujo prefixo colide. Daí o
 * `+ "/"`: compara o caminho exato ou o caminho seguido de barra.
 */
export function estaAtivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavLink({
  item,
  aoNavegar,
  comResumo = false,
}: {
  item: ItemNav;
  aoNavegar?: () => void;
  comResumo?: boolean;
}) {
  const pathname = usePathname();
  const ativo = estaAtivo(pathname, item.href);
  const Icone = item.icone;

  return (
    <Link
      href={item.href}
      onClick={aoNavegar}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "group/nav relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.875rem] font-medium transition-colors",
        // Alvo de toque de 44px no celular, onde o menu é o drawer.
        comResumo ? "min-h-11 py-2.5" : "min-h-9",
        ativo
          ? "bg-brand-50 text-brand-800"
          : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
      )}
    >
      {/* Marcador à esquerda: o item ativo não se distingue só pelo fundo
          azul-claro, que some para quem enxerga pouco contraste. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity",
          ativo ? "opacity-100" : "opacity-0",
        )}
      />
      <Icone
        aria-hidden
        className={cn(
          "size-[1.125rem] shrink-0 transition-colors",
          ativo ? "text-brand-600" : "text-text-muted group-hover/nav:text-text-secondary",
        )}
      />
      <span className="min-w-0 flex-1 truncate">
        {item.rotulo}
        {comResumo && item.resumo && (
          <span className="mt-0.5 block truncate text-[0.75rem] font-normal text-text-muted">
            {item.resumo}
          </span>
        )}
      </span>
    </Link>
  );
}

/**
 * O menu recebe o PAPEL, não a lista de grupos já montada.
 *
 * Passar os grupos do servidor parecia mais natural, mas a lista carrega um
 * componente de ícone em cada item, e componente não atravessa a fronteira
 * servidor→cliente (React tenta serializar a função e quebra). Como
 * `navegacaoDoAluno` é pura e `hasRole` também, montar a lista aqui custa
 * nada e mantém a definição num arquivo só.
 */
export function NavGroups({
  role,
  aoNavegar,
  comResumo = false,
}: {
  role: UserRole;
  aoNavegar?: () => void;
  comResumo?: boolean;
}) {
  const grupos = navegacaoDoAluno(role);

  return (
    <nav aria-label="Navegação principal" className="space-y-5">
      {grupos.map((grupo, i) => (
        <div key={grupo.titulo ?? `grupo-${i}`}>
          {grupo.titulo && <p className="t-eyebrow mb-1.5 px-3">{grupo.titulo}</p>}
          <ul className="space-y-0.5">
            {grupo.itens.map((item) => (
              <li key={item.href}>
                <NavLink item={item} aoNavegar={aoNavegar} comResumo={comResumo} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
