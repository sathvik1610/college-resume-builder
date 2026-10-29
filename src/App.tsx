import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, FilePlus2, Loader2, Moon, Pencil, Sun, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Editor } from '@/components/Editor'
import { Preview } from '@/components/Preview'
import { COLLEGE } from '@/config'
import { runChecks } from '@/lib/checks'
import { blankResume, normalise } from '@/lib/model'
import { downloadPdf } from '@/lib/pdfClient'
import { logoSrc } from '@/lib/render'
import { useStore } from '@/lib/store'

type Dlg = null | 'new' | 'rename' | 'delete'

export default function App() {
  const { db, resume, update, mutateDb, save } = useStore()
  const [pages, setPages] = useState(1)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [dlg, setDlg] = useState<Dlg>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [dark, setDark] = useState(() => {
    try {
      const v = localStorage.getItem('crb:theme')
      if (v) return v === 'dark'
    } catch { /* storage blocked: follow the system setting */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('crb:theme', dark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [dark])

  const checks = useMemo(() => runChecks(resume, pages), [resume, pages])
  const logo = logoSrc(db.logo)
  const list = Object.values(db.resumes).sort((a, b) => b.updated - a.updated)

  const savePdf = async () => {
    setBusy(true)
    try { await downloadPdf(resume, db.logo) }
    catch (e) { console.error(e); alert('Could not create the PDF. Please try again.') }
    finally { setBusy(false) }
  }

  const open = (d: Dlg) => {
    setNameDraft(d === 'new' ? `Resume ${list.length + 1}` : d === 'rename' ? resume.name : '')
    setDlg(d)
  }

  const createResume = () => {
    const name = nameDraft.trim()
    if (!name) return
    mutateDb(d => {
      const r = blankResume(name)
      // carry over contact details so students do not retype them
      Object.assign(r.basics, d.resumes[d.current].basics)
      r.links = structuredClone(d.resumes[d.current].links)
      d.resumes[r.id] = r
      d.current = r.id
    })
    setDlg(null)
  }

  const duplicate = () =>
    mutateDb(d => {
      const src = d.resumes[d.current]
      const r = normalise({ ...structuredClone(src), id: undefined, name: src.name + ' copy' })
      r.updated = Date.now()
      d.resumes[r.id] = r
      d.current = r.id
    })

  const renameResume = () => {
    const name = nameDraft.trim()
    if (!name) return
    update(r => { r.name = name })
    setDlg(null)
  }

  const deleteResume = () => {
    mutateDb(d => {
      delete d.resumes[d.current]
      if (!Object.keys(d.resumes).length) { const r = blankResume('My resume'); d.resumes[r.id] = r }
      d.current = Object.keys(d.resumes)[0]
    })
    setDlg(null)
  }

  const saveText =
    save.state === 'saving' ? 'Saving…'
    : save.state === 'blocked' ? 'Not saved: browser storage is blocked. Export a backup.'
    : save.at ? `Saved in this browser, ${save.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Saved in this browser'

  return (
    <div className="flex h-full flex-col print:block print:h-auto">
      <header className="grid shrink-0 grid-cols-1 items-center gap-x-4 gap-y-2 bg-linear-to-r from-header-from to-header-to px-4 py-2 text-primary-foreground sm:grid-cols-[1fr_auto_1fr] sm:px-5 sm:py-3 print:hidden">
        <div className="order-2 hidden min-w-0 sm:order-1 sm:block">
          <span role="status" aria-live="polite" className="text-[13px] opacity-80">{saveText}</span>
        </div>
        <div className="order-1 flex items-center justify-center gap-3.5 sm:order-2">
          {logo && <img src={logo} alt="" className="h-10 w-auto max-w-[3.75rem] rounded-md bg-white object-contain p-1 sm:h-12 sm:max-w-[4.5rem]" />}
          <div className="text-left leading-tight">
            <h1 className="font-display text-xl font-bold tracking-wide sm:text-[1.55rem]">Resume Builder</h1>
            <p className="mt-0.5 text-xs tracking-wide opacity-85 sm:text-[13px]">{COLLEGE.name}</p>
          </div>
        </div>
        <div className="order-3 flex items-center justify-center gap-2 sm:justify-end">
          <Button variant="ghost" size="icon" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'} onClick={() => setDark(d => !d)}
            className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
            {dark ? <Sun /> : <Moon />}
          </Button>
          <Button onClick={savePdf} disabled={busy} className="bg-white font-semibold text-[#0a2a80] hover:bg-white/90">
            {busy ? <Loader2 className="animate-spin" /> : <Download />} {busy ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 items-center gap-2 border-b bg-card px-4 py-2 sm:px-5 print:hidden">
        <Select value={db.current} items={list.map(r => ({ value: r.id, label: r.name }))}
          onValueChange={v => v && mutateDb(d => { d.current = v })}>
          <SelectTrigger className="min-w-0 flex-1 sm:w-52 sm:flex-none" aria-label="Choose resume"><SelectValue /></SelectTrigger>
          <SelectContent>
            {list.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" aria-label="New resume" onClick={() => open('new')}><FilePlus2 /><span className="hidden sm:inline">New</span></Button>
        <Button variant="outline" aria-label="Duplicate resume" onClick={duplicate}><Copy /><span className="hidden sm:inline">Duplicate</span></Button>
        <Button variant="outline" aria-label="Rename resume" onClick={() => open('rename')}><Pencil /><span className="hidden sm:inline">Rename</span></Button>
        <Button variant="outline" aria-label="Delete resume" className="text-destructive hover:text-destructive" onClick={() => open('delete')}><Trash2 /><span className="hidden sm:inline">Delete</span></Button>
      </div>

      <Tabs value={view} onValueChange={v => setView(v as 'edit' | 'preview')} className="shrink-0 border-b bg-card px-4 py-1.5 lg:hidden print:hidden">
        <TabsList className="w-full">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
      </Tabs>

      <main className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(420px,520px)_minmax(0,1fr)] print:block">
        <div className={`min-h-0 overflow-y-auto border-r bg-background print:hidden ${view === 'edit' ? '' : 'hidden lg:block'}`}>
          <Editor db={db} resume={resume} update={update} checks={checks} />
        </div>
        <div className={`min-h-0 min-w-0 ${view === 'preview' ? '' : 'hidden lg:block'} print:!block`}>
          <Preview resume={resume} logo={db.logo} onPages={setPages} />
        </div>
      </main>

      <Dialog open={dlg === 'new' || dlg === 'rename'} onOpenChange={o => !o && setDlg(null)}>
        <DialogContent>
          <form onSubmit={e => { e.preventDefault(); dlg === 'new' ? createResume() : renameResume() }}>
            <DialogHeader>
              <DialogTitle>{dlg === 'new' ? 'New resume' : 'Rename resume'}</DialogTitle>
              <DialogDescription>
                {dlg === 'new'
                  ? 'Give it a name, for example Internship or Core roles. Your contact details are copied over.'
                  : 'This name is only for you. It does not appear on the resume.'}
              </DialogDescription>
            </DialogHeader>
            <Input className="my-4 w-full" autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)} aria-label="Resume name" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDlg(null)}>Cancel</Button>
              <Button type="submit" disabled={!nameDraft.trim()}>{dlg === 'new' ? 'Create' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dlg === 'delete'} onOpenChange={o => !o && setDlg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{resume.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the resume from this browser. It cannot be undone, so export a backup first if you might need it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteResume}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
