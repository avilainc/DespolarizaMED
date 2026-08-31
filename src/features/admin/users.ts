import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/auth/rbac";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  lastSeenAt: Date | null;
};

/**
 * Lista de contas para a tela de gestão.
 *
 * "Visto por último" vem da sessão mais recente, não de um campo em `users`:
 * o Better Auth atualiza `sessions.updatedAt` a cada requisição autenticada,
 * então é o dado que já existe. Gravar um `lastLoginAt` em `users` custaria
 * uma escrita por requisição para responder à mesma pergunta.
 */
export async function listUsers(filtro?: { busca?: string; papel?: UserRole }) {
  const condicoes = [];

  if (filtro?.busca) {
    const termo = `%${filtro.busca}%`;
    condicoes.push(or(ilike(users.name, termo), ilike(users.email, termo)));
  }
  if (filtro?.papel) {
    condicoes.push(eq(users.role, filtro.papel));
  }

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      lastSeenAt: sql<Date | null>`max(${sessions.updatedAt})`,
    })
    .from(users)
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(condicoes.length > 0 ? and(...condicoes) : undefined)
    .groupBy(users.id, users.name, users.email, users.role, users.emailVerified, users.createdAt)
    .orderBy(asc(users.name))
    .limit(200);
}

export async function countAdmins(): Promise<number> {
  const [row] = await db.select({ count: count() }).from(users).where(eq(users.role, "ADMIN"));
  return row.count;
}
