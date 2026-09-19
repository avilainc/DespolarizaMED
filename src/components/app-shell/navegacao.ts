import {
  CalendarCheck,
  CalendarDays,
  CircleHelp,
  FileText,
  GraduationCap,
  History,
  Home,
  Library,
  type LucideIcon,
  PencilRuler,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  Video,
} from "lucide-react";
import { hasRole, type UserRole } from "@/lib/auth/rbac";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  /** Descrição curta, usada só no menu do celular. */
  resumo?: string;
};

export type GrupoNav = {
  /** Sem título = grupo solto no topo (Início). */
  titulo?: string;
  itens: ItemNav[];
};

/**
 * A navegação da área logada.
 *
 * O problema que ela resolve: a barra horizontal anterior tinha treze links
 * disputando a mesma linha (Dashboard, Disciplinas, Professor, Questões,
 * Provas, Plano, Calendário, Plantões, Planos, Administração, busca,
 * favoritos, conta). Em 1280px eles já se tocavam, e o aluno não tinha como
 * saber que "Plano" e "Planos" são coisas completamente diferentes — uma é o
 * cronograma de estudos, a outra é a assinatura.
 *
 * Agrupar por INTENÇÃO resolve os dois: cabe na vertical e o rótulo ganha
 * contexto pelo grupo em que está ("Estudar > Plano de estudos" contra
 * "Conta > Assinatura"). Nenhum item foi removido — só reorganizado; esconder
 * funcionalidade para simplificar o layout seria trocar um problema por outro.
 */
export function navegacaoDoAluno(role: UserRole): GrupoNav[] {
  const grupos: GrupoNav[] = [
    {
      itens: [
        { href: "/dashboard", rotulo: "Início", icone: Home, resumo: "Continue de onde parou" },
      ],
    },
    {
      titulo: "Estudar",
      itens: [
        {
          href: "/disciplinas",
          rotulo: "Disciplinas",
          icone: Library,
          resumo: "Aulas por módulo",
        },
        {
          href: "/questoes",
          rotulo: "Banco de questões",
          icone: CircleHelp,
          resumo: "Questões de vestibular com gabarito",
        },
        {
          href: "/provas",
          rotulo: "Provas antigas",
          icone: FileText,
          resumo: "Resolva a prova inteira",
        },
        {
          href: "/plano",
          rotulo: "Plano de estudos",
          icone: CalendarCheck,
          resumo: "Seu cronograma até a prova",
        },
      ],
    },
    {
      titulo: "Agenda",
      itens: [
        { href: "/calendario", rotulo: "Calendário", icone: CalendarDays },
        { href: "/plantoes", rotulo: "Plantões e palestras", icone: Video },
      ],
    },
    {
      titulo: "Acompanhar",
      itens: [
        { href: "/desempenho", rotulo: "Desempenho", icone: TrendingUp },
        { href: "/atividades", rotulo: "Atividades", icone: History },
      ],
    },
    {
      titulo: "Biblioteca",
      itens: [
        { href: "/glossario", rotulo: "Glossário", icone: PencilRuler },
        { href: "/favoritos", rotulo: "Favoritos", icone: Star },
      ],
    },
  ];

  // Professor e Administração só existem para quem tem o papel. A checagem
  // aqui é de LAYOUT; quem barra de verdade é `requireSessionWithRole` na
  // própria rota — esconder o link nunca foi autorização.
  const equipe: ItemNav[] = [];
  if (hasRole(role, "TEACHER")) {
    equipe.push({ href: "/professor", rotulo: "Área do professor", icone: GraduationCap });
  }
  if (hasRole(role, "ADMIN")) {
    // /gestao, e não /admin: /admin é do painel do Payload e as duas rotas
    // colidem (optional catch-all), derrubando a aplicação.
    equipe.push({ href: "/gestao", rotulo: "Administração", icone: Settings });
  }
  if (equipe.length) grupos.push({ titulo: "Equipe", itens: equipe });

  return grupos;
}

/** Item da assinatura, separado porque mora no rodapé da barra, não no menu. */
export const ITEM_PLANOS: ItemNav = {
  href: "/planos",
  rotulo: "Planos e assinatura",
  icone: Sparkles,
};
