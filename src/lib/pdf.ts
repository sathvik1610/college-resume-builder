/* PDF export that matches the preview exactly.

   The resume is laid out once by the browser (the same HTML and CSS as the preview).
   We measure where every word, rule and image landed and draw the same things into a
   PDF at those positions, so the spacing is identical. Text stays real text, so it is
   selectable and readable by ATS software. */
import fontkit from '@pdf-lib/fontkit'
import {
  PDFDocument, PDFName, PDFString, StandardFonts, rgb,
  type PDFFont, type PDFImage, type PDFPage, type PDFRef,
} from 'pdf-lib'
import type { Resume } from './model'
import { blockOf, paginate } from './paginate'
import { PAPER, resumeHTML } from './render'

export interface PdfFontUrls { regular: string; bold: string; italic: string; boldItalic: string }

const PT = 0.75 // CSS px -> PDF points

interface Atom {
  text: string
  x: number            // px, relative to the page
  top: number          // px, top of the first character box
  width: number        // px, width of the first character box
  first: string        // first character as typed
  small: boolean       // lower-case letter shown as a small capital
  size: number         // px
  bold: boolean
  italic: boolean
  sans: boolean
  color: [number, number, number]
  family: string
  spaceAfter: boolean
  block: Element
}

const parseColor = (c: string): [number, number, number] => {
  const m = c.match(/[\d.]+/g)
  return m && m.length >= 3 ? [+m[0] / 255, +m[1] / 255, +m[2] / 255] : [0, 0, 0]
}

// Never let a stuck browser promise (hidden tab, slow font) block the export for long.
const within = <T,>(p: Promise<T>, ms = 3000) => Promise.race([p, new Promise<undefined>(r => setTimeout(() => r(undefined), ms))])

async function bytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load ' + url)
  return res.arrayBuffer()
}

