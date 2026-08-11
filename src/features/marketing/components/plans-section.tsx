import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { plans } from "@/features/marketing/content";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlansSection() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Planos e assinatura
        </h2>
        <p className="mt-3 text-muted-foreground">
          Escolha o plano ideal para a sua reta final. Pagamento processado com segurança via
          Mercado Pago.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.slug}
            className={cn(
              "flex flex-col",
              plan.highlighted && "border-primary shadow-lg ring-1 ring-primary",
            )}
          >
            <CardHeader>
              {plan.highlighted && (
                <Badge className="mb-2 w-fit" variant="default">
                  Mais escolhido
                </Badge>
              )}
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{plan.priceLabel}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link
                href={`/cadastro?plano=${plan.slug}`}
                className={buttonVariants({
                  className: "w-full",
                  variant: plan.highlighted ? "default" : "outline",
                })}
              >
                Assinar {plan.name}
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
