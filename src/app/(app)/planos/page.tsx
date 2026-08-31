import type { Metadata } from "next";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { listarPlanosAtivos, assinaturaVigente } from "@/features/billing/queries";
import { assinar } from "@/features/billing/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const metadata: Metadata = { title: "Planos — DespolarizaMED" };

const PERIODO: Record<string, { rotulo: string; meses: number }> = {
  MENSAL: { rotulo: "por mês", meses: 1 },
  TRIMESTRAL: { rotulo: "a cada 3 meses", meses: 3 },
  SEMESTRAL: { rotulo: "a cada 6 meses", meses: 6 },
};

function brl(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centavos / 100,
  );
}

export default async function PlanosPage() {
  const { session } = await requireSessionWithRole("STUDENT");
  const [planos, vigente] = await Promise.all([
    listarPlanosAtivos(),
    assinaturaVigente(session.user.id),
  ]);

  // O preço por mês é o que deixa a comparação honesta: sem ele, "R$ 597" ao
  // lado de "R$ 119" parece mais caro, quando é mais barato por mês.
  const porMes = (p: (typeof planos)[number]) =>
    Math.round(p.priceCents / PERIODO[p.billingPeriod].meses);
  const maisBarato = planos.length > 0 ? Math.min(...planos.map(porMes)) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Escolha seu plano</h1>
        <p className="mt-2 text-muted-foreground">
          Aulas, banco de questões, provas antigas e plantões ao vivo.
        </p>
      </div>

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
          const destaque = planos.length > 1 && porMes(plano) === maisBarato;
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
                  {PERIODO[plano.billingPeriod].rotulo}
                  {PERIODO[plano.billingPeriod].meses > 1 && (
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
