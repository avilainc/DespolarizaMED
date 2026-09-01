import { redirect } from "next/navigation";
import { requireSessionWithRole } from "./require-session";
import { temAcesso } from "@/features/billing/queries";

/**
 * Portão do conteúdo pago.
 *
 * ADMIN e TEACHER entram sem assinatura: são quem produz e revisa o conteúdo,
 * e exigir que o professor assine a própria plataforma para conferir a aula
 * dele não faz sentido.
 */
export async function requireAssinatura() {
  const { session, role } = await requireSessionWithRole("STUDENT");

  if (role === "ADMIN" || role === "TEACHER") {
    return { session, role, assinante: false as const };
  }

  if (!(await temAcesso(session.user.id))) {
    redirect("/planos");
  }

  return { session, role, assinante: true as const };
}

/**
 * Mesma regra do portão das telas, mas para rota de API: responde em vez de
 * redirecionar. `redirect()` numa requisição de segmento de vídeo devolveria
 * o HTML do login para o player, que trataria como mídia corrompida.
 */
export async function requireAssinaturaApi(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; motivo: string }
> {
  const { headers } = await import("next/headers");
  const { auth } = await import("@/lib/auth");

  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return { ok: false, status: 401, motivo: "nao_autenticado" };

  const papel = (sessao.user as { role?: string }).role ?? "STUDENT";
  if (papel === "ADMIN" || papel === "TEACHER") {
    return { ok: true, userId: sessao.user.id };
  }

  if (!(await temAcesso(sessao.user.id))) {
    return { ok: false, status: 403, motivo: "sem_assinatura" };
  }

  return { ok: true, userId: sessao.user.id };
}
