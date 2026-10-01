const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const PAGES = 'C:/Users/Paulo/AppData/Local/Temp/claude/D--Users-Paulo-Desktop-Claude-Code/4e8469bc-f671-4dbc-8f13-7f33a42b20ba/scratchpad/pages'
const OUT = path.join(__dirname, '..', 'public', 'simulados')

const jobs = [
  // Famerp 2026
  { src: `${PAGES}/famerp/page3.png`, out: `${OUT}/famerp2026/q1.png`, box: [220, 265, 575, 535] },
  { src: `${PAGES}/famerp/page10.png`, out: `${OUT}/famerp2026/q27.png`, box: [76, 261, 806, 571] },
  { src: `${PAGES}/famerp/page11.png`, out: `${OUT}/famerp2026/q30.png`, box: [44, 246, 800, 554] },
  { src: `${PAGES}/famerp/page12.png`, out: `${OUT}/famerp2026/q33.png`, box: [38, 277, 819, 403] },
  { src: `${PAGES}/famerp/page12.png`, out: `${OUT}/famerp2026/q35.png`, box: [1008, 189, 617, 907] },
  { src: `${PAGES}/famerp/page13.png`, out: `${OUT}/famerp2026/q37.png`, box: [1065, 208, 478, 681] },
  { src: `${PAGES}/famerp/page14.png`, out: `${OUT}/famerp2026/q39.png`, box: [1084, 233, 491, 706] },
  { src: `${PAGES}/famerp/page15.png`, out: `${OUT}/famerp2026/q41.png`, box: [107, 189, 725, 599] },
  { src: `${PAGES}/famerp/page16.png`, out: `${OUT}/famerp2026/q45.png`, box: [113, 353, 756, 453] },
  { src: `${PAGES}/famerp/page16.png`, out: `${OUT}/famerp2026/q46.png`, box: [983, 321, 655, 435] },
  { src: `${PAGES}/famerp/page17.png`, out: `${OUT}/famerp2026/q49.png`, box: [107, 832, 725, 541] },
  { src: `${PAGES}/famerp/page18.png`, out: `${OUT}/famerp2026/q51.png`, box: [101, 283, 756, 221] },
  // Famema 2026
  { src: `${PAGES}/famema/page5.png`, out: `${OUT}/famema2026/q16.png`, box: [1128, 1235, 422, 441] },
  { src: `${PAGES}/famema/page8.png`, out: `${OUT}/famema2026/q25.png`, box: [977, 1241, 648, 504] },
  { src: `${PAGES}/famema/page12.png`, out: `${OUT}/famema2026/q37.png`, box: [901, 120, 750, 2211] },
  { src: `${PAGES}/famema/page13.png`, out: `${OUT}/famema2026/q40.png`, box: [945, 353, 706, 403] },
]

;(async () => {
  for (const job of jobs) {
    fs.mkdirSync(path.dirname(job.out), { recursive: true })
    const [left, top, width, height] = job.box
    await sharp(job.src).extract({ left, top, width, height }).png().toFile(job.out)
    console.log('cropped', job.out)
  }
})().catch((e) => {
  console.error('ERR', e)
  process.exit(1)
})
