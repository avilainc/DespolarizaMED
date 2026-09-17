"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, EyeOff, Loader2, Maximize2, Star } from "lucide-react";
import { alternarFavorito, responderQuestao, revelarGabarito } from "@/features/practice/actions";

type Alternativa = { letra: string; texto: string };

export type QuestaoResumo = {
  id: string;
  enunciado: string | null;
  numero: number | null;
  ano: number | null;
  instituicaoSlug: string | null;
  disciplinaSugerida: string | null;
  alternativas: Alternativa[];
  /** Última resposta do aluno a esta questão, se já respondeu. */
  respostaAnterior?: { letra: string; correta: boolean } | null;
  favorita?: boolean;
};

/**
 * Uma questão do acervo.
 *
 * O gabarito não vem nas props: a tela só o recebe do servidor, ou ao
 * responder (que registra em `practice_answers`) ou ao pedir "ver gabarito".
 * Assim o HTML/RSC da listagem nunca carrega a resposta certa.
 */
export function QuestionCard({
  questao,
  mostrarLinkDetalhe = true,
}: {
  questao: QuestaoResumo;
  mostrarLinkDetalhe?: boolean;
}) {
  const [gabarito, setGabarito] = useState<string | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [favorita, setFavorita] = useState(questao.favorita ?? false);
  const [erro, setErro] = useState<string | null>(null);
  const [respondendo, startResposta] = useTransition();
  const [revelando, startRevelar] = useTransition();
  const [favoritando, startFavorito] = useTransition();

  const anterior = questao.respostaAnterior ?? null;

  function responder(letra: string) {
    if (revelado || respondendo) return;
    setEscolhida(letra);
    setErro(null);
    startResposta(async () => {
      const r = await responderQuestao({ questionId: questao.id, letra });
      if (r.ok) {
        setGabarito(r.dados.gabarito);
        setRevelado(true);
      } else setErro(r.erro);
    });
  }

  function alternarGabarito() {
    if (revelado) {
      setRevelado(false);
      return;
    }
    if (gabarito) {
      setRevelado(true);
      return;
    }
    setErro(null);
    startRevelar(async () => {
      const r = await revelarGabarito(questao.id);
      if (r.ok) {
        setGabarito(r.dados.gabarito);
        setRevelado(true);
      } else setErro(r.erro);
    });
  }

  function favoritar() {
    startFavorito(async () => {
      const r = await alternarFavorito({ tipo: "QUESTION", id: questao.id });
      if (r.ok) setFavorita(r.dados.favorito);
    });
  }

  return (
    <article className="rounded-lg border border-border bg-card p-5" data-testid="question-card" data-question-id={questao.id}>
      <header className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {questao.instituicaoSlug && (
          <Badge variant="secondary">{questao.instituicaoSlug.toUpperCase()}</Badge>
        )}
        {questao.ano && <Badge variant="outline">{questao.ano}</Badge>}
        {questao.numero && (
          <span className="text-muted-foreground">Questão {questao.numero}</span>
        )}
        {anterior && !revelado && (
          <Badge variant={anterior.correta ? "default" : "destructive"}>
            {anterior.correta ? "acertou antes" : "errou antes"}
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-2">
          {questao.disciplinaSugerida && (
            <span
              className="text-muted-foreground"
              title="Disciplina sugerida automaticamente, ainda não revisada"
            >
              {questao.disciplinaSugerida} <span aria-hidden>·</span> sugerida
            </span>
          )}
          <button
            type="button"
            onClick={favoritar}
            disabled={favoritando}
            aria-pressed={favorita}
            aria-label={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            data-testid="favoritar"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Star className={`size-4 ${favorita ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
        </span>
      </header>

      {questao.enunciado && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
          {questao.enunciado}
        </p>
      )}

      <ol className="mt-4 space-y-1.5">
        {questao.alternativas.map((alt) => {
          const letra = alt.letra.toUpperCase();
          const ehCorreta = revelado && gabarito === letra;
          const errouAqui = revelado && escolhida === letra && gabarito !== letra;

          return (
            <li key={letra}>
              <button
                type="button"
                onClick={() => responder(letra)}
                disabled={revelado || respondendo}
                aria-pressed={escolhida === letra}
                data-testid={`alternativa-${letra}`}
                className={[
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default",
                  ehCorreta
                    ? "border-primary bg-primary/10 text-foreground"
                    : errouAqui
                      ? "border-destructive/50 bg-destructive/5 text-foreground"
                      : escolhida === letra
                        ? "border-primary/60 bg-muted"
                        : "border-border hover:bg-muted/60",
                ].join(" ")}
              >
                <span className="font-semibold text-muted-foreground">{letra})</span>
                <span className="flex-1 [overflow-wrap:anywhere]">{alt.texto}</span>
                {respondendo && escolhida === letra && (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                )}
                {ehCorreta && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
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

      <footer className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={alternarGabarito}
          disabled={revelando}
          data-testid="ver-gabarito"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {revelando ? <Loader2 className="size-4 animate-spin" /> : revelado ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {revelado ? "Esconder gabarito" : "Ver gabarito"}
        </button>

        {revelado && gabarito && (
          <span className="text-sm text-muted-foreground" data-testid="resultado">
            Resposta: <strong className="text-foreground">{gabarito}</strong>
            {escolhida && (
              <>
                {" "}
                · você marcou <strong className="text-foreground">{escolhida}</strong>
                {escolhida === gabarito ? " — acertou" : " — errou"}
              </>
            )}
          </span>
        )}

        {mostrarLinkDetalhe && (
          <Link
            href={`/questoes/${questao.id}`}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Maximize2 className="size-4" /> Abrir
          </Link>
        )}
      </footer>
    </article>
  );
}
