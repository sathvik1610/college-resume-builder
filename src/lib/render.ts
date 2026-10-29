import { COLLEGE } from '@/config'
import { title, type Item, type Resume, type SectionKey } from './model'

export const PAPER = {
  A4: { w: 793.7, h: 1122.5 },
  Letter: { w: 816, h: 1056 },
}

export const esc = (s: unknown) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

// **text** marks bold text inside bullets, summary and coursework.
export const plain = (s: string) => String(s || '').replace(/\*\*(.+?)\*\*/g, '$1')
export const richHtml = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
export const richSegments = (s: string): { t: string; b: boolean }[] => {
  const out: { t: string; b: boolean }[] = []
  let last = 0
  for (const m of String(s || '').matchAll(/\*\*(.+?)\*\*/g)) {
    if (m.index! > last) out.push({ t: s.slice(last, m.index), b: false })
    out.push({ t: m[1], b: true })
    last = m.index! + m[0].length
  }
  if (last < s.length) out.push({ t: s.slice(last), b: false })
  return out
}

export const lines = (t: string) =>
  String(t || '').split('\n').map(l => l.replace(/^\s*(?:[-•·]|\*(?!\*))\s*/, '').trim()).filter(Boolean)

const has = (o: Item) => Object.values(o).some(v => String(v).trim())
const range = (a: string, b: string) =>
  [a, b].map(x => String(x || '').trim()).filter(Boolean).join(' – ')

export const logoSrc = (userLogo?: string) => userLogo || COLLEGE.logo

function makeLink(linkStyle: string) {
  return (u: string, label?: string) => {
    u = String(u || '').trim()
    if (!u) return ''
    const href = /^(https?:|mailto:)/i.test(u) ? u : 'https://' + u
    const shown = linkStyle === 'label' && label ? label : u.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    return `<a href="${esc(href)}">${esc(shown)}</a>`
  }
}

const guessLabel = (u: string) =>
  /github\.com/i.test(u) ? 'GitHub' : /(gitlab|bitbucket)\./i.test(u) ? 'Code' : 'Link'

const row = (l: string, r: string, cls = '') =>
  `<div class="row${cls ? ' ' + cls : ''}"><span class="l">${l}</span>${r ? `<span class="r">${r}</span>` : ''}</div>`

const bullets = (t: string) => {
  const l = lines(t)
  return l.length ? `<ul>${l.map(x => `<li><span class="bl">•</span>${richHtml(x)}</li>`).join('')}</ul>` : ''
}

export function resumeHTML(r: Resume, userLogo?: string): string {
  const link = makeLink(r.settings.linkStyle)

  const roles = (list: Item[]) => list.filter(has).map(e => {
    const left = [e.org && `<b>${esc(e.org)}</b>`, esc(e.role), e.location && `<i>${esc(e.location)}</i>`]
      .filter(Boolean).join(' | ')
    return `<div class="entry">${row(left, esc(range(e.start, e.end)), 'head')}${bullets(e.bullets)}</div>`
  }).join('')

  const RENDER: Record<SectionKey, () => string> = {
    summary: () => r.summary.trim() ? `<p>${richHtml(r.summary.trim())}</p>` : '',
    education: () => r.education.filter(has).map(e =>
      `<div class="entry">${row(`<b>${esc(e.school)}</b>${e.location ? `, ${esc(e.location)}` : ''}`, `<b>${esc(range(e.start, e.end))}</b>`)}` +
      (e.degree || e.score ? row(`<i>${esc(e.degree)}</i>`, `<i>${esc(e.score)}</i>`, 'sub') : '') +
      (e.details.trim() ? `<p class="detail"><b>Coursework:</b> ${richHtml(e.details.trim())}</p>` : '') + '</div>').join(''),
    skills: () => {
      const l = r.skills.filter(s => s.items.trim())
      return l.length
        ? `<div class="skills">${l.map(s => `<p class="skill">${s.label.trim() ? `<b>${esc(s.label.trim())}:</b> ` : ''}${esc(s.items.trim())}</p>`).join('')}</div>`
        : ''
    },
    projects: () => r.projects.filter(has).map(p =>
      `<div class="entry">${row(
        `<b>${esc(p.name)}</b>${p.tech ? ` | <i>${esc(p.tech)}</i>` : ''}${p.link.trim() ? ' | ' + link(p.link, p.linkText.trim() || guessLabel(p.link)) : ''}`,
        esc(p.date), 'head')}${bullets(p.bullets)}</div>`).join(''),
    experience: () => roles(r.experience),
    leadership: () => roles(r.leadership),
    certifications: () => {
      const l = r.certifications.filter(c => c.name.trim()).map(c => {
        const extra = [c.issuer.trim(), c.date.trim()].filter(Boolean).join(', ')
        return `<li><span class="bl">•</span>${esc(c.name.trim())}${extra ? ', ' + esc(extra) : ''}</li>`
      })
      return l.length ? `<ul>${l.join('')}</ul>` : ''
    },
    coursework: () => r.coursework.trim() ? `<p>${richHtml(r.coursework.trim())}</p>` : '',
    achievements: () => bullets(r.achievements),
  }

  const b = r.basics
  const contact = [
    esc(b.location), esc(b.phone),
    b.email && `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`,
    ...r.links.filter(l => l.url.trim()).map(l => link(l.url, l.label.trim())),
  ].filter(Boolean).join('<span class="sep">|</span>')

  const logo = r.settings.showLogo && logoSrc(userLogo)
  let h = `<header${logo ? ' class="has-logo"' : ''}>` +
    (logo ? `<img class="logo" src="${esc(logo)}" alt="College logo" onerror="this.remove()">` : '') +
    `<h1>${esc(b.name.trim()) || 'Your Name'}</h1>${contact ? `<p class="contact">${contact}</p>` : ''}</header>`
  for (const key of r.settings.order) {
    const body = RENDER[key]()
    if (body) h += `<section><h2>${esc(title(r, key))}</h2>${body}</section>`
  }
  return h
}
