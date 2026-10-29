import { COLLEGE } from '@/config'

export type Item = Record<string, string>

export interface Field {
  k: string
  l: string
  w?: 'full'
  ph?: string
  list?: string
  t?: 'area'
  rows?: number
}

export interface SectionDef {
  title: string
  kind: 'text' | 'list'
  rows?: number
  hint?: string
  fields?: Field[]
}

export type SectionKey =
  | 'summary' | 'education' | 'coursework' | 'skills' | 'projects' | 'experience'
  | 'leadership' | 'certifications' | 'achievements'

export interface Settings {
  template: 'classic' | 'modern'
  paper: 'A4' | 'Letter'
  fontSize: number
  margin: number
  linkStyle: 'label' | 'url'
  showLogo: boolean
  titles: Partial<Record<SectionKey, string>>
  order: SectionKey[]
}

export interface LinkItem { label: string; url: string }

export interface Resume {
  id: string
  name: string
  updated: number
  settings: Settings
  basics: Record<string, string>
  links: LinkItem[]
  summary: string
  coursework: string
  achievements: string
  education: Item[]
  skills: Item[]
  projects: Item[]
  experience: Item[]
  leadership: Item[]
  certifications: Item[]
}

export interface Db {
  current: string
  resumes: Record<string, Resume>
  logo?: string
}

export const BASICS: Field[] = [
  { k: 'name', l: 'Full name', w: 'full', ph: 'As on your certificates' },
  { k: 'email', l: 'Email', ph: 'firstname.lastname@gmail.com' },
  { k: 'phone', l: 'Phone', ph: '+91 00000 00000' },
  { k: 'location', l: 'City, State', ph: 'City, State' },
]

export const LINK_FIELDS: Field[] = [
  { k: 'label', l: 'Label shown', ph: 'LinkedIn' },
  { k: 'url', l: 'Web address', ph: 'linkedin.com/in/your-id' },
]

export const SECTIONS: Record<SectionKey, SectionDef> = {
  summary: { title: 'Summary', kind: 'text', rows: 3,
    hint: 'Optional. Two or three lines at most. Skip it if you have nothing specific to say.' },
  education: { title: 'Education', kind: 'list', fields: [
    { k: 'school', l: 'Institution', w: 'full' },
    { k: 'degree', l: 'Degree and branch', w: 'full', list: 'dl-degrees' },
    { k: 'location', l: 'Location' },
    { k: 'score', l: 'CGPA / Percentage', ph: 'CGPA: 8.4/10' },
    { k: 'start', l: 'Start', ph: 'Aug 2022' },
    { k: 'end', l: 'End or expected', ph: 'May 2026' },
  ] },
  coursework: { title: 'Coursework', kind: 'text', rows: 3,
    hint: 'Key courses, separated by commas. Pick the ones that matter for the role.' },
  skills: { title: 'Skills', kind: 'list', hint: 'One row per group, for example Languages, Tools, Databases.', fields: [
    { k: 'label', l: 'Group', ph: 'Languages' },
    { k: 'items', l: 'Skills (comma separated)', ph: 'Python, Java, C, SQL' },
  ] },
  projects: { title: 'Projects', kind: 'list', hint: 'One bullet per line. Say what you built, with what, and the result.', fields: [
    { k: 'name', l: 'Project name' },
    { k: 'tech', l: 'Tech used', ph: 'React, Node.js, MongoDB' },
    { k: 'link', l: 'Link (optional)', ph: 'github.com/you/project' },
    { k: 'linkText', l: 'Link text (optional)', ph: 'GitHub, Live demo, Paper' },
    { k: 'date', l: 'Date (optional)', ph: 'Mar 2025' },
    { k: 'bullets', l: 'Bullets (one per line)', w: 'full', t: 'area', rows: 4 },
  ] },
  experience: { title: 'Experience', kind: 'list', fields: [
    { k: 'role', l: 'Role', ph: 'Software Intern' },
    { k: 'org', l: 'Company' },
    { k: 'location', l: 'Location' },
    { k: 'start', l: 'Start' },
    { k: 'end', l: 'End' },
    { k: 'bullets', l: 'Bullets (one per line)', w: 'full', t: 'area', rows: 4 },
  ] },
  leadership: { title: 'Leadership and Activities', kind: 'list', hint: 'Clubs, student chapters, events, volunteering, sports.', fields: [
    { k: 'role', l: 'Role', ph: 'Technical Lead' },
    { k: 'org', l: 'Club / organisation' },
    { k: 'location', l: 'Location' },
    { k: 'start', l: 'Start' },
    { k: 'end', l: 'End' },
    { k: 'bullets', l: 'Bullets (one per line)', w: 'full', t: 'area', rows: 3 },
  ] },
  certifications: { title: 'Certifications', kind: 'list', fields: [
    { k: 'name', l: 'Certification', w: 'full' },
    { k: 'issuer', l: 'Issued by' },
    { k: 'date', l: 'Date' },
  ] },
  achievements: { title: 'Achievements', kind: 'text', rows: 4,
    hint: 'One per line. Ranks, hackathons, scholarships, publications.' },
}

