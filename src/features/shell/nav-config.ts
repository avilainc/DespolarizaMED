import {
  BookMarked,
  BookOpen,
  CalendarDays,
  FileStack,
  Gauge,
  GraduationCap,
  History,
  Home,
  ListChecks,
  ShieldCheck,
  Star,
  Target,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/auth/rbac";

export type NavLink = {
  href: string;
  rotulo: string;
  icon: LucideIcon;
  /** Papel mínimo para o item aparecer; ausente = todo mundo vê. */
  minRole?: UserRole;
};

export type NavGroup = {
  titulo: string;
  itens: NavLink[];
};

/**
 * Fonte única da navegação: sidebar desktop, drawer mobile e busca global
 * usam a mesma lista, então um item novo não precisa ser cadastrado em três
 * lugares diferentes.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    titulo: "Início",
    itens: [{ href: "/dashboard", rotulo: "Início", icon: Home }],
  },
  {
    titulo: "Estudar",
    itens: [
      { href: "/disciplinas", rotulo: "Disciplinas", icon: BookOpen },
      { href: "/questoes", rotulo: "Banco de questões", icon: ListChecks },
      { href: "/provas", rotulo: "Provas antigas", icon: FileStack },
      { href: "/plano", rotulo: "Plano de estudos", icon: Target },
      { href: "/desempenho", rotulo: "Desempenho", icon: Gauge },
      { href: "/atividades", rotulo: "Atividades", icon: History },
    ],
  },
  {
    titulo: "Agenda",
    itens: [
      { href: "/calendario", rotulo: "Calendário", icon: CalendarDays },
      { href: "/plantoes", rotulo: "Plantões e palestras", icon: Video },
    ],
  },
  {
    titulo: "Biblioteca",
    itens: [
      { href: "/glossario", rotulo: "Glossário", icon: BookMarked },
      { href: "/favoritos", rotulo: "Favoritos", icon: Star },
    ],
  },
  {
    titulo: "Professor",
    itens: [{ href: "/professor", rotulo: "Área do professor", icon: GraduationCap, minRole: "TEACHER" }],
  },
  {
    titulo: "Administração",
    // /gestao, nao /admin: /admin e do painel do Payload CMS e as duas rotas
    // colidem (optional catch-all), derrubando o app.
    itens: [{ href: "/gestao", rotulo: "Administração", icon: ShieldCheck, minRole: "ADMIN" }],
  },
];

export function navParaPapel(role: UserRole, hasRole: (role: UserRole, min: UserRole) => boolean): NavGroup[] {
  return NAV_GROUPS.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => !item.minRole || hasRole(role, item.minRole)),
  })).filter((grupo) => grupo.itens.length > 0);
}