export async function makePdfBlob(r: Resume, userLogo: string | undefined, fonts: PdfFontUrls): Promise<Blob> {
  const s = r.settings
  const paper = PAPER[s.paper] ?? PAPER.A4
  const margin = s.margin * 96

  /* 1. Lay the resume out off-screen, exactly like the preview but unscaled. */
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;'
  const page = document.createElement('article')
  page.className = `page t-${s.template}`
  page.style.setProperty('--pw', paper.w + 'px')
  page.style.setProperty('--ph', paper.h + 'px')
  page.style.setProperty('--m', s.margin + 'in')
  page.style.setProperty('--fs', s.fontSize + 'pt')
  page.innerHTML = resumeHTML(r, userLogo)
  host.appendChild(page)
  document.body.appendChild(host)

  try {
    const faces = ['400 11px "CMU Serif"', '700 11px "CMU Serif"', 'italic 400 11px "CMU Serif"', 'italic 700 11px "CMU Serif"']
    if (!faces.every(f => document.fonts.check(f))) await within(Promise.all(faces.map(f => document.fonts.load(f).catch(() => []))))
    await within(Promise.all([...page.querySelectorAll('img')].map(i => i.complete
      ? Promise.resolve()
      : new Promise<void>(res => { i.onload = i.onerror = () => res() }))))
    const ar = page.getBoundingClientRect()

    /* 2. Decide which page every block lands on (shared with the preview). */
    const { shift } = paginate(page, paper.h, margin)
    const shiftOf = (el: Element | null) => {
      const b = blockOf(el)
      return (b && shift.get(b)) ?? 0
    }

    /* 3. Measure helpers. */
    const probeCache = new Map<string, number>()
    const ascentOf = (cs: CSSStyleDeclaration, size: number) => {
      const key = [cs.fontFamily, cs.fontWeight, cs.fontStyle, size].join('|')
      let v = probeCache.get(key)
      if (v === undefined) {
        const sp = document.createElement('span')
        sp.style.cssText = `position:absolute;left:0;top:0;white-space:nowrap;line-height:normal;font-family:${cs.fontFamily};font-weight:${cs.fontWeight};font-style:${cs.fontStyle};font-size:${size}px;font-variant:normal;letter-spacing:normal`
        sp.append('x')
        const z = document.createElement('i')
        z.style.cssText = 'display:inline-block;width:0;height:0'
        sp.appendChild(z)
        host.appendChild(sp)
        const rg = document.createRange()
        rg.setStart(sp.firstChild!, 0); rg.setEnd(sp.firstChild!, 1)
        v = z.getBoundingClientRect().bottom - rg.getBoundingClientRect().top
        sp.remove()
        probeCache.set(key, v)
      }
      return v
    }

    /* 4. Collect text, one atom per word piece, with the browser's own positions. */
    const atoms: Atom[] = []
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    let last: Atom | null = null
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      const el = n.parentElement!
      const cs = getComputedStyle(el)
      const fs = parseFloat(cs.fontSize)
      const sans = !/CMU/i.test(cs.fontFamily)
      const bold = parseInt(cs.fontWeight, 10) >= 600
      const italic = cs.fontStyle === 'italic'
      const color = parseColor(cs.color)
      const smallCaps = cs.fontVariantCaps === 'small-caps'
      const spaced = cs.letterSpacing !== 'normal' && parseFloat(cs.letterSpacing) > 0
      const block = blockOf(el) ?? el
      const text = n.data
      let cur: Atom | null = null
      let lastRight = 0
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        range.setStart(n, i); range.setEnd(n, i + 1)
        const rc = range.getClientRects()[0]
        if (/\s/.test(ch) || !rc || (rc.width === 0 && rc.height === 0)) {
          if (/\s/.test(ch)) {
            if (cur) { cur.spaceAfter = true; atoms.push(cur); last = cur; cur = null }
            else if (last && last.block === block) last.spaceAfter = true
          }
          continue
        }
        const small = smallCaps && ch !== ch.toUpperCase()
        const top = rc.top - ar.top, left = rc.left - ar.left
        const joins = cur && cur.small === small && Math.abs(top - cur.top) < 1.5 && Math.abs(left - lastRight) < 1.5 && !spaced
        if (!joins) {
          if (cur) { atoms.push(cur); last = cur }
          cur = { text: '', x: left, top, width: rc.width, first: ch, small, size: fs, bold, italic, sans, color,
            family: cs.fontFamily, spaceAfter: false, block }
        }
        cur!.text += small ? ch.toUpperCase() : ch
        lastRight = rc.right - ar.left
      }
      if (cur) { atoms.push(cur); last = cur }
    }

    /* 5. Build the PDF. */
    const doc = await PDFDocument.create()
    doc.registerFontkit(fontkit)
    doc.setTitle(`${r.basics.name || 'Resume'} - Resume`)
    doc.setAuthor(r.basics.name || '')
    doc.setCreator('College Resume Builder')

    const wPt = paper.w * PT, hPt = paper.h * PT
    const pdfPages: PDFPage[] = []
    const pageAt = (yPx: number) => {
      const idx = Math.max(0, Math.floor((yPx + 0.01) / paper.h))
      while (pdfPages.length <= idx) pdfPages.push(doc.addPage([wPt, hPt]))
      return { idx, pg: pdfPages[idx] }
    }
    pageAt(0)

    const fontCache = new Map<string, PDFFont>()
    const getFont = async (sans: boolean, bold: boolean, italic: boolean) => {
      const k = `${sans}${bold}${italic}`
      let f = fontCache.get(k)
      if (!f) {
        if (sans) {
          f = await doc.embedFont(bold ? (italic ? StandardFonts.HelveticaBoldOblique : StandardFonts.HelveticaBold)
            : (italic ? StandardFonts.HelveticaOblique : StandardFonts.Helvetica))
        } else {
          const url = bold ? (italic ? fonts.boldItalic : fonts.bold) : (italic ? fonts.italic : fonts.regular)
          // no ligatures: the preview turns them off too, so every letter sits where the browser put it
          f = await doc.embedFont(await bytes(url), { features: { liga: false, clig: false, dlig: false } })
        }
        fontCache.set(k, f)
      }
      return f
    }
    const safe = (f: PDFFont, t: string) => {
      let out = ''
      for (const ch of t) { try { f.encodeText(ch); out += ch } catch { out += '?' } }
      return out
    }

    for (const a of atoms) {
      const font = await getFont(a.sans, a.bold, a.italic)
      const dy = shiftOf(a.block)
      let size = a.size
      if (a.small) {
        // synthesized small capitals: size follows the width the browser gave the letter
        const w1 = font.widthOfTextAtSize(safe(font, a.first.toUpperCase()), 1)
        if (w1 > 0) size = a.width / w1
      }
      // the browser sizes the line box from the full-size font, small capitals included
      const csLike = { fontFamily: a.family, fontWeight: a.bold ? '700' : '400', fontStyle: a.italic ? 'italic' : 'normal' } as CSSStyleDeclaration
      const baseline = a.top + dy + ascentOf(csLike, a.size)
      const { idx, pg } = pageAt(a.top + dy)
      const y = hPt - (baseline - idx * paper.h) * PT
      const text = safe(font, a.text + (a.spaceAfter ? ' ' : ''))
      pg.drawText(text, { x: a.x * PT, y, size: size * PT, font, color: rgb(...a.color) })
    }

    // rules under section headings
    for (const h of page.querySelectorAll('h2')) {
      const cs = getComputedStyle(h)
      const bw = parseFloat(cs.borderBottomWidth)
      if (!bw) continue
      const rc = h.getBoundingClientRect()
      const dy = shiftOf(h)
      const yPx = rc.bottom - ar.top - bw / 2 + dy
      const { idx, pg } = pageAt(rc.top - ar.top + dy)
      const y = hPt - (yPx - idx * paper.h) * PT
      pg.drawLine({
        start: { x: (rc.left - ar.left) * PT, y }, end: { x: (rc.right - ar.left) * PT, y },
        thickness: bw * PT, color: rgb(...parseColor(cs.borderBottomColor)),
      })
    }

    // logo
    for (const img of page.querySelectorAll('img')) {
      try {
        const buf = new Uint8Array(await bytes(img.currentSrc || img.src))
        const emb: PDFImage = buf[0] === 0xff && buf[1] === 0xd8 ? await doc.embedJpg(buf) : await doc.embedPng(buf)
        const rc = img.getBoundingClientRect()
        const k = Math.min(rc.width / img.naturalWidth, rc.height / img.naturalHeight) // object-fit: contain
        const w = img.naturalWidth * k, h = img.naturalHeight * k
        const x = rc.left - ar.left + (rc.width - w) / 2
        const top = rc.top - ar.top + (rc.height - h) / 2 + shiftOf(img)
        const { idx, pg } = pageAt(top)
        pg.drawImage(emb, { x: x * PT, y: hPt - (top - idx * paper.h + h) * PT, width: w * PT, height: h * PT })
      } catch { /* a logo that cannot be read is simply left out */ }
    }

    // clickable links
    const annots = new Map<PDFPage, PDFRef[]>()
    for (const a of page.querySelectorAll('a[href]')) {
      const href = (a as HTMLAnchorElement).getAttribute('href')!
      const dy = shiftOf(a)
      for (const rc of a.getClientRects()) {
        const top = rc.top - ar.top + dy
        const { idx, pg } = pageAt(top)
        const y2 = hPt - (top - idx * paper.h) * PT
        const ref = doc.context.register(doc.context.obj({
          Type: 'Annot', Subtype: 'Link', Border: [0, 0, 0],
          Rect: [(rc.left - ar.left) * PT, y2 - rc.height * PT, (rc.right - ar.left) * PT, y2],
          A: { Type: 'Action', S: 'URI', URI: PDFString.of(href) },
        }))
        annots.set(pg, [...(annots.get(pg) ?? []), ref])
      }
    }
    annots.forEach((refs, pg) => pg.node.set(PDFName.of('Annots'), doc.context.obj(refs)))

    const out = await doc.save()
    return new Blob([out as BlobPart], { type: 'application/pdf' })
  } finally {
    host.remove()
  }
}
