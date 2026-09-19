import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Migalha = { rotulo: string; href?: string };

/**
 * Cabeçalho de página: migalha, título, descrição e ações.
 *
 * Existe para que toda tela abra do mesmo jeito. Antes cada página escrevia o
 * próprio `<h1 className="text-2xl font-bold">` e a volta era um "← Provas"
 * solto, em tamanho e posição diferentes em cada rota.
 */
export function PageHeader({
  migalhas,
  titulo,
  descricao,
  acoes,
  aside,
  className,
}: {
  migalhas?: Migalha[];
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  /** Botões à direita do título. */
  acoes?: React.ReactNode;
  /** Bloco abaixo da descrição (chips, contadores, legenda). */
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-7", className)}>
      {migalhas && migalhas.length > 0 && (
        <nav aria-label="Trilha de navegação" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-text-muted">
            {migalhas.map((m, i) => (
              <li key={`${m.rotulo}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />}
                {m.href ? (
                  <Link
                    href={m.href}
                    className="rounded-sm transition-colors hover:text-text-primary"
                  >
                    {m.rotulo}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-text-secondary">
                    {m.rotulo}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Coluna no celular, linha a partir de `sm`.
          Com `flex-wrap` numa linha só, um botão de ação de 200px ao lado do
          título deixava "Banco de questões" com ~150px em 390px — o título
          quebrava em três linhas e a descrição virava uma coluna de uma
          palavra por linha. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-x-6">
        <div className="min-w-0 sm:flex-1">
          <h1 className="t-page-title text-text-primary">{titulo}</h1>
          {descricao && <p className="mt-2 max-w-[62ch] text-text-secondary">{descricao}</p>}
        </div>
        {acoes && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 [&>*]:max-sm:flex-1">
            {acoes}
          </div>
        )}
      </div>

      {aside && <div className="mt-5">{aside}</div>}
    </header>
  );
}

/**
 * Título de seção dentro de uma página. Sempre com ícone: é o que permite
 * varrer uma página longa (plantões, desempenho) e achar a seção certa sem ler.
 */
export function SectionHeading({
  icone: Icone,
  children,
  acao,
  descricao,
  className,
}: {
  icone?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  acao?: React.ReactNode;
  descricao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0">
        <h2 className="t-section flex items-center gap-2 text-text-primary">
          {Icone && <Icone className="size-[1.125rem] shrink-0 text-brand-600" aria-hidden />}
          <span className="min-w-0">{children}</span>
        </h2>
        {descricao && <p className="t-meta mt-1">{descricao}</p>}
      </div>
      {acao && <div className="shrink-0 text-[0.8125rem]">{acao}</div>}
    </div>
  );
}
