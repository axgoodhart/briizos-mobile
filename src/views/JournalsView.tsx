import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Clock, Library, Plus, Search, Settings } from 'lucide-react'
import './JournalsView.css'
import { TEXT_FILE_ACCEPT, readTextFiles, type ImportDoc } from '../features/journals/importText'
import { storePhoto } from '../features/journals/media'
import { logActivity, markJournalOpened, useJournals } from '../features/journals/store'
import type { Journal } from '../features/journals/types'
import { CaptureSheet } from './journals/CaptureSheet'
import { CreateJournalSheet } from './journals/CreateJournalSheet'
import { JournalDetailsSheet } from './journals/JournalDetailsSheet'
import { Reader } from './journals/Reader'
import { RecentsScreen } from './journals/RecentsScreen'
import { SearchScreen } from './journals/SearchScreen'
import { SettingsScreen, type OtherArea } from './journals/SettingsScreen'
import { SHELF_SORTS, ShelfScreen, type CaptureMode, type ShelfSort } from './journals/ShelfScreen'
import { Sheet } from './journals/Sheet'

type Tab = 'shelf' | 'search' | 'recents' | 'settings'
type Theme = 'dark' | 'light'

const THEME_KEY = 'briizos.journals.theme'
const SORT_KEY = 'briizos.journals.sort'

function readPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

function writePreference(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* Preferences are a convenience; nothing is lost if they can't be kept. */
  }
}

const OTHER_AREAS: OtherArea[] = [
  { id: 'home', label: 'Home', hint: 'The briizOS start screen' },
  { id: 'files', label: 'Files', hint: 'Notes, tasks and events' },
  { id: 'chats', label: 'Chats', hint: 'Talk with briizOS' },
  { id: 'menu', label: 'Menu', hint: 'Account and everything else' },
]

interface JournalsViewProps {
  onLeave?: (areaId: string) => void
}

/* Journals: the shelf, search, recents and settings, with their own
   bottom bar, plus the inside of an open journal. Everything is kept on
   this phone (see features/journals/store.ts). */
