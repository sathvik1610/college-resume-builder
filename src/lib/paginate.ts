/* Decides where page breaks fall. The preview and the PDF both use this, so they always agree.
   Blocks (headings, rows, bullets, paragraphs) are never split across pages, and a section
   heading always stays with the block that follows it. */
export const BLOCKS = 'h1,h2,.row,li,p,header'

export interface Pagination {
  shift: Map<Element, number>   // extra px each block moves down so it starts on the next page
  pages: number
}

// `page` must be laid out unscaled and without earlier shifts applied.
export function paginate(page: HTMLElement, pageHeight: number, margin: number): Pagination {
  const ar = page.getBoundingClientRect()
  const blocks = [...page.querySelectorAll(BLOCKS)]
  const shift = new Map<Element, number>()
  let offset = 0
  let lastBottom = 0
  blocks.forEach((b, i) => {
    const rc = b.getBoundingClientRect()
    const top = rc.top - ar.top, bottom = rc.bottom - ar.top
    let need = bottom
    if (b.tagName === 'H2' && blocks[i + 1]) need = blocks[i + 1].getBoundingClientRect().bottom - ar.top
    const pg = Math.floor((top + offset + 0.01) / pageHeight)
    const limit = (pg + 1) * pageHeight - margin
    if (need + offset > limit + 0.5 && top + offset > pg * pageHeight + margin + 1) {
      offset = (pg + 1) * pageHeight + margin - top
    }
    shift.set(b, offset)
    lastBottom = Math.max(lastBottom, bottom + offset)
  })
  const pages = Math.max(1, Math.floor((lastBottom - 0.5) / pageHeight) + 1)
  return { shift, pages }
}

export const blockOf = (el: Element | null) => el?.closest(BLOCKS) ?? null
