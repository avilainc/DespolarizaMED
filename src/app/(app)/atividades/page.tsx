import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { historicoDoAluno } from "@/features/students/queries";
import { estatisticasDoAluno } from "@/features/practice/queries";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Atividades — DespolarizaMED" };

export default async function AtividadesPage() {
  const { session } = await requireAssinatura();
  const [historico, stats] = await Promise.all([
    historicoDoAluno(session.user.id),
    estatisticasDoAluno(session.user.id),
  ]);

  const porDia = new Map<string, typeof historico>();
  for (const h of historico) {
    const k = h.quando.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    const lista = porDia.get(k) ?? [];
    lista.push(h);
    porDia.set(k, lista);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Atividades</h1>
      <p className="mt-1 text-muted-foreground">
        Seu histórico na plataforma. {stats.geral.respondidas > 0 && (
          <>
            {stats.geral.respondidas.toLocaleString("pt-BR")} questões respondidas ·{" "}
            <Link href="/desempenho" className="text-primary hover:underline">ver desempenho</Link>
          </>
        )}
      </p>

      {historico.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nada por aqui ainda. Assista a uma aula ou resolva uma prova.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {[...porDia.entries()].map(([dia, lista]) => (
            <section key={dia}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">{dia}</h2>
              <ol className="space-y-1.5">
                {lista.map((h) => (
                  <li key={h.id} className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
                    <span className="w-12 shrink-0 text-xs text-muted-foreground">
                      {h.quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Badge variant="outline" className="shrink-0">{h.tipo}</Badge>
                    {h.href ? (
                      <Link href={h.href} className="text-foreground hover:underline">{h.descricao}</Link>
                    ) : (
                      <span className="text-foreground">{h.descricao}</span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
