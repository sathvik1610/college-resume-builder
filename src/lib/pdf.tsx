/* Real PDF (selectable text, exact paper size) built with @react-pdf/renderer.
   It mirrors the on-screen layout in render.ts / resume.css. */
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { SECTIONS, title, type Item, type Resume, type SectionKey } from './model'
import { lines, richSegments } from './render'

export interface PdfFontUrls { regular: string; bold: string; italic: string; boldItalic: string }

let fontsFor: string | null = null
export function registerFonts(u: PdfFontUrls) {
  if (fontsFor === u.regular) return
  fontsFor = u.regular
  Font.register({
    family: 'CMU Serif',
    fonts: [
      { src: u.regular, fontWeight: 400, fontStyle: 'normal' },
      { src: u.bold, fontWeight: 700, fontStyle: 'normal' },
      { src: u.italic, fontWeight: 400, fontStyle: 'italic' },
      { src: u.boldItalic, fontWeight: 700, fontStyle: 'italic' },
    ],
  })
  Font.registerHyphenationCallback(w => [w])   // never hyphenate words
}

const has = (o: Item) => Object.values(o).some(v => String(v).trim())
const range = (a: string, b: string) => [a, b].map(x => String(x || '').trim()).filter(Boolean).join(' – ')
const ACCENT = '#8b1a1a'

type S = Record<string, string | number>

/* LaTeX-style small caps: lower-case letters become smaller capitals. */
function SmallCaps({ text, size }: { text: string; size: number }) {
  const runs: { t: string; small: boolean }[] = []
  for (const ch of text) {
    const small = ch !== ch.toUpperCase()
    const last = runs[runs.length - 1]
    if (last && last.small === small) last.t += small ? ch.toUpperCase() : ch
    else runs.push({ t: small ? ch.toUpperCase() : ch, small })
  }
  return <Text style={{ fontSize: size }}>{runs.map((r, i) => <Text key={i} style={{ fontSize: r.small ? size * 0.8 : size }}>{r.t}</Text>)}</Text>
}

function Rich({ text }: { text: string }) {
  return <>{richSegments(text).map((s, i) => s.b ? <Text key={i} style={{ fontWeight: 700 }}>{s.t}</Text> : s.t)}</>
}

