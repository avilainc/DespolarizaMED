"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, CircleCheck, CircleX, Eye, EyeOff, Loader2, Maximize2, Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubjectIcon } from "@/components/subject-icon";
import { visualDaDisciplina } from "@/lib/subjects-visual";
import { cn } from "@/lib/utils";
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
 *
 * O visual mudou no redesign, a regra não. A lista antiga era uma pilha de
 * retângulos iguais onde nada dizia de que matéria era a questão sem ler o
 * enunciado inteiro; agora o ícone da disciplina e a banca ficam no topo, as
 * alternativas têm alvo de toque de verdade, e o resultado aparece num bloco
 * próprio em vez de uma frase no rodapé.
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
  const { corVar } = visualDaDisciplina(questao.disciplinaSugerida);
  const acertou = revelado && gabarito != null && escolhida === gabarito;
  const errou = revelado && gabarito != null && escolhida != null && escolhida !== gabarito;

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
    <article
      className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8"
      data-testid="question-card"
      data-question-id={questao.id}
    >
      <header className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-5">
        <SubjectIcon disciplina={questao.disciplinaSugerida} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {questao.instituicaoSlug && (
              <Badge variant="secondary">{questao.instituicaoSlug.toUpperCase()}</Badge>
            )}
            {questao.ano && <Badge variant="outline">{questao.ano}</Badge>}
            {anterior && !revelado && (
              <Badge variant={anterior.correta ? "default" : "destructive"}>
                {anterior.correta ? "acertou antes" : "errou antes"}
              </Badge>
            )}
          </div>
          {questao.disciplinaSugerida && (
            <p
              className="mt-1 text-xs font-medium"
              style={{ color: `var(${corVar})` }}
              title="Disciplina sugerida automaticamente, ainda não revisada"
            >
              {questao.disciplinaSugerida} <span className="text-muted-foreground">· sugerida</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={favoritar}
          disabled={favoritando}
          aria-pressed={favorita}
          aria-label={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          data-testid="favoritar"
          className="-mr-1 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <Star className={cn("size-[1.125rem]", favorita && "fill-amber-400 text-amber-400")} />
        </button>
      </header>

      <div className="px-4 py-4 sm:px-5">
        {questao.enunciado && (
          <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-foreground [overflow-wrap:anywhere]">
            {questao.enunciado}
          </p>
        )}

        <ol className="mt-4 space-y-2">
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
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-[0.9375rem] leading-relaxed transition-colors duration-150 disabled:cursor-default motion-reduce:transition-none",
                    ehCorreta
                      ? "border-emerald-600/40 bg-emerald-500/8"
                      : errouAqui
                        ? "border-destructive/40 bg-destructive/6"
                        : escolhida === letra
                          ? "border-primary/60 bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  {/* A letra num círculo, e não "A)" solto: vira o alvo visual da
                      alternativa e é onde o estado de certo/errado aparece. */}
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      ehCorreta
                        ? "bg-emerald-600 text-white"
                        : errouAqui
                          ? "bg-destructive text-white"
                          : escolhida === letra
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {ehCorreta ? <Check className="size-3.5" strokeWidth={3} /> : errouAqui ? <X className="size-3.5" strokeWidth={3} /> : letra}
                  </span>
                  <span className="flex-1 text-foreground [overflow-wrap:anywhere]">{alt.texto}</span>
                  {respondendo && escolhida === letra && (
                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  )}
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

        {/* Bloco de resultado separado do rodapé: depois de responder, a
            informação que importa é acertou ou não, e ela não pode ficar
            disputando a linha com os botões. Ícone além da cor, porque cor
            sozinha não comunica para quem não a distingue. */}
        {revelado && gabarito && (
          <div
            data-testid="resultado"
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
              acertou
                ? "border-emerald-600/30 bg-emerald-500/8 text-emerald-900 dark:text-emerald-100"
                : errou
                  ? "border-destructive/30 bg-destructive/6 text-foreground"
                  : "border-border bg-muted/50 text-foreground",
            )}
          >
            {acertou ? (
              <CircleCheck className="mt-px size-[1.125rem] shrink-0 text-emerald-600" aria-hidden />
            ) : errou ? (
              <CircleX className="mt-px size-[1.125rem] shrink-0 text-destructive" aria-hidden />
            ) : (
              <Eye className="mt-px size-[1.125rem] shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span>
              {acertou && <strong className="font-semibold">Você acertou. </strong>}
              {errou && <strong className="font-semibold">Você errou. </strong>}
              Gabarito: <strong className="font-semibold">{gabarito}</strong>
              {escolhida && !acertou && (
                <>
                  {" "}
                  · você marcou <strong className="font-semibold">{escolhida}</strong>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-muted/30 px-4 py-2.5 text-sm sm:px-5">
        {questao.numero && (
          <span className="text-xs font-medium text-muted-foreground">Questão {questao.numero}</span>
        )}
        <button
          type="button"
          onClick={alternarGabarito}
          disabled={revelando}
          data-testid="ver-gabarito"
          className="inline-flex items-center gap-1.5 rounded-md py-1 font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {revelando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : revelado ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
          {revelado ? "Esconder gabarito" : "Ver gabarito"}
        </button>

        {mostrarLinkDetalhe && (
          <Link
            href={`/questoes/${questao.id}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Maximize2 className="size-4" /> Abrir
          </Link>
        )}
      </footer>
    </article>
  );
}
