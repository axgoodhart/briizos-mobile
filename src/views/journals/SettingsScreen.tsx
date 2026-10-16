import { useMemo, useRef, useState } from 'react'
import { ArchiveRestore, ChevronLeft, ChevronRight, Download, FileUp, ListTree, Moon, Sun, Trash2 } from 'lucide-react'
import {
  clearActivity,
  deleteFolioForever,
  deleteJournalForever,
  emptyTrash,
  exportBackup,
  importBackup,
  logActivity,
  restoreFolio,
  restoreJournal,
} from '../../features/journals/store'
import { folioTypeLabel, relativeTime } from '../../features/journals/text'
import type { ActivityEntry, Folio, Journal } from '../../features/journals/types'
import { Confirm } from './Sheet'
import { CoverImage } from './ShelfScreen'

export interface OtherArea {
  id: string
  label: string
  hint: string
}

interface SettingsScreenProps {
  journals: Journal[]
  folios: Folio[]
  activity: ActivityEntry[]
  theme: 'dark' | 'light'
  onSetTheme: (theme: 'dark' | 'light') => void
  otherAreas: OtherArea[]
  onLeave: (areaId: string) => void
}

type Panel = 'main' | 'trash' | 'activity'

export function SettingsScreen({ journals, folios, activity, theme, onSetTheme, otherAreas, onLeave }: SettingsScreenProps) {
  const [panel, setPanel] = useState<Panel>('main')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const restoreInput = useRef<HTMLInputElement>(null)

  const trashedJournals = journals.filter((journal) => journal.deletedAt)
  const liveJournalIds = new Set(journals.filter((journal) => !journal.deletedAt).map((journal) => journal.id))
  const trashedPages = folios.filter((folio) => folio.deletedAt && liveJournalIds.has(folio.journalId))
  const trashCount = trashedJournals.length + trashedPages.length

  const makeBackup = async () => {
    setBusy('backup')
    setNotice(null)
    try {
      const blob = await exportBackup()
      const stamp = new Date().toISOString().slice(0, 10)
      const name = `briizos-journals-${stamp}.json`
      const file = new File([blob], name, { type: 'application/json' })
      const shareable = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
      if (shareable && navigator.share) {
        await navigator.share({ files: [file], title: 'briizOS journals backup' })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = name
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 30000)
      }
      setNotice('Backup made. Keep the file somewhere safe, like Files or iCloud Drive.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setNotice('Backup cancelled.')
      } else {
        const message = error instanceof Error ? error.message : String(error)
        logActivity('error', 'backup', `The backup could not be made: ${message}`)
        setNotice(`The backup could not be made: ${message}`)
      }
    } finally {
      setBusy(null)
    }
  }

  const restore = async (file: File | undefined) => {
    if (!file) return
    setBusy('restore')
    setNotice(null)
    try {
      const result = await importBackup(file)
      setNotice(`Restored ${result.journals} journals, ${result.folios} pages and ${result.images} photos. Newer copies already on this phone were kept.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logActivity('error', 'backup', `A backup could not be restored: ${message}`)
      setNotice(`That backup could not be restored: ${message}`)
    } finally {
      setBusy(null)
      if (restoreInput.current) restoreInput.current.value = ''
    }
  }

  if (panel === 'trash') {
    return <TrashPanel journals={trashedJournals} pages={trashedPages} allJournals={journals} onBack={() => setPanel('main')} />
  }
  if (panel === 'activity') {
    return <ActivityPanel activity={activity} onBack={() => setPanel('main')} />
  }

  return (
    <section className="jx-screen" aria-labelledby="jx-settings-title">
      <header className="jx-screen__header">
        <p className="jx-brand">Journals</p>
        <h1 id="jx-settings-title" className="jx-display jx-display--small">Settings</h1>
      </header>

      <div className="jx-list">
        <section className="jx-list__group" aria-label="Appearance">
          <h2 className="jx-list__heading">Appearance</h2>
          <div className="jx-segment" role="group" aria-label="Appearance">
            <button type="button" className={theme === 'dark' ? 'is-active' : ''} aria-pressed={theme === 'dark'} onClick={() => onSetTheme('dark')}>
              <Moon size={16} aria-hidden="true" /> Dark
            </button>
            <button type="button" className={theme === 'light' ? 'is-active' : ''} aria-pressed={theme === 'light'} onClick={() => onSetTheme('light')}>
              <Sun size={16} aria-hidden="true" /> Light
            </button>
          </div>
        </section>

        <section className="jx-list__group" aria-label="Your journals">
          <h2 className="jx-list__heading">Your journals</h2>
          <button type="button" className="jx-setting" onClick={() => setPanel('trash')}>
            <Trash2 size={18} aria-hidden="true" />
            <span className="jx-setting__text">
              <span className="jx-setting__label">Trash</span>
              <span className="jx-setting__hint">{trashCount ? `${trashCount} item${trashCount === 1 ? '' : 's'} you can restore` : 'Empty'}</span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="jx-setting" disabled={busy !== null} onClick={makeBackup}>
            <Download size={18} aria-hidden="true" />
            <span className="jx-setting__text">
              <span className="jx-setting__label">{busy === 'backup' ? 'Making a backup…' : 'Back up journals'}</span>
              <span className="jx-setting__hint">Saves every journal, page and photo into one file</span>
            </span>
          </button>
          <button type="button" className="jx-setting" disabled={busy !== null} onClick={() => restoreInput.current?.click()}>
            <FileUp size={18} aria-hidden="true" />
            <span className="jx-setting__text">
              <span className="jx-setting__label">{busy === 'restore' ? 'Restoring…' : 'Restore from a backup'}</span>
              <span className="jx-setting__hint">Adds what’s missing; never overwrites newer writing</span>
            </span>
          </button>
          <input
            ref={restoreInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => void restore(event.target.files?.[0])}
          />
          {notice && <p className="jx-notice" role="status">{notice}</p>}
          <p className="jx-fineprint">
            Journals live on this phone only for now. Connecting them to briizOS on your Mac comes later.
          </p>
        </section>

        <section className="jx-list__group" aria-label="Activity">
          <h2 className="jx-list__heading">Activity</h2>
          <button type="button" className="jx-setting" onClick={() => setPanel('activity')}>
            <ListTree size={18} aria-hidden="true" />
            <span className="jx-setting__text">
              <span className="jx-setting__label">Activity log</span>
              <span className="jx-setting__hint">Everything Journals saved, changed or had trouble with</span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </section>

        <section className="jx-list__group" aria-label="Other parts of briizOS">
          <h2 className="jx-list__heading">Other parts of briizOS</h2>
          {otherAreas.map((area) => (
            <button key={area.id} type="button" className="jx-setting" onClick={() => onLeave(area.id)}>
              <span className="jx-setting__text">
                <span className="jx-setting__label">{area.label}</span>
                <span className="jx-setting__hint">{area.hint}</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          ))}
        </section>
      </div>
    </section>
  )
}

type PendingDelete =
  | { kind: 'journal'; id: string; title: string }
  | { kind: 'page'; id: string; title: string }
  | { kind: 'all' }

function TrashPanel({ journals, pages, allJournals, onBack }: { journals: Journal[]; pages: Folio[]; allJournals: Journal[]; onBack: () => void }) {
  const [pending, setPending] = useState<PendingDelete | null>(null)
  const journalTitles = useMemo(() => new Map(allJournals.map((journal) => [journal.id, journal.title])), [allJournals])
  const empty = !journals.length && !pages.length

  const confirmDelete = () => {
    if (!pending) return
    if (pending.kind === 'journal') deleteJournalForever(pending.id)
    else if (pending.kind === 'page') deleteFolioForever(pending.id)
    else emptyTrash()
    setPending(null)
  }

  return (
    <section className="jx-screen" aria-labelledby="jx-trash-title">
      <header className="jx-screen__header jx-screen__header--back">
        <button type="button" className="jx-round" aria-label="Back to Settings" onClick={onBack}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 id="jx-trash-title" className="jx-display jx-display--small">Trash</h1>
      </header>
      <div className="jx-list">
        {empty && <p className="jx-empty">Trash is empty. Journals and pages you remove wait here until you delete them for good.</p>}
        {journals.length > 0 && (
          <section className="jx-list__group" aria-label="Journals">
            <h2 className="jx-list__heading">Journals</h2>
            {journals.map((journal) => (
              <div key={journal.id} className="jx-row jx-row--static">
                <CoverImage journal={journal} small />
                <span className="jx-row__text">
                  <span className="jx-row__title">{journal.title}</span>
                  <span className="jx-row__meta">Removed {relativeTime(journal.deletedAt ?? journal.updatedAt)}</span>
                </span>
                <span className="jx-row__actions">
                  <button type="button" className="jx-round" aria-label={`Restore ${journal.title}`} onClick={() => restoreJournal(journal.id)}>
                    <ArchiveRestore size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="jx-round jx-round--danger" aria-label={`Delete ${journal.title} forever`} onClick={() => setPending({ kind: 'journal', id: journal.id, title: journal.title })}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
          </section>
        )}
        {pages.length > 0 && (
          <section className="jx-list__group" aria-label="Pages">
            <h2 className="jx-list__heading">Pages</h2>
            {pages.map((page) => (
              <div key={page.id} className="jx-row jx-row--static">
                <span className="jx-row__text">
                  <span className="jx-row__title">{page.title || folioTypeLabel(page.type)}</span>
                  <span className="jx-row__meta">From {journalTitles.get(page.journalId) ?? 'a journal'} · {folioTypeLabel(page.type)}</span>
                </span>
                <span className="jx-row__actions">
                  <button type="button" className="jx-round" aria-label={`Restore ${page.title}`} onClick={() => restoreFolio(page.id)}>
                    <ArchiveRestore size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="jx-round jx-round--danger" aria-label={`Delete ${page.title} forever`} onClick={() => setPending({ kind: 'page', id: page.id, title: page.title })}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
          </section>
        )}
        {!empty && (
          <button type="button" className="jx-button jx-button--danger jx-button--wide" onClick={() => setPending({ kind: 'all' })}>
            Empty Trash
          </button>
        )}
      </div>
      {pending && (
        <Confirm
          title={pending.kind === 'all' ? 'Empty Trash?' : `Delete “${pending.title}” forever?`}
          message={pending.kind === 'all'
            ? 'Everything in Trash, including its photos, will be gone for good. This can’t be undone.'
            : 'It will be gone for good, including any photos on it. This can’t be undone.'}
          confirmLabel={pending.kind === 'all' ? 'Empty Trash' : 'Delete forever'}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      )}
    </section>
  )
}

function ActivityPanel({ activity, onBack }: { activity: ActivityEntry[]; onBack: () => void }) {
  const [filter, setFilter] = useState<'all' | 'problems'>('all')
  const shown = filter === 'all' ? activity : activity.filter((entry) => entry.level !== 'info')
  return (
    <section className="jx-screen" aria-labelledby="jx-activity-title">
      <header className="jx-screen__header jx-screen__header--back">
        <button type="button" className="jx-round" aria-label="Back to Settings" onClick={onBack}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 id="jx-activity-title" className="jx-display jx-display--small">Activity</h1>
      </header>
      <div className="jx-segment" role="group" aria-label="Show">
        <button type="button" className={filter === 'all' ? 'is-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Everything</button>
        <button type="button" className={filter === 'problems' ? 'is-active' : ''} aria-pressed={filter === 'problems'} onClick={() => setFilter('problems')}>Problems only</button>
      </div>
      <div className="jx-list" role="log" aria-live="polite">
        {shown.length === 0 && <p className="jx-empty">Nothing to show yet.</p>}
        {shown.map((entry) => (
          <article key={entry.id} className={`jx-log jx-log--${entry.level}`}>
            <header className="jx-log__meta">
              <span>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(entry.at))}</span>
              <span>{entry.area}</span>
            </header>
            <p className="jx-log__message">{entry.message}</p>
            {entry.detail && (
              <dl className="jx-log__detail">
                {Object.entries(entry.detail).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                    <dd>{Array.isArray(value) ? value.join(', ') || '—' : String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        ))}
        {activity.length > 0 && (
          <button type="button" className="jx-button jx-button--wide" onClick={clearActivity}>Clear the log</button>
        )}
      </div>
    </section>
  )
}
