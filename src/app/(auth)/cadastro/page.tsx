import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";
import { listarPlanosAtivos } from "@/features/billing/queries";

export const metadata: Metadata = {
  title: "Criar conta — DespolarizaMED",
};

/**
 * A landing manda `/cadastro?plano=<slug>`, e este parâmetro era ignorado: o
 * cadastro sempre terminava no `/dashboard`, descartando a escolha que a
 * pessoa acabou de fazer.
 *
 * O slug é conferido contra a tabela `plans` antes de seguir adiante. Vem da
 * URL, então é entrada de usuário: sem a conferência, qualquer texto entraria
 * no redirect depois do cadastro.
 */
export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { plano } = await searchParams;

  const planos = await listarPlanosAtivos();
  const escolhido = plano && planos.some((p) => p.slug === plano) ? plano : undefined;

  return <SignupForm planoEscolhido={escolhido} />;
}