export function ResumePdf({ r, logo, link }: { r: Resume; logo?: string; link: (u: string, label?: string) => { href: string; shown: string } | null }) {
  const s = r.settings
  const modern = s.template === 'modern'
  const family = modern ? 'Helvetica' : 'CMU Serif'
  const fs = modern ? s.fontSize - 0.75 : s.fontSize
  const lh = modern ? 1.28 : 1.22
  const margin = s.margin * 72
  const accent = modern ? ACCENT : '#000'

  const st = StyleSheet.create({
    page: { fontFamily: family, fontSize: fs, lineHeight: lh, color: '#000', paddingTop: margin, paddingBottom: margin, paddingLeft: margin, paddingRight: margin },
    header: { textAlign: modern ? 'left' : 'center', paddingTop: 2, position: 'relative' },
    logo: { position: 'absolute', top: 0, ...(modern ? { right: 0 } : { left: 0 }), height: fs * 3.6, maxWidth: fs * 5 } as S,
    contact: { marginTop: 4, fontSize: fs * 0.9 },
    h2: { marginTop: 8, marginBottom: 4, paddingBottom: 1, borderBottomWidth: modern ? 1 : 0.5, borderBottomColor: accent, borderBottomStyle: 'solid', color: accent },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    left: { flex: 1 },
    right: { marginLeft: 14, textAlign: 'right' },
    entry: { marginTop: 5 },
    li: { flexDirection: 'row', marginTop: 1.5, paddingLeft: fs * 1.0 },
    dot: { width: fs * 0.95, fontSize: fs * 0.92 },
    liText: { flex: 1, fontSize: fs * 0.92 },
  })

  const B = ({ children }: { children?: ReactNode }) => <Text style={{ fontWeight: 700 }}>{children}</Text>
  const I = ({ children }: { children?: ReactNode }) => <Text style={{ fontStyle: 'italic' }}>{children}</Text>
  const Sep = () => <Text> | </Text>

  const Anchor = ({ u, label }: { u: string; label?: string }) => {
    const l = link(u, label)
    return l ? <Link src={l.href} style={{ color: '#000', textDecoration: 'none' }}>{l.shown}</Link> : null
  }

  const Bullets = ({ text }: { text: string }) => (
    <View>
      {lines(text).map((x, i) => (
        <View key={i} style={st.li} wrap={false}>
          <Text style={st.dot}>•</Text>
          <Text style={st.liText}><Rich text={x} /></Text>
        </View>
      ))}
    </View>
  )

  const Heading = ({ k }: { k: SectionKey }) => {
    const t = title(r, k)
    return (
      <View style={st.h2} minPresenceAhead={40}>
        {modern
          ? <Text style={{ fontWeight: 700, fontSize: fs * 0.95, letterSpacing: 0.9 }}>{t.toUpperCase()}</Text>
          : <Text style={{ fontWeight: 700 }}><SmallCaps text={t} size={fs * 1.2} /></Text>}
      </View>
    )
  }

  const roles = (list: Item[]) => list.filter(has).map((e, i) => (
    <View key={i} style={st.entry}>
      <View style={st.row} wrap={false}>
        <Text style={st.left}>
          {e.org ? <B>{e.org}</B> : null}
          {e.org && e.role ? <Sep /> : null}
          {e.role}
          {(e.org || e.role) && e.location ? <Sep /> : null}
          {e.location ? <I>{e.location}</I> : null}
        </Text>
        <Text style={st.right}>{range(e.start, e.end)}</Text>
      </View>
      <Bullets text={e.bullets} />
    </View>
  ))

  const BODY: Record<SectionKey, () => ReactNode> = {
    summary: () => r.summary.trim() ? <Text><Rich text={r.summary.trim()} /></Text> : null,
    education: () => r.education.filter(has).map((e, i) => (
      <View key={i} style={st.entry}>
        <View style={st.row} wrap={false}>
          <Text style={st.left}><B>{e.school}</B>{e.location ? `, ${e.location}` : ''}</Text>
          <Text style={[st.right, { fontWeight: 700 }]}>{range(e.start, e.end)}</Text>
        </View>
        {e.degree || e.score ? (
          <View style={[st.row, { fontSize: fs * 0.9 }]} wrap={false}>
            <Text style={[st.left, { fontStyle: 'italic' }]}>{e.degree}</Text>
            <Text style={[st.right, { fontStyle: 'italic' }]}>{e.score}</Text>
          </View>
        ) : null}
        {e.details.trim() ? <Text style={{ marginTop: 1, fontSize: fs * 0.9 }}><B>Coursework:</B> <Rich text={e.details.trim()} /></Text> : null}
      </View>
    )),
    skills: () => r.skills.filter(x => x.items.trim()).map((x, i) => (
      <Text key={i} style={{ fontSize: fs * 0.92, marginBottom: 3 }}>
        {x.label.trim() ? <B>{x.label.trim()}: </B> : null}{x.items.trim()}
      </Text>
    )),
    projects: () => r.projects.filter(has).map((p, i) => (
      <View key={i} style={st.entry}>
        <View style={st.row} wrap={false}>
          <Text style={st.left}>
            <B>{p.name}</B>
            {p.tech ? <><Sep /><I>{p.tech}</I></> : null}
            {p.link.trim() ? <><Sep /><Anchor u={p.link} label={p.linkText.trim() || (/github\.com/i.test(p.link) ? 'GitHub' : /(gitlab|bitbucket)\./i.test(p.link) ? 'Code' : 'Link')} /></> : null}
          </Text>
          <Text style={[st.right, { fontWeight: 700, fontSize: fs * 0.9 }]}>{p.date}</Text>
        </View>
        <Bullets text={p.bullets} />
      </View>
    )),
    experience: () => roles(r.experience),
    leadership: () => roles(r.leadership),
    certifications: () => r.certifications.filter(c => c.name.trim()).map((c, i) => {
      const extra = [c.issuer.trim(), c.date.trim()].filter(Boolean).join(', ')
      return (
        <View key={i} style={st.li} wrap={false}>
          <Text style={st.dot}>•</Text>
          <Text style={st.liText}>{c.name.trim()}{extra ? ', ' + extra : ''}</Text>
        </View>
      )
    }),
    achievements: () => <Bullets text={r.achievements} />,
  }

  const b = r.basics
  const contact: ReactNode[] = []
  const add = (n: ReactNode) => { if (contact.length) contact.push(<Text key={'s' + contact.length}>{'  |  '}</Text>); contact.push(n) }
  if (b.location) add(<Text key="loc">{b.location}</Text>)
  if (b.phone) add(<Text key="ph">{b.phone}</Text>)
  if (b.email) add(<Link key="em" src={`mailto:${b.email}`} style={{ color: '#000', textDecoration: 'none' }}>{b.email}</Link>)
  r.links.filter(l => l.url.trim()).forEach((l, i) => add(<Anchor key={'l' + i} u={l.url} label={l.label.trim()} />))

  const size = s.paper === 'Letter' ? 'LETTER' : 'A4'

  return (
    <Document title={`${b.name || 'Resume'} - Resume`} author={b.name} creator="College Resume Builder">
      <Page size={size} style={st.page}>
        <View style={st.header}>
          {s.showLogo && logo ? <Image src={logo} style={st.logo as never} /> : null}
          <Text style={modern ? { fontSize: fs * 2.2, lineHeight: 1.1, fontWeight: 700, color: ACCENT } : { fontSize: fs * 2.35, lineHeight: 1.1 }}>
            {modern ? (b.name.trim() || 'Your Name') : <SmallCaps text={b.name.trim() || 'Your Name'} size={fs * 2.35} />}
          </Text>
          {contact.length ? <Text style={st.contact}>{contact}</Text> : null}
        </View>
        {s.order.map(k => {
          if (!SECTIONS[k]) return null
          const body = BODY[k]()
          const filled = Array.isArray(body) ? body.length > 0 : !!body
          return filled ? <View key={k}><Heading k={k} />{body}</View> : null
        })}
      </Page>
    </Document>
  )
}

export async function makePdfBlob(r: Resume, logo: string | undefined, fonts: PdfFontUrls): Promise<Blob> {
  registerFonts(fonts)
  const linkFn = (u: string, label?: string) => {
    u = String(u || '').trim()
    if (!u) return null
    const href = /^(https?:|mailto:)/i.test(u) ? u : 'https://' + u
    const shown = r.settings.linkStyle === 'label' && label ? label : u.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    return { href, shown }
  }
  return pdf(<ResumePdf r={r} logo={logo} link={linkFn} />).toBlob()
}
