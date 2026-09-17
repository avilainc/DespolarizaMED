import { ImageResponse } from "next/og";

/**
 * Imagem de compartilhamento (WhatsApp, Instagram, X, LinkedIn).
 *
 * Substitui o `public/og.png`, que era o emblema de 512px esticado para
 * 1200×630: saía visivelmente borrado, sem headline e sem endereço. Colado num
 * grupo de WhatsApp, não dizia o que é o produto — que é a única função que
 * uma imagem de compartilhamento tem.
 *
 * Gerada em vez de desenhada porque não depende de designer nem de arquivo
 * binário no repositório: o texto acompanha o site, e mudar a headline é mudar
 * uma string. Sem fonte externa de propósito — buscar fonte na geração
 * adicionaria rede a um caminho que o build percorre sem ela.
 *
 * As cores vêm da paleta medida no emblema (ver o comentário no topo de
 * `globals.css`), em hex porque aqui não há CSS custom property.
 */
export const alt =
  "DespolarizaMED — preparação para vestibulares de Medicina: aulas, banco de questões, provas e plantões ao vivo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARINHO = "#184878";
const LARANJA = "#fc7824";
/* #4884c0 (o azul do disco do emblema) mede só 2.97:1 sobre este fundo; este
   tom claro dá 6.46:1. O endereço do site é o que a pessoa precisa conseguir
   ler numa miniatura de WhatsApp. */
const AZUL_LEGIVEL = "#9ec5e8";
const TEXTO_SUAVE = "#cfe0f2";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${MARINHO} 0%, #0f2d4d 100%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Faixa laranja no topo: a única cor quente da marca, e o que faz a
            imagem ser reconhecida na rolagem antes de alguém ler o texto.
            Filho do flex, não posicionada: dentro de um pai com padding,
            `position: absolute` + `width: 100%` resolve contra a caixa de
            conteúdo e a faixa para antes da borda. */}
        <div style={{ display: "flex", height: 12, background: LARANJA }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: 72,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
            <span>Despolariza</span>
            <span style={{ color: LARANJA }}>MED</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: -1.5,
                maxWidth: 940,
              }}
            >
              Uma jornada completa de preparação, não apenas videoaulas.
            </div>
            <div style={{ marginTop: 28, fontSize: 30, color: TEXTO_SUAVE, maxWidth: 900 }}>
              Aulas, banco com mais de 26 mil questões, provas antigas resolvidas e plantões ao
              vivo.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 26,
              color: AZUL_LEGIVEL,
            }}
          >
            <span>despolarizamed.com.br</span>
            <span style={{ color: TEXTO_SUAVE }}>Biologia · Física · Química</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