export const DEFAULT_ORDER: SectionKey[] = [
  'summary', 'education', 'coursework', 'skills', 'projects', 'experience', 'certifications', 'achievements', 'leadership',
]

export const blankItem = (key: SectionKey): Item =>
  Object.fromEntries((SECTIONS[key].fields ?? []).map(f => [f.k, '']))

export const title = (r: Resume, k: SectionKey) =>
  (r.settings.titles?.[k] ?? '').trim() || SECTIONS[k].title

const newId = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function blankResume(name?: string): Resume {
  return {
    id: newId(),
    name: name || 'My resume',
    updated: Date.now(),
    settings: {
      template: 'classic', paper: 'A4', fontSize: 10.5, margin: 0.5,
      linkStyle: 'label', showLogo: true, titles: {}, order: DEFAULT_ORDER.slice(),
    },
    basics: Object.fromEntries(BASICS.map(f => [f.k, ''])),
    links: [{ label: 'LinkedIn', url: '' }, { label: 'GitHub', url: '' }],
    summary: '',
    coursework: '',
    achievements: '',
    education: [{ ...blankItem('education'), school: COLLEGE.name, location: COLLEGE.location }],
    skills: ['Languages', 'Frameworks and tools', 'Databases'].map(label => ({ label, items: '' })),
    projects: [blankItem('projects')],
    experience: [blankItem('experience')],
    leadership: [blankItem('leadership')],
    certifications: [blankItem('certifications')],
  }
}

// Fill gaps so older or imported data never breaks the editor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalise(r: any): Resume {
  const base = blankResume(r.name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {
    ...base, ...r,
    settings: { ...base.settings, ...(r.settings || {}) },
    basics: { ...base.basics, ...(r.basics || {}) },
  }
  for (const [k, s] of Object.entries(SECTIONS)) {
    if (s.kind === 'list') {
      out[k] = Array.isArray(r[k])
        ? r[k].map((i: Item) => ({ ...blankItem(k as SectionKey), ...i }))
        : [blankItem(k as SectionKey)]
    } else {
      out[k] = typeof r[k] === 'string' ? r[k] : ''
    }
  }
  if (Array.isArray(r.links)) {
    out.links = r.links.map((l: Partial<LinkItem>) => ({ label: l.label ?? '', url: l.url ?? '' }))
  } else {
    const old = r.basics || {}
    out.links = [['LinkedIn', old.linkedin], ['GitHub', old.github], ['Portfolio', old.portfolio]]
      .filter(x => x[1]).map(x => ({ label: x[0], url: x[1] }))
    if (!out.links.length) out.links = base.links
  }
  out.settings.titles = { ...(out.settings.titles || {}) }
  const order = ((out.settings.order || []) as SectionKey[]).filter(k => SECTIONS[k])
  DEFAULT_ORDER.forEach(k => { if (!order.includes(k)) order.push(k) })
  out.settings.order = order
  return out as Resume
}

