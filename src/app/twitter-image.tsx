/**
 * O X/Twitter usa a convenção `twitter-image`, separada de `opengraph-image`.
 * Sem este arquivo, o card sairia sem imagem (ou com a antiga) mesmo com o
 * `og:image` correto.
 *
 * Reexporta a mesma imagem em vez de duplicar o layout: duas artes que deviam
 * ser iguais e moram em arquivos diferentes divergem na primeira mudança de
 * headline.
 */
export { alt, size, contentType, default } from "./opengraph-image";
