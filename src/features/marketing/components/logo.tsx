import Image from "next/image";
import Link from "next/link";

/**
 * Marca do DespolarizaMED.
 *
 * O emblema é um PNG, não SVG: o original veio rasterizado e vetorizar à mão
 * mudaria o desenho. Como ele aparece pequeno (32–48 px) e em telas retina,
 * a fonte é a versão de 512 px e o Next reduz — reduzir mantém nitidez,
 * ampliar não manteria.
 *
 * `priority` no cabeçalho porque o emblema está acima da dobra: sem isso ele
 * entra depois do texto e a marca "pisca" no primeiro carregamento.
 */
export function Logo({
  tamanho = 36,
  comNome = true,
  href = "/",
  prioridade = false,
}: {
  tamanho?: number;
  comNome?: boolean;
  href?: string | null;
  prioridade?: boolean;
}) {
  const conteudo = (
    <>
      <Image
        src="/logo.png"
        alt="DespolarizaMED"
        width={tamanho}
        height={tamanho}
        priority={prioridade}
        className="shrink-0"
      />
      {comNome && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Despolariza<span className="text-primary">MED</span>
        </span>
      )}
    </>
  );

  if (!href) {
    return <span className="inline-flex items-center gap-2">{conteudo}</span>;
  }

  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="DespolarizaMED">
      {conteudo}
    </Link>
  );
}