export default function JournalsView({ onLeave }: JournalsViewProps) {
  const { ready, journals: allJournals, folios, activity, storage } = useJournals()
  const [tab, setTab] = useState<Tab>('shelf')
  const [theme, setTheme] = useState<Theme>(() => readPreference(THEME_KEY, ['dark', 'light'] as const, 'dark'))
  const [sort, setSort] = useState<ShelfSort>(() => readPreference(SORT_KEY, SHELF_SORTS.map((option) => option.id), 'opened'))
  const [open, setOpen] = useState<{ journalId: string; folioId: string | null } | null>(null)
  const [creating, setCreating] = useState<{ docs: ImportDoc[]; skipped: { name: string; reason: string }[] } | null>(null)
  const [capture, setCapture] = useState<{ mode: CaptureMode; photos: string[] } | null>(null)
  const [detailsFor, setDetailsFor] = useState<string | null>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; journalId?: string; folioId?: string } | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)

  const journals = useMemo(() => allJournals.filter((journal) => !journal.deletedAt), [allJournals])
  const openJournal = open ? journals.find((journal) => journal.id === open.journalId) ?? null : null
  const detailsJournal = detailsFor ? journals.find((journal) => journal.id === detailsFor) ?? null : null

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const goToJournal = (journalId: string, folioId: string | null = null) => {
    markJournalOpened(journalId)
    setOpen({ journalId, folioId })
  }

  const changeTheme = (next: Theme) => {
    setTheme(next)
    writePreference(THEME_KEY, next)
    logActivity('info', 'appearance', `Switched Journals to the ${next} appearance.`)
  }

  const changeSort = (next: ShelfSort) => {
    setSort(next)
    writePreference(SORT_KEY, next)
    setSortOpen(false)
  }

  /* The import and camera buttons open the phone's file and camera
     pickers straight away, in the same tap. */
  const startImport = () => importInput.current?.click()

  const onImportFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const result = await readTextFiles(files)
    if (importInput.current) importInput.current.value = ''
    if (result.skipped.length) {
      logActivity('warn', 'import', `${result.skipped.length} file${result.skipped.length === 1 ? ' was' : 's were'} left out of the import.`, {
        files: result.skipped.map((file) => `${file.name} (${file.reason})`),
      })
    }
    if (!result.docs.length) {
      setToast({ message: 'None of those files could be read as text.' })
      return
    }
    setCreating({ docs: result.docs, skipped: result.skipped })
  }

  const startCapture = (mode: CaptureMode) => {
    if (mode === 'photo') {
      cameraInput.current?.click()
      return
    }
    setCapture({ mode, photos: [] })
  }

  const onCameraPhoto = async (files: FileList | null) => {
    const file = files?.[0]
    if (cameraInput.current) cameraInput.current.value = ''
    if (!file) return
    try {
      const src = await storePhoto(file)
      setCapture({ mode: 'photo', photos: [src] })
    } catch {
      setToast({ message: 'That photo could not be added. Details are in Settings → Activity log.' })
    }
  }

  const leave = (areaId: string) => {
    if (onLeave) onLeave(areaId)
  }

  const showBar = !openJournal

  return (
    <div className={`bz-journals jx-theme-${theme}`}>
      {storage.status === 'error' && storage.message && (
        <p className="jx-storage-alert" role="alert">{storage.message}</p>
      )}

      {!ready ? (
        <div className="jx-loading" role="status">Opening your shelf…</div>
      ) : openJournal ? (
        <Reader
          key={openJournal.id}
          journal={openJournal}
          folios={folios}
          startFolioId={open?.folioId ?? null}
          onBack={() => setOpen(null)}
          onJournalSettings={() => setDetailsFor(openJournal.id)}
        />
      ) : (
        <main className="jx-main">
          {tab === 'shelf' && (
            <ShelfScreen
              journals={journals}
              folios={folios}
              theme={theme}
              sort={sort}
              onToggleTheme={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}
              onOpenSort={() => setSortOpen(true)}
              onOpenJournal={goToJournal}
              onJournalMenu={setDetailsFor}
              onCreate={() => setCreating({ docs: [], skipped: [] })}
              onImport={startImport}
              onCapture={startCapture}
            />
          )}
          {tab === 'search' && <SearchScreen journals={journals} folios={folios} onOpen={goToJournal} />}
          {tab === 'recents' && <RecentsScreen journals={journals} folios={folios} onOpen={goToJournal} />}
          {tab === 'settings' && (
            <SettingsScreen
              journals={allJournals}
              folios={folios}
              activity={activity}
              theme={theme}
              onSetTheme={changeTheme}
              otherAreas={OTHER_AREAS}
              onLeave={leave}
            />
          )}
        </main>
      )}

      {showBar && (
        <nav className="jx-tabbar" aria-label="Journals">
          <TabButton label="Journals" active={tab === 'shelf'} onPress={() => setTab('shelf')}><Library size={24} aria-hidden="true" /></TabButton>
          <TabButton label="Search" active={tab === 'search'} onPress={() => setTab('search')}><Search size={24} aria-hidden="true" /></TabButton>
          <button type="button" className="jx-tabbar__create" aria-label="New journal" onClick={() => setCreating({ docs: [], skipped: [] })}>
            <Plus size={30} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <TabButton label="Recents" active={tab === 'recents'} onPress={() => setTab('recents')}><Clock size={24} aria-hidden="true" /></TabButton>
          <TabButton label="Settings" active={tab === 'settings'} onPress={() => setTab('settings')}><Settings size={24} aria-hidden="true" /></TabButton>
        </nav>
      )}

      <input ref={importInput} type="file" accept={TEXT_FILE_ACCEPT} multiple hidden onChange={(event) => void onImportFiles(event.target.files)} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(event) => void onCameraPhoto(event.target.files)} />

      {creating && (
        <CreateJournalSheet
          initialDocs={creating.docs}
          initialSkipped={creating.skipped}
          onCreated={(journal: Journal) => {
            setCreating(null)
            setTab('shelf')
            goToJournal(journal.id)
          }}
          onClose={() => setCreating(null)}
        />
      )}

      {capture && (
        <CaptureSheet
          mode={capture.mode}
          journals={journals}
          folios={folios}
          initialPhotos={capture.photos}
          onSaved={(journalId, folioId, message) => {
            setCapture(null)
            setToast({ message, journalId, folioId })
          }}
          onClose={() => setCapture(null)}
        />
      )}

      {detailsJournal && (
        <JournalDetailsSheet
          key={detailsJournal.id}
          journal={detailsJournal}
          onOpen={openJournal ? undefined : () => goToJournal(detailsJournal.id)}
          onTrashed={() => {
            setDetailsFor(null)
            if (open?.journalId === detailsJournal.id) setOpen(null)
          }}
          onClose={() => setDetailsFor(null)}
        />
      )}

      {sortOpen && (
        <Sheet title="Arrange the shelf" onClose={() => setSortOpen(false)}>
          <div className="jx-option-list" role="radiogroup" aria-label="Arrange by">
            {SHELF_SORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={sort === option.id}
                className={`jx-option${sort === option.id ? ' is-active' : ''}`}
                onClick={() => changeSort(option.id)}
              >
                <span className="jx-option__text"><span className="jx-option__label">{option.label}</span></span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {toast && (
        <div className={`jx-toast${showBar ? '' : ' jx-toast--low'}`} role="status">
          <span>{toast.message}</span>
          {toast.journalId && (
            <button
              type="button"
              className="jx-toast__action"
              onClick={() => {
                const { journalId, folioId } = toast
                setToast(null)
                if (journalId) goToJournal(journalId, folioId ?? null)
              }}
            >
              Open
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({ label, active, onPress, children }: { label: string; active: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`jx-tabbar__item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onPress}>
      {children}
      <span>{label}</span>
    </button>
  )
}