export function sample(): Resume {
  const r = blankResume('Sample resume')
  r.basics = { name: 'Your Name', email: 'your.name@example.com', phone: '+91 00000 00000', location: '' }
  r.links = [{ label: 'LinkedIn', url: 'linkedin.com/in/your-id' }, { label: 'GitHub', url: 'github.com/your-id' }]
  r.education = [
    { school: COLLEGE.name, location: COLLEGE.location, degree: 'B.Tech in Computer Science and Engineering',
      score: 'CGPA: 8.6/10', start: 'Aug 2022', end: 'May 2026' },
    { school: 'Your Junior College', location: '', degree: 'Intermediate (MPC)',
      score: '97.2%', start: '2020', end: '2022' },
  ]
  r.coursework = 'Data Structures and Algorithms, Operating Systems, DBMS, Computer Networks, OOP, Machine Learning, Software Engineering'
  r.skills = [
    { label: 'Languages', items: 'Python, Java, C, C++, SQL, JavaScript, TypeScript' },
    { label: 'Web and backend', items: 'React, Node.js, Express, Flask, REST APIs, JWT authentication' },
    { label: 'Databases', items: 'MySQL, PostgreSQL, MongoDB, Redis' },
    { label: 'Tools and platforms', items: 'Git, GitHub Actions, Docker, Linux, Postman, AWS (EC2, S3)' },
  ]
  r.projects = [
    { name: 'Campus Event Portal', tech: 'React, Node.js, MongoDB', link: 'github.com/your-id/project-one', linkText: '', date: 'Jan - Mar 2025',
      bullets: 'Built a portal where **12 student clubs** publish events and **1,800+ students** register, replacing spreadsheets and chat groups.\nAdded QR check-in, which cut attendance entry at the annual fest from about **40 minutes to under 5**.\nDeployed on Render with role-based access for club admins and a nightly MongoDB backup.' },
    { name: 'Crop Disease Classifier', tech: 'Python, TensorFlow, Flask', link: 'github.com/your-id/project-two', linkText: '', date: 'Aug - Oct 2024',
      bullets: 'Trained a CNN on **54,000 leaf images** across **38 classes** and reached **94% test accuracy** after augmentation.\nWrapped the model in a Flask API that returns a prediction in **under 2 seconds** on a basic cloud instance.\nCompared MobileNetV2 and ResNet50 and picked MobileNetV2, which was **3x faster** with only a 1% drop in accuracy.' },
    { name: 'Distributed Task Queue', tech: 'Node.js, Redis, Docker', link: 'github.com/your-id/project-three', linkText: '', date: 'Nov 2024 - Jan 2025',
      bullets: 'Designed a job queue with **3 worker processes**, retries with backoff, and a dead-letter list for failed jobs.\nSustained **about 500 jobs/sec** in local load tests and added Prometheus metrics for queue depth and latency.\nPackaged everything with Docker Compose so the full stack starts with **one command**.' },
  ]
  r.experience = [
    { role: 'Software Development Intern', org: 'Company Name', location: '', start: 'Jun 2025', end: 'Jul 2025',
      bullets: 'Fixed **18 front-end defects** in the customer dashboard, reducing open UI tickets by **a third**.\nWrote **40 unit tests** with Jest, raising coverage on the billing module from **52% to 78%**.\nBuilt an internal reporting page with React and a REST endpoint, used by **15+ support staff** every week.' },
    { role: 'Teaching Assistant, Data Structures', org: 'Your College Name', location: '', start: 'Jan 2025', end: 'May 2025',
      bullets: 'Ran weekly lab sessions for **60 second-year students** and graded **200+** assignments with written feedback.' },
  ]
  r.certifications = [
    { name: 'Cloud Fundamentals Certification', issuer: 'Issuing Body', date: '2024' },
    { name: 'Programming Course Certificate', issuer: 'Platform Name', date: '2023' },
  ]
  r.achievements = 'Finalist, inter-college hackathon, 2024, among **120 teams**.\nTop **5%** in an online coding contest series, 2024.'
  r.leadership = [
    { role: 'Technical Lead', org: 'Coding Club', location: '', start: '2024', end: 'Present',
      bullets: 'Run weekly problem-solving sessions for about **60 first-year students**.\nOrganised a **24-hour hackathon** with **150+ participants** and 6 industry mentors.' },
  ]
  return normalise(r)
}
