"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flag, Loader2 } from "lucide-react";
import { finalizarTentativa, responderNaTentativa } from "../actions";

export type QuestaoDaProva = {
  id: string;
  numero: number | null;
  enunciado: string;
  contexto: string | null;
  alternativas: { letra: string; texto: string }[];
};

/**
 * Folha de respostas de uma prova. O gabarito não vem para o cliente: cada
 * marcação vai ao servidor, que corrige e guarda; a nota só aparece ao
 * finalizar. Trocar de resposta antes de finalizar é permitido.
 */
export function AnswerSheet({
  attemptId,
  documentId,
  questoes,
  respostasIniciais,
}: {
  attemptId: string;
  documentId: string;
  questoes: QuestaoDaProva[];
  respostasIniciais: Record<string, string>;
}) {
  const router = useRouter();
  const [indice, setIndice] = useState(() => {
    const primeiraSemResposta = questoes.findIndex((q) => !respostasIniciais[q.id]);
    return primeiraSemResposta === -1 ? 0 : primeiraSemResposta;
  });
  const [respostas, setRespostas] = useState(respostasIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startSalvar] = useTransition();
  const [finalizando, startFinalizar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  const atual = questoes[indice];
  const respondidas = questoes.filter((q) => respostas[q.id]).length;

  function marcar(letra: string) {
    if (salvando) return;
    setErro(null);
    const anterior = respostas[atual.id];
    setRespostas((r) => ({ ...r, [atual.id]: letra }));
    startSalvar(async () => {
      const r = await responderNaTentativa({ attemptId, questionId: atual.id, letra });
      if (!r.ok) {
        setErro(r.erro);
        setRespostas((prev) => {
          const copia = { ...prev };
          if (anterior) copia[atual.id] = anterior;
          else delete copia[atual.id];
          return copia;
        });
      }
    });
  }

  function finalizar() {
    startFinalizar(async () => {
      const r = await finalizarTentativa(attemptId);
      if (r.ok) router.push(`/provas/${documentId}/${attemptId}/resultado`);
      else setErro(r.erro);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      <section className="rounded-lg border border-border bg-card p-5">
        <header className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Questão {atual.numero ?? indice + 1}{" "}
            <span className="text-xs">({indice + 1} de {questoes.length})</span>
          </span>
          {salvando && <Loader2 className="size-4 animate-spin" aria-label="Salvando" />}
        </header>

        {atual.contexto && (
          <div className="mb-4 rounded-md bg-muted/40 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Texto-base
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{atual.contexto}</p>
          </div>
        )}

        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{atual.enunciado}</p>

        <ol className="mt-4 space-y-1.5">
          {atual.alternativas.map((alt) => {
            const letra = alt.letra.toUpperCase();
            const marcada = respostas[atual.id] === letra;
            return (
              <li key={letra}>
                <button
                  type="button"
                  onClick={() => marcar(letra)}
                  aria-pressed={marcada}
                  className={[
                    "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    marcada ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60",
                  ].join(" ")}
                >
                  <span className="font-semibold text-muted-foreground">{letra})</span>
                  <span className="flex-1 [overflow-wrap:anywhere]">{alt.texto}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {erro && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        <footer className="mt-5 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={indice === 0}
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft data-icon="inline-start" /> Anterior
          </Button>
          {indice < questoes.length - 1 ? (
            <Button onClick={() => setIndice((i) => Math.min(questoes.length - 1, i + 1))}>
              Próxima <ChevronRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button onClick={() => setConfirmando(true)}>
              <Flag data-icon="inline-start" /> Finalizar
            </Button>
          )}
        </footer>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{respondidas}</strong> de {questoes.length} respondidas
          </p>
          <div className="mt-3 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {questoes.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndice(i)}
                aria-current={i === indice ? "true" : undefined}
                className={[
                  "h-8 rounded-md border text-xs font-medium transition-colors",
                  i === indice
                    ? "border-primary bg-primary text-primary-foreground"
                    : respostas[q.id]
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {q.numero ?? i + 1}
              </button>
            ))}
          </div>
        </div>

        {confirmando ? (
          <div className="rounded-lg border border-primary/40 bg-card p-4 text-sm">
            <p className="text-foreground">
              Finalizar com {respondidas} de {questoes.length} respondidas? Depois disso não dá para
              alterar.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={finalizar} disabled={finalizando}>
                {finalizando ? <Loader2 className="animate-spin" /> : "Sim, finalizar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmando(false)} disabled={finalizando}>
                Voltar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setConfirmando(true)}>
            <Flag data-icon="inline-start" /> Finalizar prova
          </Button>
        )}
      </aside>
    </div>
  );
}
