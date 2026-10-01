// uso: node scripts/ocr-pdf.js <pdf> <p1-p2> <outTxt> [skipPages(csv)]
// Renderiza cada página; se a página tiver uma linha vertical central (layout 2 colunas),
// corta em 2 e faz OCR por coluna (mais confiável que o layout-analysis automático do tesseract,
// que às vezes intercala as colunas erradamente). Se não detectar divisor, faz OCR da página inteira.
// Escreve texto concatenado com marcadores ===== PAGE N ===== (mesmo formato do extract-text.mjs).
const { pdf } = require('pdf-to-img')
const sharp = require('sharp')
const { createWorker } = require('tesseract.js')
const fs = require('fs')

const [, , FILE, RANGE, OUT, SKIP_ARG] = process.argv
const [P1, P2] = RANGE.split('-').map(Number)
const SKIP = new Set((SKIP_ARG || '').split(',').filter(Boolean).map(Number))

const ONECOL = new Set((process.env.ONECOL || '').split(',').filter(Boolean).map(Number))

async function main() {
  const doc = await pdf(FILE, { scale: 3, docInitParams: { wasmUrl: 'node_modules/pdf-to-img/node_modules/pdfjs-dist/wasm/' } })
  console.log('total pages', doc.length)
  const worker = await createWorker('por')
  let out = ''
  let i = 1
  for await (const image of doc) {
    if (i >= P1 && i <= P2 && !SKIP.has(i)) {
      out += `\n===== PAGE ${i} =====\n`
      const twoCol = !ONECOL.has(i)
      if (twoCol) {
        const meta = await sharp(image).metadata()
        const W = meta.width, H = meta.height
        const leftEnd = Math.floor(W * 0.474)
        const rightStart = Math.floor(W * 0.504)
        const lBuf = await sharp(image).extract({ left: 0, top: 0, width: leftEnd, height: H }).grayscale().normalize().threshold(140).toBuffer()
        const rBuf = await sharp(image).extract({ left: rightStart, top: 0, width: W - rightStart, height: H }).grayscale().normalize().threshold(140).toBuffer()
        const rl = await worker.recognize(lBuf)
        const rr = await worker.recognize(rBuf)
        out += rl.data.text + '\n' + rr.data.text + '\n'
        console.log('page', i, 'ok (2 col)')
      } else {
        const { data: { text } } = await worker.recognize(image)
        out += text + '\n'
        console.log('page', i, 'ok (1 col)')
      }
      fs.writeFileSync(OUT, out)
    }
    i++
    if (i > P2) break
  }
  await worker.terminate()
  fs.writeFileSync(OUT, out)
  console.log('done ->', OUT)
}
main().catch(e => { console.error('ERR', e); process.exit(1) })
