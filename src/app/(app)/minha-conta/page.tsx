import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { assinaturaDoAluno, pagamentosDoAluno } from "@/features/account/queries";
import { ProfileForm } from "@/features/account/components/profile-form";
import { PasswordForm } from "@/features/account/components/password-form";
import { VerifyEmailButton } from "@/features/account/components/verify-email-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Minha conta — DespolarizaMED" };

const STATUS: Record<string, { rotulo: string; tom: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { rotulo: "Ativa", tom: "default" },
  PENDING: { rotulo: "Aguardando pagamento", tom: "secondary" },
  PAST_DUE: { rotulo: "Pagamento pendente", tom: "destructive" },
  CANCELLED: { rotulo: "Cancelada", tom: "secondary" },
  EXPIRED: { rotulo: "Expirada", tom: "secondary" },
};

const PAGAMENTO: Record<string, string> = {
  APPROVED: "Pago",
  PENDING: "Processando",
  FAILED: "Recusado",
  REFUNDED: "Estornado",
};

function brl(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centavos / 100,
  );
}

function data(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(d));
}

export default async function MinhaContaPage() {
  const { session } = await requireSessionWithRole("STUDENT");
  const [assinatura, pagamentos] = await Promise.all([
    assinaturaDoAluno(session.user.id),
    pagamentosDoAluno(session.user.id),
  ]);

  const verificado = (session.user as { emailVerified?: boolean }).emailVerified ?? false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Minha conta</h1>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfileForm nomeInicial={session.user.name} />

            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium text-foreground">E-mail</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">{session.user.email}</span>
                {verificado ? (
                  <Badge variant="secondary">confirmado</Badge>
                ) : (
                  <>
                    <Badge variant="destructive">não confirmado</Badge>
                    <VerifyEmailButton email={session.user.email} />
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Para trocar de e-mail, fale com o suporte: ele é o seu login.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            {!assinatura ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">Você ainda não tem assinatura.</p>
                <Link href="/planos" className="text-sm font-medium text-primary hover:underline">
                  Ver planos
                </Link>
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Plano</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {assinatura.planoNome}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {brl(assinatura.planoPreco)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Situação</dt>
                  <dd className="mt-0.5">
                    <Badge variant={STATUS[assinatura.status]?.tom ?? "secondary"}>
                      {STATUS[assinatura.status]?.rotulo ?? assinatura.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Acesso até</dt>
                  <dd className="mt-0.5 text-foreground">{data(assinatura.currentPeriodEnd)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Assinante desde</dt>
                  <dd className="mt-0.5 text-foreground">{data(assinatura.createdAt)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Cancelamento e troca de cartão são feitos na sua conta do Mercado Pago, em
                    Assinaturas. O acesso continua até o fim do período já pago.
                  </p>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {pagamentos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-medium">Data</th>
                      <th className="pb-2 font-medium">Valor</th>
                      <th className="pb-2 font-medium">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="py-2 text-muted-foreground">
                          {data(p.paidAt ?? p.createdAt)}
                        </td>
                        <td className="py-2 text-foreground">{brl(p.amountCents)}</td>
                        <td className="py-2 text-muted-foreground">
                          {PAGAMENTO[p.status] ?? p.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
