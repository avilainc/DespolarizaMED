const sharp = require('sharp')
const path = require('path')

// Simple corner-sampled chroma-key background removal.
// Good enough for logos on a flat white/solid background.
async function removeBg(inputPath, outputPath, { threshold = 18, feather = 30 } = {}) {
  const img = sharp(inputPath)
  const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true })
  const w = info.width, h = info.height, ch = info.channels

  function px(x, y) {
    const idx = (y * w + x) * ch
    return [data[idx], data[idx + 1], data[idx + 2]]
  }

  // Sample background color from the 4 corners (average).
  const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)]
  const bg = [0, 1, 2].map((i) => Math.round(corners.reduce((s, c) => s + c[i], 0) / 4))

  const out = Buffer.from(data)
  for (let i = 0; i < w * h; i++) {
    const idx = i * ch
    const r = data[idx], g = data[idx + 1], b = data[idx + 2]
    const dist = Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)
    let alpha = data[idx + 3]
    if (dist < threshold) {
      alpha = 0
    } else if (dist < threshold + feather) {
      const t = (dist - threshold) / feather
      alpha = Math.round(alpha * t)
    }
    out[idx + 3] = alpha
  }

  await sharp(out, { raw: { width: w, height: h, channels: ch } })
    .png()
    .toFile(outputPath)

  console.log(path.basename(inputPath), '-> bg', bg, '-> ', path.basename(outputPath))
}

const jobs = [
  ['einstein.webp', 'einstein.png', {}],
  ['fameca.jpg', 'fameca.png', {}],
  ['fmj.png', 'fmj.png', {}],
  ['uece.png', 'uece.png', {}],
  ['ufmg.png', 'ufmg.png', {}],
  ['unesp.jpg', 'unesp.png', {}],
  ['unicamp.jpg', 'unicamp.png', {}],
  ['usp.jpg', 'usp.png', {}],
  ['unifesp.png', 'unifesp.png', { threshold: 24, feather: 20 }],
]

;(async () => {
  const dir = path.join(__dirname, '..', 'public', 'vestibulares')
  for (const [inFile, outFile, opts] of jobs) {
    const inPath = path.join(dir, inFile)
    const outPath = path.join(dir, outFile.replace('.png', '') + '-cutout.png')
    await removeBg(inPath, outPath, opts)
  }
})()
