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
