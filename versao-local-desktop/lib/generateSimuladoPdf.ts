import jsPDF from 'jspdf'
import type { ExamQuestion } from './examBank'
import { subjectColor } from './subjectColors'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN_X = 40
const CONTENT_W = PAGE_W - MARGIN_X * 2
const TOP_MARGIN = 62
const BOTTOM_MARGIN = 60

const NAVY = '#12203D'
const ORANGE = '#F4801E'
const TEAL = '#4FC7B8'
const PRIMARY = '#4F80AC'
const MUTED = '#64748B'
const MUTED2 = '#475569'
const FAINT = '#94A3B8'
const EDGE = '#E2E8F0'
const BG = '#F7F8FA'

function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('sem canvas context'))
      ctx.drawImage(img, 0, 0)
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => reject(new Error(`falha ao carregar imagem: ${url}`))
    img.src = url
  })
}

type Assets = {
  logo: { dataUrl: string; width: number; height: number }
  ig: { dataUrl: string; width: number; height: number }
  yt: { dataUrl: string; width: number; height: number }
  wa: { dataUrl: string; width: number; height: number }
  questionImages: Record<string, { dataUrl: string; width: number; height: number }>
}

async function loadAssets(questions: ExamQuestion[]): Promise<Assets> {
  const [logo, ig, yt, wa] = await Promise.all([
    loadImageAsDataUrl('/logo-icon.png'),
    loadImageAsDataUrl('/pdf/icon-instagram.png'),
    loadImageAsDataUrl('/pdf/icon-youtube.png'),
    loadImageAsDataUrl('/pdf/icon-whatsapp.png'),
  ])
  const questionImages: Record<string, { dataUrl: string; width: number; height: number }> = {}
  for (const q of questions) {
    if (q.image) {
      try {
        questionImages[q.image] = await loadImageAsDataUrl(q.image)
      } catch {
        // se a imagem falhar ao carregar, a questão simplesmente não mostra figura no PDF
      }
    }
  }
  return { logo, ig, yt, wa, questionImages }
}

function drawWordmark(doc: jsPDF, x: number, y: number, sizeWhite: number, sizeOrange: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(sizeWhite)
  doc.setTextColor('#FFFFFF')
  doc.text('Despolariza', x, y)
  const w = doc.getTextWidth('Despolariza')
  doc.setFontSize(sizeOrange)
  doc.setTextColor(ORANGE)
  doc.text('Med', x + w, y)
}

function drawCapa(doc: jsPDF, assets: Assets, subject: string, questionCount: number) {
  doc.setFillColor(BG)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // header bar
  doc.setFillColor(NAVY)
  doc.rect(0, 0, PAGE_W, 78, 'F')
  doc.addImage(assets.logo.dataUrl, 'PNG', MARGIN_X, 22, 34, 34)
  drawWordmark(doc, MARGIN_X + 46, 44, 17, 17)

  // title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(38)
  doc.setTextColor(NAVY)
  doc.text('Simulado de', MARGIN_X, 150)
  doc.text(subject, MARGIN_X, 194)

  // divider
  doc.setFillColor(ORANGE)
  doc.roundedRect(MARGIN_X, 218, 70, 5, 2.5, 2.5, 'F')

  // description
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11.5)
  doc.setTextColor(MUTED2)
  const desc = `${questionCount} questões reais de vestibular, extraídas de provas oficiais e conferidas contra o gabarito original.`
  const descLines = doc.splitTextToSize(desc, 380)
  doc.text(descLines, MARGIN_X, 246)

  // info box
  const boxY = 300
  const boxW = 340
  const boxH = 168
  doc.setDrawColor(EDGE)
  doc.setFillColor('#FFFFFF')
  doc.roundedRect(MARGIN_X, boxY, boxW, boxH, 8, 8, 'FD')

  const rowLabel = (label: string, value: string, y: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(MUTED)
    doc.text(label, MARGIN_X + 22, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(NAVY)
    doc.text(value, MARGIN_X + boxW - 22, y, { align: 'right' })
  }
  const dataStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  rowLabel('Gerado em', dataStr, boxY + 30)
  rowLabel('Questões', String(questionCount), boxY + 58)
  rowLabel('Tempo sugerido', `${Math.round(questionCount * 1.5)} min`, boxY + 86)

  doc.setDrawColor(EDGE)
  doc.line(MARGIN_X + 22, boxY + 104, MARGIN_X + boxW - 22, boxY + 104)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(TEAL)
  doc.text('Gabarito oficial ao final do documento', MARGIN_X + 22, boxY + 130)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED2)
  const noteLines = doc.splitTextToSize('Conferido questão a questão contra o gabarito oficial da banca — nunca respondido por IA.', boxW - 44)
  doc.text(noteLines, MARGIN_X + 22, boxY + 146)

  // footer
  doc.setDrawColor(EDGE)
  doc.line(0, PAGE_H - 50, PAGE_W, PAGE_H - 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(FAINT)
  doc.text('despolarizamed.com', MARGIN_X, PAGE_H - 26)
  doc.text('Uso pessoal do aluno — não distribuir', PAGE_W - MARGIN_X, PAGE_H - 26, { align: 'right' })
}

