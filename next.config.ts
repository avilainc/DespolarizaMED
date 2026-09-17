import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * Headers de segurança — a resposta não trazia nenhum.
 *
 * Aplicados na app em vez de só no Caddy de propósito: a app é a única coisa
 * que acompanha o código no deploy. Um header configurado apenas no proxy
 * some no dia em que a app for servida por outro caminho, e some sem sinal.
 * Se o Caddy também mandar o mesmo header, o valor dele prevalece — não há
 * conflito, só redundância barata.
 *
 * Não há CSP aqui. Uma CSP séria exige inventariar cada origem de script,
 * estilo, fonte e imagem (Next injeta inline, o Payload roda no /admin, há
 * fontes do Google), e uma CSP mal ajustada quebra a página em produção sem
 * aviso. Fica como passo próprio, com `Content-Security-Policy-Report-Only`
 * primeiro.
 */
const headersDeSeguranca = [
  // HSTS: o site já é HTTPS; isto impede o primeiro acesso em texto puro.
  // `preload` foi deixado de fora: entrar na lista de preload dos navegadores
  // é difícil de desfazer e vale só depois de os subdomínios estarem certos.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Impede o navegador de "adivinhar" o tipo de um arquivo servido por nós —
  // relevante porque servimos .vtt, .ts de vídeo e PNG de figura por rota.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Sem iframe de terceiro: não há caso de uso, e fecha clickjacking sobre as
  // telas autenticadas.
  { key: "X-Frame-Options", value: "DENY" },
  // O caminho completo não vaza para fora: uma URL de prova ou de tentativa
  // não deve chegar ao site que o aluno abrir depois.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Não usamos nenhum destes; negar por padrão evita que um script de
  // terceiro peça em nosso nome.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // standalone: o build emite .next/standalone com um server.js e so as
  // dependencias usadas, o que permite uma imagem de runtime sem node_modules
  // completo (padrao de deploy da casa: build local -> tgz -> imagem).
  output: "standalone",

  async headers() {
    return [{ source: "/:path*", headers: headersDeSeguranca }];
  },
};

export default withPayload(nextConfig);
