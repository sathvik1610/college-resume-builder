import { useCallback, useEffect, useRef, useState } from 'react'
import { blankResume, normalise, sample, type Db, type Resume } from './model'

const KEY = 'crb:v1'
const memory: Record<string, string> = {}
let storageOk = true

function readRaw(): string | null {
  try { return localStorage.getItem(KEY) } catch { storageOk = false; return memory[KEY] ?? null }
}
function writeRaw(v: string): boolean {
  try { localStorage.setItem(KEY, v); return true } catch { storageOk = false; memory[KEY] = v; return false }
}

function load(): Db {
  try {
    const raw = JSON.parse(readRaw() || 'null')
    if (raw && raw.resumes && Object.keys(raw.resumes).length) {
      const resumes: Record<string, Resume> = {}
      for (const [id, r] of Object.entries(raw.resumes)) resumes[id] = normalise({ ...(r as object), id })
      return {
        current: resumes[raw.current] ? raw.current : Object.keys(resumes)[0],
        resumes,
        logo: raw.logo,
      }
    }
  } catch { /* first run or corrupt data: start fresh */ }
  // first visit: show placeholder content so the layout is visible
  const r = { ...sample(), name: 'My resume' }
  return { current: r.id, resumes: { [r.id]: r } }
}

export type SaveState = { state: 'saved' | 'saving' | 'blocked'; at?: Date }

export function useStore() {
  const [db, setDb] = useState<Db>(load)
  const [save, setSave] = useState<SaveState>({ state: storageOk ? 'saved' : 'blocked' })
  const ref = useRef(db)
  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    const ok = writeRaw(JSON.stringify(ref.current))
    setSave({ state: ok ? 'saved' : 'blocked', at: new Date() })
  }, [])

  const commit = useCallback((next: Db) => {
    ref.current = next
    setDb(next)
    setSave(s => ({ ...s, state: 'saving' }))
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 350)
  }, [flush])

  // Change the current resume. The callback may mutate its copy.
  const update = useCallback((fn: (r: Resume, db: Db) => void) => {
    const next = structuredClone(ref.current)
    const r = next.resumes[next.current]
    fn(r, next)
    r.updated = Date.now()
    commit(next)
  }, [commit])

  // Change the whole database (add, delete, switch resumes).
  const mutateDb = useCallback((fn: (db: Db) => void) => {
    const next = structuredClone(ref.current)
    fn(next)
    commit(next)
  }, [commit])

  useEffect(() => {
    const onHide = () => { if (timer.current) flush() }
    window.addEventListener('pagehide', onHide)
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {})
    return () => window.removeEventListener('pagehide', onHide)
  }, [flush])

  return { db, resume: db.resumes[db.current], update, mutateDb, save, blankResume }
}