function drawQuestionPageHeader(doc: jsPDF, assets: Assets, subject: string, pageNum: number) {
  doc.setFillColor('#FFFFFF')
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // marca d'água — logo grande, baixa opacidade, ao longo de todas as
  // páginas de questões (pedido explícito do Paulo)
  const wmSize = 300
  const gState = (doc as any).GState({ opacity: 0.055 })
  ;(doc as any).setGState(gState)
  doc.addImage(assets.logo.dataUrl, 'PNG', PAGE_W / 2 - wmSize / 2, PAGE_H / 2 - wmSize / 2, wmSize, wmSize)
  ;(doc as any).setGState((doc as any).GState({ opacity: 1 }))

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(NAVY)
  doc.text(`DespolarizaMed · Simulado de ${subject}`, MARGIN_X, 32)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(FAINT)
  doc.text(String(pageNum), PAGE_W - MARGIN_X, 32, { align: 'right' })
  doc.setDrawColor(EDGE)
  doc.line(MARGIN_X, 42, PAGE_W - MARGIN_X, 42)
}

function drawGabarito(doc: jsPDF, assets: Assets, subject: string, pageNum: number, questions: ExamQuestion[]) {
  drawQuestionPageHeader(doc, assets, subject, pageNum)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(NAVY)
  doc.text('Gabarito oficial', MARGIN_X, 84)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(MUTED)
  doc.text('Confira suas respostas — conferido individualmente contra o gabarito de cada banca.', MARGIN_X, 102)

  const cols = 5
  const colW = CONTENT_W / cols
  const rowH = 34
  let y = 140
  questions.forEach((q, i) => {
    const col = i % cols
    if (col === 0 && i !== 0) y += rowH
    const x = MARGIN_X + col * colW
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(subjectColor(q.subject))
    const num = String(i + 1).padStart(2, '0')
    doc.text(`${num}.`, x, y)
    doc.setTextColor(NAVY)
    doc.text(q.correct_option, x + 26, y)
  })
}

