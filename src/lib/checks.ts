import type { Resume } from './model'
import { lines, plain } from './render'

export interface Check { ok: boolean; text: string }

const wordCount = (s: string) => plain(s).split(/\s+/).filter(Boolean).length

export function runChecks(r: Resume, pages: number): Check[] {
  const out: Check[] = []
  const add = (ok: boolean, good: string, bad: string) => out.push({ ok, text: ok ? good : bad })
  const allBullets = [...r.projects, ...r.experience, ...r.leadership]
    .flatMap(i => lines(i.bullets))
    .concat(lines(r.achievements))

  add(!!r.basics.name.trim(), 'Name added', 'Add your full name')
  add(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.basics.email.trim()), 'Email looks valid', 'Add a valid email address')
  add(r.basics.phone.replace(/\D/g, '').length >= 10, 'Phone number added', 'Add a phone number with at least 10 digits')
  add(r.education.some(e => e.school.trim() && e.degree.trim()), 'Education has institution and degree', 'Add your institution and degree')
  add(r.skills.some(s => s.items.trim()), 'Skills listed', 'List your skills so keyword scans can find them')
  add(r.projects.some(p => lines(p.bullets).length > 0) || r.experience.some(e => lines(e.bullets).length > 0),
    'Projects or experience described', 'Describe at least one project or internship with bullets')
  add(pages <= 2, pages === 1 ? 'Fits on one page' : 'Two pages is fine when the content needs it',
    `Runs to ${pages} pages. Try to keep it to two or fewer`)

  const long = allBullets.filter(b => wordCount(b) > 30).length
  add(long === 0, 'Bullets are short enough', `${long} bullet${long > 1 ? 's are' : ' is'} over 30 words. Split or trim`)

  if (allBullets.length >= 3) {
    const withNum = allBullets.filter(b => /\d/.test(b)).length
    add(withNum / allBullets.length >= 0.3, 'Bullets include numbers',
      'Few bullets have numbers. Add sizes, counts, percentages or time saved')
  }
  add(wordCount(r.summary) <= 60, 'Summary length is fine', 'Summary is over 60 words. Shorten it')
  return out
}
