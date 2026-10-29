import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Resume } from '@/lib/model'
import { paginate } from '@/lib/paginate'
import { PAPER, resumeHTML } from '@/lib/render'

interface Props {
  resume: Resume
  logo?: string
  onPages: (n: number) => void
}

const GAP = 18            // px of space shown between pages in the preview
const MIN = 0.25, MAX = 2  // zoom limits (1 = actual paper size)

export function Preview({ resume, logo, onPages }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLElement>(null)
  const [pages, setPages] = useState(1)
  const [zoom, setZoom] = useState<number | 'fit'>('fit')
  const [scale, setScale] = useState(1)
  const s = resume.settings
  const html = useMemo(() => resumeHTML(resume, logo), [resume, logo])

  // Lay the pages out (same rules as the PDF), then scale to the chosen zoom.
  const measure = useCallback(() => {
    const wrap = wrapRef.current, holder = holderRef.current, el = pageRef.current
    if (!wrap || !holder || !el) return
    const p = PAPER[s.paper] ?? PAPER.A4
    const margin = s.margin * 96

    el.style.transform = 'none'
    el.style.height = ''
    const blocks = el.querySelectorAll<HTMLElement>('h1,h2,.row,li,p,header')
    blocks.forEach(b => { b.style.translate = '' })

    const { shift, pages: n } = paginate(el, p.h, margin)
    const ar = el.getBoundingClientRect()
    blocks.forEach(b => {
      const dy = shift.get(b) ?? 0
      const top = b.getBoundingClientRect().top - ar.top
      const pg = Math.floor((top + dy + 0.01) / p.h)
      const total = dy + pg * GAP
      if (total) b.style.translate = `0 ${total}px`
    })
    const H = n * p.h + (n - 1) * GAP
    el.style.height = H + 'px'

    const fit = Math.max(MIN, Math.min(1, (wrap.clientWidth - (wrap.clientWidth < 520 ? 32 : 50)) / p.w))
    const sc = zoom === 'fit' ? fit : zoom
    el.style.transform = sc === 1 ? 'none' : `scale(${sc})`
    holder.style.width = p.w * sc + 'px'
    holder.style.height = H * sc + 'px'
    setScale(sc)
    setPages(n)
    onPages(n)
  }, [s.paper, s.margin, zoom, onPages])

  useLayoutEffect(measure, [measure, html, s.fontSize, s.template])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [measure])

  const p = PAPER[s.paper] ?? PAPER.A4
  const style = {
    '--pw': p.w + 'px', '--ph': p.h + 'px', '--m': s.margin + 'in', '--fs': s.fontSize + 'pt',
    // white pages with a gap between them; the gap shows the surface behind
    background: `repeating-linear-gradient(to bottom, #fff 0, #fff ${p.h}px, transparent ${p.h}px, transparent ${p.h + GAP}px)`,
    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.28)) drop-shadow(0 6px 14px rgba(0,0,0,.12))',
  } as CSSProperties

  const step = (d: number) => setZoom(Math.min(MAX, Math.max(MIN, Math.round((scale + d) * 10) / 10)))

  return (
    <section aria-label="Resume preview" className="flex h-full min-h-0 flex-col bg-muted">
      {/* the toolbar sits outside the scrolling area, so it never moves out of view */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-muted px-4 py-2 sm:px-6">
        <Badge variant={pages > 2 ? 'destructive' : 'secondary'}>
          {pages} {pages === 1 ? 'page' : 'pages'} · {s.paper}
        </Badge>
        <div className="flex items-center gap-1" role="group" aria-label="Zoom">
          <Button variant="outline" size="icon-sm" aria-label="Zoom out" onClick={() => step(-0.1)} disabled={scale <= MIN}><Minus /></Button>
          <span className="w-12 text-center text-sm tabular-nums" aria-live="polite">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon-sm" aria-label="Zoom in" onClick={() => step(0.1)} disabled={scale >= MAX}><Plus /></Button>
          <Button variant={zoom === 'fit' ? 'secondary' : 'outline'} size="sm" className="ml-1" onClick={() => setZoom('fit')}><Maximize2 /> Fit</Button>
        </div>
      </div>
      <div ref={wrapRef} className="min-h-0 flex-1 overflow-auto px-4 pt-4 pb-12 sm:px-6">
        <div id="page-holder" ref={holderRef} className="mx-auto">
          <article id="resume" ref={pageRef} className={`page t-${s.template}`} style={style}
            dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </section>
  )
}
