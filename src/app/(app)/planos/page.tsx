import type { Metadata } from "next";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { listarPlanosAtivos, assinaturaVigente } from "@/features/billing/queries";
import { brl, melhorPrecoMensal, periodoDe, porMes } from "@/features/billing/precos";
import { assinar } from "@/features/billing/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const metadata: Metadata = { title: "Planos — DespolarizaMED" };

/**
 * `?plano=<slug>` chega de quem escolheu na landing e acabou de criar a conta.
 * Serve só para destacar o card certo e dizer que a escolha foi preservada —
 * quem assina continua sendo a action `assinar`, com o slug do próprio card.
 */
export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { session } = await requireSessionWithRole("STUDENT");
  const { plano: vindoDaLanding } = await searchParams;
  const [planos, vigente] = await Promise.all([
    listarPlanosAtivos(),
    assinaturaVigente(session.user.id),
  ]);

  const maisBarato = melhorPrecoMensal(planos);
  const escolhido = planos.find((p) => p.slug === vindoDaLanding);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Escolha seu plano</h1>
        <p className="mt-2 text-muted-foreground">
          Aulas, banco de questões, provas antigas e plantões ao vivo.
        </p>
      </div>

      {escolhido && !vigente && (
        <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-primary/40 bg-primary/5 p-4 text-center text-sm">
          Você escolheu o plano <strong>{escolhido.name}</strong>. Confirme abaixo para concluir.
        </div>
      )}

      {vigente && (
        <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-border bg-muted/40 p-4 text-center text-sm">
          Você já tem uma assinatura{" "}
          <strong>{vigente.status === "ACTIVE" ? "ativa" : "em regularização"}</strong>.
        </div>
      )}

      {planos.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          Nenhum plano disponível no momento.
        </p>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {planos.map((plano) => {
          // O plano que a pessoa escolheu na landing manda no destaque; sem
          // ela, destaca-se o melhor preço por mês.
          const destaque = escolhido
            ? plano.slug === escolhido.slug
            : planos.length > 1 && porMes(plano) === maisBarato;
          return (
            <Card
              key={plano.id}
              className={destaque ? "border-primary shadow-sm" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plano.name}</CardTitle>
                  {destaque && <Badge>melhor preço</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{brl(plano.priceCents)}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {periodoDe(plano.billingPeriod).rotulo}
                  {periodoDe(plano.billingPeriod).meses > 1 && (
                    <> · {brl(porMes(plano))} por mês</>
                  )}
                </p>

                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  {["Todas as aulas", "Banco de questões", "Provas antigas", "Plantões ao vivo"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-4 shrink-0 text-primary" aria-hidden />
                        {item}
                      </li>
                    ),
                  )}
                </ul>

                <form action={assinar} className="mt-6">
                  <input type="hidden" name="plano" value={plano.slug} />
                  <button
                    type="submit"
                    disabled={!!vigente}
                    className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {vigente ? "Assinatura ativa" : "Assinar"}
                  </button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Pagamento processado pelo Mercado Pago. Cancele quando quiser.
      </p>
    </div>
  );
}
