/**
 * Links do site público — módulo de dados, sem `"use client"` de propósito.
 *
 * Esta lista já morou dentro de `site-nav.tsx`, que é client component. Um
 * server component (`SiteHeader`) importando um valor de um módulo
 * `"use client"` não recebe o valor: recebe a referência de cliente que o
 * bundler coloca no lugar do módulo. O sintoma foi `navLinks.map is not a
 * function` ao pré-renderizar `/blog` — e só apareceu no build, porque em dev
 * o módulo ainda é o original.
 *
 * Regra que fica: dado compartilhado entre servidor e cliente mora num módulo
 * neutro; `"use client"` é para o componente, não para a constante.
 *
 * As âncoras são ABSOLUTAS (`/#planos`). Relativas resolvem contra a rota
 * atual — em `/blog`, `#planos` vira `/blog#planos`, que não existe.
 */
export const navLinks = [
  { href: "/#disciplinas", label: "Disciplinas" },
  { href: "/#professores", label: "Professores" },
  { href: "/#planos", label: "Planos" },
  { href: "/#faq", label: "FAQ" },
] as const;
