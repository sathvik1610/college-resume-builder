import { useId, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { COLLEGE } from '@/config'
import type { Check } from '@/lib/checks'
import { download, slug, toText } from '@/lib/exporters'
import {
  BASICS, LINK_FIELDS, SECTIONS, blankItem, normalise, sample, title,
  type Db, type Field, type Resume, type SectionKey,
} from '@/lib/model'
import { logoSrc } from '@/lib/render'
import { cn } from '@/lib/utils'

type Update = (fn: (r: Resume, db: Db) => void) => void

interface Props {
  db: Db
  resume: Resume
  update: Update
  checks: Check[]
}

/* ---------- small building blocks ---------- */

function Fld({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className={cn('grid gap-1.5', field.w === 'full' && 'col-span-2')}>
      <Label htmlFor={id} className="text-[13px] text-foreground/80">{field.l}</Label>
      {field.t === 'area' ? (
        <Textarea id={id} rows={field.rows ?? 3} value={value} placeholder={field.ph}
          onChange={e => onChange(e.target.value)} className="min-h-0 resize-y leading-snug" />
      ) : (
        <Input id={id} className="w-full" value={value} placeholder={field.ph} list={field.list} autoComplete="off"
          onChange={e => onChange(e.target.value)} />
      )}
    </div>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-snug text-muted-foreground">{children}</p>
}

function Section({ value, label, extra, children }: { value: string; label: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="items-center rounded-none px-4 py-3.5 text-[15px] font-semibold hover:no-underline">
        <span className="flex-1">{label}</span>
        {extra}
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-4 px-4 pt-1 pb-4">{children}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

function EntryCard({ label, index, count, onMove, onRemove, children }: {
  label: string; index: number; count: number
  onMove: (d: -1 | 1) => void; onRemove: () => void; children: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{label || `Entry ${index + 1}`}</span>
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="icon-xs" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp /></Button>
          <Button variant="ghost" size="icon-xs" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown /></Button>
          <Button variant="ghost" size="icon-xs" aria-label="Remove entry" className="text-destructive hover:text-destructive" onClick={onRemove}><Trash2 /></Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">{children}</div>
    </div>
  )
}

function SetSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={v => v && onChange(v)} items={options}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/* ---------- editor ---------- */

export function Editor({ db, resume: r, update, checks }: Props) {
  const fileIn = useRef<HTMLInputElement>(null)
  const logoIn = useRef<HTMLInputElement>(null)
  const [confirmSample, setConfirmSample] = useState(false)
  const fixes = checks.filter(c => !c.ok).length
  const order = r.settings.order

  const setList = (key: SectionKey, i: number, k: string, v: string) =>
    update(res => { (res[key as 'projects'] as Record<string, string>[])[i][k] = v })
  const addItem = (key: SectionKey) =>
    update(res => { (res[key as 'projects'] as Record<string, string>[]).push(blankItem(key)) })
  const removeItem = (key: SectionKey, i: number) =>
    update(res => {
      const list = res[key as 'projects'] as Record<string, string>[]
      list.splice(i, 1)
      if (!list.length) list.push(blankItem(key))
    })
  const moveItem = (key: SectionKey, i: number, d: -1 | 1) =>
    update(res => {
      const list = res[key as 'projects'] as unknown[]
      const j = i + d
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]]
    })
  const moveSection = (key: SectionKey, d: -1 | 1) =>
    update(res => {
      const o = res.settings.order, i = o.indexOf(key), j = i + d
      if (j < 0 || j >= o.length) return;
      [o[i], o[j]] = [o[j], o[i]]
    })

  const onLogoFile = (file?: File) => {
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      // shrink so the saved logo stays small (max 300px on the long side)
      const k = Math.min(1, 300 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      const data = c.toDataURL('image/png')
      URL.revokeObjectURL(url)
      update((res, d) => { d.logo = data; res.settings.showLogo = true })
    }
    img.onerror = () => alert('Could not read that image. Use a PNG, JPG or SVG file.')
    img.src = url
  }

  const onImport = (file?: File) => {
    if (!file) return
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const data = JSON.parse(String(rd.result))
        const src = data.resume || data
        if (!src || typeof src !== 'object' || !src.basics) throw new Error('not a resume file')
        const n = normalise(src)
        n.id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        n.updated = Date.now()
        update((_res, d) => { d.resumes[n.id] = n; d.current = n.id })
      } catch { alert('That file is not a valid resume backup.') }
    }
    rd.readAsText(file)
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 p-4">
      <datalist id="dl-degrees">{COLLEGE.degrees.map(d => <option key={d} value={d} />)}</datalist>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Accordion multiple defaultValue={['checks', 'contact', 'education']}>

          <Section value="checks" label="Resume check"
            extra={<Badge variant={fixes ? 'outline' : 'secondary'} className={cn('mr-2', fixes ? 'text-amber-700' : 'text-emerald-700')}>{fixes ? `${fixes} to fix` : 'All clear'}</Badge>}>
            <ul className="grid gap-1.5">
              {checks.map(c => (
                <li key={c.text} className="flex items-start gap-2.5 text-sm">
                  <span className={cn('mt-0.5 w-8 shrink-0 text-[11px] font-bold tracking-wide uppercase', c.ok ? 'text-emerald-700' : 'text-amber-700')}>{c.ok ? 'OK' : 'Fix'}</span>
                  <span className={cn(!c.ok && 'font-medium')}>{c.text}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section value="layout" label="Layout and format">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-[13px] text-foreground/80">Template</Label>
                <SetSelect value={r.settings.template} onChange={v => update(x => { x.settings.template = v as 'classic' })}
                  options={[{ value: 'classic', label: 'Classic (LaTeX style)' }, { value: 'modern', label: 'Modern (sans-serif)' }]} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[13px] text-foreground/80">Paper</Label>
                <SetSelect value={r.settings.paper} onChange={v => update(x => { x.settings.paper = v as 'A4' })}
                  options={[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'US Letter' }]} />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-foreground/80">Font size <span className="font-normal text-muted-foreground">{r.settings.fontSize} pt</span></Label>
                <Slider min={9} max={12} step={0.5} value={[r.settings.fontSize]}
                  onValueChange={v => update(x => { x.settings.fontSize = Array.isArray(v) ? v[0] : v })} />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-foreground/80">Margins <span className="font-normal text-muted-foreground">{r.settings.margin} in</span></Label>
                <Slider min={0.4} max={1} step={0.05} value={[r.settings.margin]}
                  onValueChange={v => update(x => { x.settings.margin = Array.isArray(v) ? v[0] : v })} />
              </div>
              <div className="col-span-2 grid gap-1.5">
                <Label className="text-[13px] text-foreground/80">Links in the header</Label>
                <SetSelect value={r.settings.linkStyle} onChange={v => update(x => { x.settings.linkStyle = v as 'label' })}
                  options={[{ value: 'label', label: 'Short labels (GitHub, LinkedIn)' }, { value: 'url', label: 'Full web addresses' }]} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex min-w-0 items-center gap-3">
                {logoSrc(db.logo) && <img src={logoSrc(db.logo)} alt="" className="h-9 w-auto max-w-14 rounded-sm border bg-white object-contain" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium">College logo</p>
                  <p className="text-xs text-muted-foreground">{db.logo ? 'Using your uploaded logo' : 'Using the official logo'}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch checked={r.settings.showLogo} aria-label="Show logo on resume"
                  onCheckedChange={c => update(x => { x.settings.showLogo = c })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => logoIn.current?.click()}><Upload /> Upload a different logo</Button>
              {db.logo && <Button variant="ghost" size="sm" onClick={() => update((_x, d) => { delete d.logo })}>Reset to official logo</Button>}
              <input ref={logoIn} type="file" hidden accept="image/png,image/jpeg,image/svg+xml"
                onChange={e => { onLogoFile(e.target.files?.[0]); e.target.value = '' }} />
            </div>
            <Hint>Both templates are single column with plain text headings. No tables, icons, photos or graphics, so ATS software reads them correctly.</Hint>
          </Section>

          <Section value="contact" label="Contact details">
            <div className="grid grid-cols-2 gap-3">
              {BASICS.map(f => (
                <Fld key={f.k} field={f} value={r.basics[f.k] ?? ''}
                  onChange={v => update(x => { x.basics[f.k] = v })} />
              ))}
            </div>
          </Section>

          <Section value="links" label="Links">
            <Hint>Add any links you want in the header: LinkedIn, GitHub, portfolio, Google Scholar, LeetCode, a published paper. Blank rows are ignored.</Hint>
            {r.links.map((l, i) => (
              <EntryCard key={i} label={l.label || l.url} index={i} count={r.links.length}
                onMove={d => update(x => { const j = i + d; if (j >= 0 && j < x.links.length) [x.links[i], x.links[j]] = [x.links[j], x.links[i]] })}
                onRemove={() => update(x => { x.links.splice(i, 1) })}>
                {LINK_FIELDS.map(f => (
                  <Fld key={f.k} field={f} value={l[f.k as 'label' | 'url']}
                    onChange={v => update(x => { x.links[i][f.k as 'label' | 'url'] = v })} />
                ))}
              </EntryCard>
            ))}
            <Button variant="outline" size="sm" className="w-fit" onClick={() => update(x => { x.links.push({ label: '', url: '' }) })}><Plus /> Add link</Button>
          </Section>

          {order.map((key, idx) => {
            const s = SECTIONS[key]
            const t = title(r, key)
            return (
              <Section key={key} value={key} label={t}>
                <div className="flex items-end gap-2">
                  <div className="grid flex-1 gap-1.5">
                    <Label htmlFor={`title-${key}`} className="text-[13px] text-foreground/80">Heading shown on resume</Label>
                    <Input id={`title-${key}`} className="w-full" value={r.settings.titles[key] ?? ''} placeholder={s.title} autoComplete="off"
                      onChange={e => update(x => { x.settings.titles[key] = e.target.value })} />
                  </div>
                  <Button variant="outline" size="icon" aria-label={`Move ${t} up`} disabled={idx === 0} onClick={() => moveSection(key, -1)}><ArrowUp /></Button>
                  <Button variant="outline" size="icon" aria-label={`Move ${t} down`} disabled={idx === order.length - 1} onClick={() => moveSection(key, 1)}><ArrowDown /></Button>
                </div>
                {s.hint && <Hint>{s.hint}</Hint>}
                {s.kind === 'text' ? (
                  <Textarea aria-label={t} rows={s.rows} value={r[key as 'summary']}
                    onChange={e => update(x => { x[key as 'summary'] = e.target.value })} className="min-h-0 resize-y leading-snug" />
                ) : (
                  <>
                    {r[key as 'projects'].map((item, i) => (
                      <EntryCard key={i} label={item[s.fields![0].k] || item[s.fields![1]?.k] || ''}
                        index={i} count={r[key as 'projects'].length}
                        onMove={d => moveItem(key, i, d)} onRemove={() => removeItem(key, i)}>
                        {s.fields!.map(f => (
                          <Fld key={f.k} field={f} value={item[f.k] ?? ''} onChange={v => setList(key, i, f.k, v)} />
                        ))}
                      </EntryCard>
                    ))}
                    <Button variant="outline" size="sm" className="w-fit" onClick={() => addItem(key)}><Plus /> Add entry</Button>
                  </>
                )}
              </Section>
            )
          })}

          <Section value="data" label="Your data">
            <Hint>Everything is saved in this browser on this device. Clearing your browser data removes it, so export a backup now and then.</Hint>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm"
                onClick={() => download(slug(r.name) + '.json', JSON.stringify({ app: 'college-resume-builder', version: 1, resume: r }, null, 2), 'application/json')}>Export backup (.json)</Button>
              <Button variant="outline" size="sm" onClick={() => fileIn.current?.click()}>Import backup</Button>
              <Button variant="outline" size="sm"
                onClick={() => download(slug(r.basics.name || r.name) + '.txt', toText(r), 'text/plain')}>Export plain text</Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmSample(true)}>Load sample content</Button>
              <input ref={fileIn} type="file" hidden accept="application/json,.json"
                onChange={e => { onImport(e.target.files?.[0]); e.target.value = '' }} />
            </div>
          </Section>
        </Accordion>
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        To save a PDF choose <em>Save as PDF</em> in the print dialog and turn off <em>Headers and footers</em>.
      </p>

      <AlertDialog open={confirmSample} onOpenChange={setConfirmSample}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace this resume with sample content?</AlertDialogTitle>
            <AlertDialogDescription>Your current text in this resume will be overwritten. Use Duplicate first if you want to keep it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => update((x, d) => {
              const s = sample()
              d.resumes[x.id] = { ...s, id: x.id, name: x.name, settings: x.settings }
            })}>Replace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
