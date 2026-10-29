import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Resume } from '@/lib/model'
import { PAPER, resumeHTML } from '@/lib/render'

interface Props {
  resume: Resume
  logo?: string
  onPages: (n: number) => void
}

export function Preview({ resume, logo, onPages }: Props) {
  const wrapRef = useRef<HTMLElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLElement>(null)
  const [pages, setPages] = useState(1)
  const s = resume.settings
  const html = useMemo(() => resumeHTML(resume, logo), [resume, logo])

  // Scale the page to the pane and count pages.
  const measure = useCallback(() => {
    const wrap = wrapRef.current, holder = holderRef.current, el = pageRef.current
    if (!wrap || !holder || !el) return
    const p = PAPER[s.paper] ?? PAPER.A4
    const m = s.margin * 96
    const avail = wrap.clientWidth - 50
    const scale = avail > 0 ? Math.min(1, avail / p.w) : 1
    const h = Math.max(p.h, el.scrollHeight)
    el.style.transform = scale < 1 ? `scale(${scale})` : 'none'
    holder.style.width = p.w * scale + 'px'
    holder.style.height = h * scale + 'px'
    const n = Math.max(1, Math.ceil((el.scrollHeight - 2 * m - 1) / (p.h - 2 * m)))
    setPages(n)
    onPages(n)
  }, [s.paper, s.margin, onPages])

  useLayoutEffect(measure, [measure, html, s.fontSize, s.template])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [measure])

  // The print dialog takes its page size and margins from here.
  useEffect(() => {
    let el = document.getElementById('pagestyle')
    if (!el) { el = document.createElement('style'); el.id = 'pagestyle'; document.head.appendChild(el) }
    el.textContent = `@page{size:${s.paper === 'Letter' ? 'letter' : 'A4'};margin:${s.margin}in}`
  }, [s.paper, s.margin])

  const p = PAPER[s.paper] ?? PAPER.A4
  const style = {
    '--pw': p.w + 'px', '--ph': p.h + 'px', '--m': s.margin + 'in', '--fs': s.fontSize + 'pt',
  } as CSSProperties

  return (
    <section ref={wrapRef} aria-label="Resume preview"
      className="h-full min-h-0 overflow-auto bg-muted px-6 pb-12 print:h-auto print:overflow-visible print:bg-white print:p-0">
      <div className="sticky top-0 z-10 -mx-6 mb-3 flex flex-wrap items-center justify-between gap-2 border-b bg-muted/90 px-6 py-2.5 text-sm backdrop-blur print:hidden">
        <Badge variant={pages > 1 ? 'destructive' : 'secondary'}>
          {pages} {pages === 1 ? 'page' : 'pages'} · {s.paper}
        </Badge>
        <span className="text-xs text-muted-foreground">The red line marks where a page ends (approximate)</span>
      </div>
      <div id="page-holder" ref={holderRef} className="mx-auto bg-white shadow-lg ring-1 ring-black/10">
        <article id="resume" ref={pageRef} className={`page t-${s.template}`} style={style}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  )
}
