/**
 * Cabeçalho de uma faixa da landing: sobretítulo, título e uma frase.
 *
 * Existia copiado em cinco arquivos, cada um com um tamanho de título
 * diferente (`text-3xl sm:text-4xl` num, `t-display` noutro) e um espaçamento
 * diferente abaixo dele. Quem rola a página lê isso como cinco páginas
 * coladas, não como uma. Aqui é um componente só, e o sobretítulo dá à seção
 * um rótulo curto — o que o olho pega antes de ler o título.
 */
export function CabecalhoDeSecao({
  sobretitulo,
  titulo,
  descricao,
  alinhamento = "centro",
}: {
  sobretitulo: string;
  titulo: string;
  descricao?: string;
  alinhamento?: "centro" | "esquerda";
}) {
  const centro = alinhamento === "centro";
  return (
    <div className={centro ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="t-eyebrow text-brand-600">{sobretitulo}</p>
      <h2 className="t-display mt-3 text-text-primary">{titulo}</h2>
      {descricao && (
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-text-secondary">{descricao}</p>
      )}
    </div>
  );
}