function drawContracapa(doc: jsPDF, assets: Assets) {
  doc.setFillColor(BG)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  let y = 96
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(NAVY)
  doc.text('SOBRE ESTE SIMULADO', MARGIN_X, y)
  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(MUTED2)
  const about = doc.splitTextToSize(
    'Todas as questões deste caderno vêm de provas reais de vestibulares de Medicina, conferidas uma a uma contra o gabarito oficial — nunca respondidas ou inferidas por inteligência artificial. Use como treino cronometrado, igual ao dia da prova.',
    CONTENT_W
  )
  doc.text(about, MARGIN_X, y)
  y += about.length * 15 + 36

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(NAVY)
  doc.text('COMO USAR', MARGIN_X, y)
  y += 22
  const steps = [
    'Separe o tempo sugerido e responda sem consultar nada.',
    'Confira suas respostas no gabarito, na última página.',
    'Revise o assunto das questões que errou no Glossário do app.',
  ]
  steps.forEach((s, i) => {
    doc.setFillColor(PRIMARY)
    doc.circle(MARGIN_X + 9, y - 4, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor('#FFFFFF')
    doc.text(String(i + 1), MARGIN_X + 9, y - 1, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(MUTED2)
    const lines = doc.splitTextToSize(s, CONTENT_W - 30)
    doc.text(lines, MARGIN_X + 26, y)
    y += lines.length * 14 + 10
  })

  // "fale com a gente" fixado perto do rodapé
  const contactY = PAGE_H - 130
  doc.setDrawColor(EDGE)
  doc.line(MARGIN_X, contactY - 24, PAGE_W - MARGIN_X, contactY - 24)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(NAVY)
  doc.text('FALE COM A GENTE', MARGIN_X, contactY)

  const iconSize = 22
  const iconGap = 8
  let ix = MARGIN_X
  const iy = contactY + 14
  doc.addImage(assets.ig.dataUrl, 'PNG', ix, iy, iconSize, iconSize)
  ix += iconSize + iconGap
  doc.addImage(assets.yt.dataUrl, 'PNG', ix, iy, iconSize, iconSize)
  ix += iconSize + iconGap
  doc.addImage(assets.wa.dataUrl, 'PNG', ix, iy, iconSize, iconSize)
  ix += iconSize + iconGap + 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(MUTED2)
  doc.text('@despolarizamed · despolarizamed.com', ix, iy + iconSize / 2 + 4)

  // bottom dark bar
  doc.setFillColor(NAVY)
  doc.rect(0, PAGE_H - 40, PAGE_W, 40, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#B9C2D6')
  doc.text(`© ${new Date().getFullYear()} DespolarizaMed — Todos os direitos reservados`, PAGE_W / 2, PAGE_H - 20, { align: 'center' })
}

export async function generateSimuladoPdf(subject: string, questions: ExamQuestion[]) {
  const assets = await loadAssets(questions)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  drawCapa(doc, assets, subject, questions.length)

  doc.addPage()
  let pageNum = 1
  drawQuestionPageHeader(doc, assets, subject, pageNum)
  let y = TOP_MARGIN

  const newPage = () => {
    doc.addPage()
    pageNum += 1
    drawQuestionPageHeader(doc, assets, subject, pageNum)
    y = TOP_MARGIN
  }
  const ensureSpace = (h: number) => {
    if (y + h > PAGE_H - BOTTOM_MARGIN) newPage()
  }

  questions.forEach((q, qi) => {
    ensureSpace(46)
    const color = subjectColor(q.subject)
    doc.setFillColor(color)
    doc.roundedRect(MARGIN_X, y - 11, 74, 16, 8, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor('#FFFFFF')
    doc.text(`Questão ${qi + 1}`, MARGIN_X + 37, y, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(FAINT)
    doc.text(`${q.topic} · ${q.source}`, MARGIN_X + 84, y)
    y += 22

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor('#1E293B')
    const qLines = doc.splitTextToSize(q.question, CONTENT_W)
    qLines.forEach((line: string, li: number) => {
      ensureSpace(15)
      const isLast = li === qLines.length - 1
      if (isLast) doc.text(line, MARGIN_X, y)
      else doc.text(line, MARGIN_X, y, { align: 'justify', maxWidth: CONTENT_W })
      y += 15
    })

    const imgAsset = q.image ? assets.questionImages[q.image] : undefined
    if (imgAsset) {
      const maxW = 380
      const maxH = 230
      const ratio = Math.min(maxW / imgAsset.width, maxH / imgAsset.height, 1)
      const w = imgAsset.width * ratio
      const h = imgAsset.height * ratio
      ensureSpace(h + 16)
      doc.setDrawColor(EDGE)
      doc.rect(MARGIN_X, y, w + 8, h + 8)
      doc.addImage(imgAsset.dataUrl, 'PNG', MARGIN_X + 4, y + 4, w, h)
      y += h + 20
    } else {
      y += 6
    }

    q.options.forEach((opt) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10.5)
      const lines = doc.splitTextToSize(`${opt.letra.toLowerCase()})  ${opt.texto}`, CONTENT_W)
      ensureSpace(lines.length * 14 + 4)
      doc.setTextColor('#334155')
      doc.text(lines, MARGIN_X, y)
      y += lines.length * 14 + 4
    })

    y += 14
    if (qi < questions.length - 1) {
      ensureSpace(1)
      doc.setDrawColor(EDGE)
      doc.line(MARGIN_X, y - 8, PAGE_W - MARGIN_X, y - 8)
    }
  })

  doc.addPage()
  pageNum += 1
  drawGabarito(doc, assets, subject, pageNum, questions)

  doc.addPage()
  drawContracapa(doc, assets)

  const dateSlug = new Date().toISOString().slice(0, 10)
  doc.save(`simulado-${subject.toLowerCase().replace(/\s+/g, '-')}-${dateSlug}.pdf`)
}
