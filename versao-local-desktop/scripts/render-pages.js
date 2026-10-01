const { pdf } = require('pdf-to-img')
const path = require('path')
const fs = require('fs')

const FILE = process.argv[2]
const OUT_DIR = process.argv[3]
const PAGES = process.argv[4].split(',').map(Number) // 1-indexed

;(async () => {
  const doc = await pdf(FILE, { scale: 3, docInitParams: { wasmUrl: 'node_modules/pdf-to-img/node_modules/pdfjs-dist/wasm/' } })
  console.log('total pages', doc.length)
  let i = 1
  for await (const image of doc) {
    if (PAGES.includes(i)) {
      const out = path.join(OUT_DIR, `page${i}.png`)
      fs.writeFileSync(out, image)
      console.log('saved', out)
    }
    i++
  }
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
