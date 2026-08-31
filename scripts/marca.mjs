/**
 * Gera as imagens da marca a partir do emblema oficial: pnpm marca
 *
 * O círculo foi medido, não estimado. Varrendo a linha central da imagem, o
 * anel branco vai de x=66 a x=445, o que dá centro (256,256) e raio 190.
 * Detecção automática por cor não serve: o interior do emblema usa as mesmas
 * cores do fundo (teal na sinapse, escuro no neurônio) e a varredura para na
 * borda errada.
 *
 * O SVG da máscara precisa de xmlns e viewBox. Sem eles o sharp renderiza em
 * outra escala, o composite alinha no canto e o emblema sai cortado — foi o
 * que aconteceu nas primeiras tentativas.
 */
import sharp from "sharp";

const SRC = "public/web-app-manifest-512x512.png";
const CX = 256, CY = 256, R = 190;
const LADO = R * 2;

const MASCARA = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">` +
    `<circle cx="${R}" cy="${R}" r="${R}" fill="#fff"/></svg>`,
);

async function emblema(tamanho) {
  return sharp(SRC)
    .extract({ left: CX - R, top: CY - R, width: LADO, height: LADO })
    .composite([{ input: MASCARA, blend: "dest-in" }])
    .resize(tamanho, tamanho)
    .png()
    .toBuffer();
}

await sharp(await emblema(512)).toFile("public/logo.png");
console.log("public/logo.png       emblema circular, fundo transparente");

// Open Graph: é a imagem que aparece quando o link é compartilhado no
// WhatsApp. Fundo no azul-escuro da marca (#182430), medido do próprio logo.
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#182430" } })
  .composite([{ input: await emblema(440), top: 95, left: 380 }])
  .png()
  .toFile("public/og.png");
console.log("public/og.png         1200x630 para compartilhamento");
