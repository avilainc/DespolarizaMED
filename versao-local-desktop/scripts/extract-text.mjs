import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const FILE = process.argv[2]
const RANGE = process.argv[3] // "1-10" or "5"

const doc = await pdfjsLib.getDocument({ url: FILE, disableWorker: true, useSystemFonts: true }).promise
console.log('TOTAL PAGES', doc.numPages)

let [start, end] = RANGE.includes('-') ? RANGE.split('-').map(Number) : [Number(RANGE), Number(RANGE)]
end = Math.min(end, doc.numPages)

for (let p = start; p <= end; p++) {
  const page = await doc.getPage(p)
  const content = await page.getTextContent()
  const text = content.items.map((it) => it.str).join(' ')
  console.log(`\n===== PAGE ${p} =====\n${text}`)
}
