import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import {
  alternativasDe,
  filaDeRevisao,
  versoesDaQuestao,
  historicoDeRevisoes,
  resumoDoAcervo,
} from "@/features/library/queries";
import { ReviewActions } from "@/features/library/components/review-actions";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileStack, History } from "lucide-react";

export const metadata: Metadata = { title: "Acervo — DespolarizaMED" };

const ACAO: Record<string, string> = {
  APROVOU: "aprovou",
  REJEITOU: "rejeitou",
  CORRIGIU_GABARITO: "corrigiu o gabarito",
  REABRIU: "reabriu",
};

export default async function AcervoPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireSessionWithRole("ADMIN");
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.p) || 1);
  const POR_PAGINA = 20;

  const [resumo, filaCompleta, historico] = await Promise.all([resumoDoAcervo(), filaDeRevisao(200), historicoDeRevisoes(30)]);
  const fila = filaCompleta.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const paginas = Math.ceil(filaCompleta.length / POR_PAGINA);
  const ids = fila.map((f) => f.id);
  const [alternativas, versoes] = await Promise.all([
    alternativasDe(ids),
    versoesDaQuestao(fila.map((f) => ({ id: f.id, duplicataDe: f.duplicataDe }))),
  ]);

  return (
    <>
      <PageHeader
        migalhas={[{ rotulo: "Administração", href: "/gestao" }, { rotulo: "Acervo" }]}
        titulo="Acervo"
        descricao="Provas ingeridas do pipeline de extração e fila de revisão do que ficou duvidoso. Toda decisão aqui fica registrada com autor e hora."
      />

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <FileStack className="size-4" /> Números do acervo
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Documentos" value={resumo.documentos} />
          <StatCard label="Páginas" value={resumo.paginas} />
          <StatCard label="Questões extraídas" value={resumo.questoes} />
          <StatCard label="Validadas" value={resumo.validadas} />
          <StatCard label="Distintas (sem duplicata)" value={resumo.distintas} />
          <StatCard label="Com figura" value={resumo.comFigura} />
          <StatCard label="Pendentes de revisão" value={resumo.pendentes} destaque={resumo.pendentes > 0} />
          <StatCard label="Conflitos de duplicata" value={resumo.conflitos} destaque={resumo.conflitos > 0} />
          <StatCard label="Revisadas por humano" value={resumo.revisadas} />
          <StatCard label="Rejeitadas" value={resumo.rejeitadas} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <AlertTriangle className="size-4" /> Fila de revisão
          <span className="font-normal text-muted-foreground">
            ({filaCompleta.length}
            {filaCompleta.length === 200 ? "+" : ""})
          </span>
        </h2>

        {fila.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Nada pendente: sem conflito de duplicata e sem problema declarado na extração.
          </p>
        ) : (
          <div className="space-y-3">
            {fila.map((item) => {
              const alts = alternativas.get(item.id) ?? [];
              const outrasVersoes = versoes.get(item.id) ?? [];
              return (
                <article key={item.id} className="rounded-lg border border-border bg-card p-4" data-testid="fila-item" data-question-id={item.id}>
                  <header className="flex flex-wrap items-center gap-2 text-xs">
                    {item.conflitoDuplicata && <Badge variant="destructive">conflito de duplicata</Badge>}
                    {item.duplicataDe && <Badge variant="outline">cópia</Badge>}
                    {item.problemas.map((p) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ))}
                    {item.instituicao && <Badge variant="secondary">{item.instituicao}</Badge>}
                    {item.ano && <Badge variant="outline">{item.ano}</Badge>}
                    {item.numero && <span className="text-muted-foreground">Questão {item.numero}</span>}
                    {item.copias > 1 && <span className="text-muted-foreground">· {item.copias} cópias</span>}
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                      p.{item.pagina ?? "?"} · {item.relPath}
                    </span>
                  </header>

                  <p className="mt-3 whitespace-pre-line text-sm text-foreground">{item.enunciado}</p>

                  {alts.length > 0 && (
                    <ol className="mt-3 space-y-1 text-sm">
                      {alts.map((a) => (
                        <li key={a.letra} className={`flex gap-2 rounded-md px-2 py-1 ${a.correta ? "bg-primary/10" : ""}`}>
                          <span className="font-semibold text-muted-foreground">{a.letra.toUpperCase()})</span>
                          <span className="text-foreground">{a.texto}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  <footer className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Gabarito lido: <strong className="text-foreground">{item.gabaritoLetra?.toUpperCase() ?? "nenhum"}</strong>
                      {item.motivoLigacao && <> ({item.motivoLigacao})</>}
                    </span>
                    {outrasVersoes.length > 0 && (
                      <span>
                        Outras versões:{" "}
                        {outrasVersoes
                          .map(
                            (v) =>
                              `${v.instituicao ?? "?"} ${v.ano ?? ""}${v.canonica ? " (canônica)" : ""} → ${v.gabarito?.toUpperCase() ?? "?"}`,
                          )
                          .join(" · ")}
                      </span>
                    )}
                    <Link href={`/questoes/${item.id}`} className="text-primary hover:underline">
                      ver como o aluno veria →
                    </Link>
                  </footer>

                  <ReviewActions
                    id={item.id}
                    alternativas={alts.map((a) => ({ letra: a.letra, texto: a.texto }))}
                    gabaritoAtual={item.gabaritoLetra}
                    validada={item.validada}
                  />
                </article>
              );
            })}
          </div>
        )}

        {paginas > 1 && (
          <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Paginação">
            {pagina > 1 ? <Link href={`/gestao/acervo?p=${pagina - 1}`} className="text-primary hover:underline">← Anterior</Link> : <span />}
            <span className="text-muted-foreground">Página {pagina} de {paginas}</span>
            {pagina < paginas ? <Link href={`/gestao/acervo?p=${pagina + 1}`} className="text-primary hover:underline">Próxima →</Link> : <span />}
          </nav>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <History className="size-4" /> Histórico de revisões
        </h2>
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma revisão registrada ainda.</p>
        ) : (
          <ol className="space-y-1.5 text-sm" data-testid="historico-revisoes">
            {historico.map((h) => (
              <li key={h.id} className="rounded-md border border-border bg-card px-3 py-2">
                <span className="text-muted-foreground">
                  {h.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>{" "}
                <strong className="text-foreground">{h.revisor}</strong> {ACAO[h.acao] ?? h.acao}{" "}
                <Link href={`/questoes/${h.questionId}`} className="text-primary hover:underline">
                  {h.instituicao} {h.ano} q.{h.numero ?? "?"}
                </Link>
                {h.depois && Object.keys(h.depois).length > 0 && (
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    {Object.entries(h.depois)
                      .map(([k, v]) => `${k}: ${JSON.stringify((h.antes as Record<string, unknown> | null)?.[k])} → ${JSON.stringify(v)}`)
                      .join("; ")}
                  </span>
                )}
                {h.nota && <span className="ml-2 italic text-muted-foreground">“{h.nota}”</span>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

/**
 * Número do acervo. `destaque` só é usado no que exige AÇÃO (pendentes de
 * revisão, conflitos de duplicata) — os outros ficam neutros, para que o
 * vermelho continue significando alguma coisa.
 */
function StatCard({ label, value, destaque }: { label: string; value: number; destaque?: boolean }) {
  return (
    <MetricCard
      rotulo={label}
      valor={value.toLocaleString("pt-BR")}
      tom={destaque ? "negativo" : "neutro"}
    />
  );
}
