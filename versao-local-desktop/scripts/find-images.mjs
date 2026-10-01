import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const FILE = process.argv[2]
const PAGE_NUMS = process.argv[3].split(',').map(Number)
const SCALE = 3 // must match render-pages.js scale

const doc = await pdfjsLib.getDocument({ url: FILE, disableWorker: true, useSystemFonts: true }).promise

for (const pageNum of PAGE_NUMS) {
  const page = await doc.getPage(pageNum)
  const viewport = page.getViewport({ scale: SCALE })
  const ops = await page.getOperatorList()
  const OPS = pdfjsLib.OPS
  console.log(`\n--- page ${pageNum} (${Math.round(viewport.width)}x${Math.round(viewport.height)}) ---`)
  // Rastreia a CTM (matriz de transformação corrente) manualmente,
  // seguindo save/restore/transform, pra saber onde cada imagem cai.
  let ctm = viewport.transform.slice() // [a,b,c,d,e,f] já em pixels de saída
  const stack = []
  const mul = (m1, m2) => [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    const args = ops.argsArray[i]
    if (fn === OPS.save) stack.push(ctm.slice())
    else if (fn === OPS.restore) ctm = stack.pop() || ctm
    else if (fn === OPS.transform) ctm = mul(ctm, args)
    else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintImageMaskXObject) {
      // Imagem unitária vai de (0,0) a (1,1) no espaço do objeto; aplica CTM
      // aos 4 cantos pra achar o bounding box em pixels de saída.
      const corners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([x, y]) => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]])
      const xs = corners.map((c) => c[0])
      const ys = corners.map((c) => c[1])
      const left = Math.round(Math.min(...xs))
      const right = Math.round(Math.max(...xs))
      const top = Math.round(Math.min(...ys))
      const bottom = Math.round(Math.max(...ys))
      console.log(`  image: name=${args[0]} box=[${left},${top},${right - left},${bottom - top}]`)
    }
  }
}
