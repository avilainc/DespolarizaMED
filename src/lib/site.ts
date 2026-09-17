/**
 * Endereço público do site, num lugar só.
 *
 * Usado pelo `metadataBase`, pelo `robots.txt`, pelo `sitemap.xml` e pelo
 * JSON-LD. Cada um deles já teve (ou teria) a URL escrita à mão, e é assim que
 * um canonical acaba apontando para um domínio diferente do sitemap.
 *
 * `BETTER_AUTH_URL` é a fonte porque já precisa ser o endereço público e
 * correto para a autenticação funcionar — se estiver errada, o login quebra
 * antes de o SEO importar. O fallback cobre o build, que roda sem env de
 * produção (ver o Dockerfile).
 *
 * Detalhe que engana: `robots.txt` e `sitemap.xml` são ESTÁTICOS, gerados no
 * build, então congelam o valor que o Dockerfile passa
 * (`BETTER_AUTH_URL=https://despolarizamed.com.br`). Já o canonical vem do
 * metadata de uma página dinâmica e usa o valor de RUNTIME. Em produção os
 * dois coincidem; se um dia o build e o runtime receberem endereços
 * diferentes, o sitemap vai apontar para um domínio e o canonical para outro,
 * e o sintoma não aparece em nenhum teste local.
 */
export const SITE_URL = (process.env.BETTER_AUTH_URL ?? "https://despolarizamed.com.br").replace(
  /\/$/,
  "",
);

/**
 * Rotas que nunca devem ser indexadas: área logada, painéis e API.
 *
 * Elas já exigem sessão, então o buscador receberia um redirect para o login —
 * mas aparecer no índice com título de página privada é ruim de qualquer
 * forma, e gasta orçamento de rastreio à toa.
 */
export const ROTAS_PRIVADAS = [
  "/admin",
  "/api",
  "/v1",
  "/dashboard",
  "/gestao",
  "/professor",
  "/minha-conta",
  "/questoes",
  "/provas",
  "/plano",
  "/plantoes",
  "/calendario",
  "/atividades",
  "/desempenho",
  "/favoritos",
  "/glossario",
  "/busca",
  "/disciplinas",
  "/aulas",
  "/planos",
];

/** As páginas que um visitante anônimo alcança de fato. */
export const ROTAS_PUBLICAS = ["/", "/blog", "/login", "/cadastro"];
