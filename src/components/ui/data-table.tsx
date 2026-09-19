import { cn } from "@/lib/utils";

export type Coluna<T> = {
  chave: string;
  cabecalho: React.ReactNode;
  celula: (linha: T) => React.ReactNode;
  /** Alinha à direita (números). */
  numerico?: boolean;
  /** Fica de fora do cartão do celular — detalhe que não vale a altura. */
  soNoDesktop?: boolean;
  /** No celular vira o título do cartão, sem rótulo ao lado. */
  titulo?: boolean;
  largura?: string;
};

/**
 * Tabela que vira lista de cartões no celular.
 *
 * O motivo é literal: `overflow-x-auto` numa tabela de 4 colunas dentro de uma
 * tela de 390px dá uma barra de rolagem horizontal dentro da página, e era
 * disso que vinham os estouros de largura nas capturas do professor e da
 * administração. Aqui a mesma informação é renderizada duas vezes — `<table>`
 * a partir de `md`, cartões abaixo disso — e nenhuma das duas rola de lado.
 *
 * Uma marcação só, com `display` trocando, não resolveria: `<td>` virando
 * bloco perde a associação com o `<th>`, e o leitor de tela passa a ler quatro
 * valores sem dizer o que cada um é. Por isso o cartão repete o rótulo.
 */
export function DataTable<T>({
  colunas,
  linhas,
  chave,
  vazio,
  hrefDaLinha,
  className,
}: {
  colunas: Coluna<T>[];
  linhas: T[];
  chave: (linha: T) => string;
  vazio?: React.ReactNode;
  hrefDaLinha?: (linha: T) => string | null;
  className?: string;
}) {
  if (linhas.length === 0) return <>{vazio ?? null}</>;

  const colunasCartao = colunas.filter((c) => !c.soNoDesktop);
  const colunaTitulo = colunasCartao.find((c) => c.titulo);
  const colunasDetalhe = colunasCartao.filter((c) => !c.titulo);

  return (
    <div className={className}>
      {/* desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-xs md:block">
        <table className="w-full table-fixed border-collapse text-[0.875rem]">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              {colunas.map((c) => (
                <th
                  key={c.chave}
                  scope="col"
                  style={c.largura ? { width: c.largura } : undefined}
                  className={cn(
                    "t-eyebrow px-4 py-3 text-left font-semibold",
                    c.numerico && "text-right",
                  )}
                >
                  {c.cabecalho}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr
                key={chave(linha)}
                className="border-b border-border transition-colors last:border-0 hover:bg-surface-subtle/60"
              >
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    className={cn(
                      "px-4 py-3 align-middle text-text-secondary",
                      c.numerico && "text-right tabular",
                    )}
                  >
                    <div className="min-w-0 [overflow-wrap:anywhere]">{c.celula(linha)}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* celular */}
      <ul className="space-y-3 md:hidden">
        {linhas.map((linha) => {
          const href = hrefDaLinha?.(linha) ?? null;
          const corpo = (
            <>
              {colunaTitulo && (
                <p className="t-card-title mb-2 text-text-primary [overflow-wrap:anywhere]">
                  {colunaTitulo.celula(linha)}
                </p>
              )}
              <dl className="grid gap-x-4 gap-y-2 text-[0.875rem] sm:grid-cols-2">
                {colunasDetalhe.map((c) => (
                  <div key={c.chave} className="min-w-0">
                    <dt className="t-eyebrow">{c.cabecalho}</dt>
                    <dd className="mt-0.5 text-text-secondary [overflow-wrap:anywhere]">
                      {c.celula(linha)}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          );

          return (
            <li key={chave(linha)}>
              {href ? (
                <a
                  href={href}
                  className="block rounded-xl border border-border bg-surface p-4 shadow-xs cartao-interativo"
                >
                  {corpo}
                </a>
              ) : (
                <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
                  {corpo}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
