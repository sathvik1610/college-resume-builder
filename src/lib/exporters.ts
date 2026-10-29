import { SECTIONS, title, type Resume, type SectionKey } from './model'
import { lines } from './render'

const has = (o: Record<string, string>) => Object.values(o).some(v => String(v).trim())
const range = (a: string, b: string) => [a, b].map(x => String(x || '').trim()).filter(Boolean).join(' – ')

export function toText(r: Resume): string {
  const b = r.basics
  const L: string[] = []
  L.push(
    b.name,
    [b.location, b.phone, b.email, ...r.links.filter(l => l.url.trim()).map(l => `${l.label ? l.label + ': ' : ''}${l.url}`)]
      .filter(Boolean).join(' | '),
    '',
  )
  for (const key of r.settings.order as SectionKey[]) {
    const block: string[] = []
    if (key === 'summary' && r.summary.trim()) block.push(r.summary.trim())
    if (key === 'achievements') lines(r.achievements).forEach(x => block.push('- ' + x))
    if (key === 'skills') r.skills.filter(x => x.items.trim()).forEach(x => block.push(`${x.label}: ${x.items}`))
    if (key === 'education') r.education.filter(has).forEach(e =>
      block.push(`${e.school}, ${e.location}`, `${e.degree} | ${e.score} | ${range(e.start, e.end)}`))
    if (key === 'certifications') r.certifications.filter(c => c.name.trim()).forEach(c =>
      block.push('- ' + [c.name, c.issuer, c.date].filter(Boolean).join(', ')))
    if (key === 'projects') r.projects.filter(has).forEach(p => {
      block.push([p.name, p.tech, p.link, p.date].filter(Boolean).join(' | '))
      lines(p.bullets).forEach(x => block.push('- ' + x))
    })
    if (key === 'experience' || key === 'leadership') r[key].filter(has).forEach(e => {
      block.push(`${e.role} | ${range(e.start, e.end)}`, [e.org, e.location].filter(Boolean).join(', '))
      lines(e.bullets).forEach(x => block.push('- ' + x))
    })
    if (block.length && SECTIONS[key]) L.push(title(r, key).toUpperCase(), ...block, '')
  }
  return L.join('\n')
}

export function download(name: string, text: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const slug = (s: string) =>
  (s || 'resume').trim().replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'resume'
