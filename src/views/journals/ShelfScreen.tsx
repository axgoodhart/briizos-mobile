import { useMemo, useState, type CSSProperties } from 'react'
import { Camera, Import, Mic, Moon, Ellipsis, PenLine, Plus, Search, SlidersHorizontal, Sun, X } from 'lucide-react'
import { coverTint, coverUrl } from '../../features/journals/assets'
import { latestLine, truncate } from '../../features/journals/text'
import type { Folio, Journal } from '../../features/journals/types'

export type ShelfSort = 'opened' | 'edited' | 'title' | 'created'

export const SHELF_SORTS: { id: ShelfSort; label: string }[] = [
  { id: 'opened', label: 'Recently opened' },
  { id: 'edited', label: 'Recently written in' },
  { id: 'title', label: 'Title, A to Z' },
  { id: 'created', label: 'Newest first' },
]

export type CaptureMode = 'write' | 'speak' | 'photo'

interface ShelfScreenProps {
  journals: Journal[]
  folios: Folio[]
  theme: 'dark' | 'light'
  sort: ShelfSort
  onToggleTheme: () => void
  onOpenSort: () => void
  onOpenJournal: (journalId: string, folioId?: string) => void
  onJournalMenu: (journalId: string) => void
  onCreate: () => void
  onImport: () => void
  onCapture: (mode: CaptureMode) => void
}

export function sortJournals(journals: Journal[], sort: ShelfSort) {
  const sorted = [...journals]
  if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title))
  else if (sort === 'created') sorted.sort((a, b) => b.createdAt - a.createdAt)
  else if (sort === 'edited') sorted.sort((a, b) => b.updatedAt - a.updatedAt)
  else sorted.sort((a, b) => (b.openedAt ?? b.updatedAt) - (a.openedAt ?? a.updatedAt))
  return sorted
}

export function ShelfScreen({
  journals,
  folios,
  theme,
  sort,
  onToggleTheme,
  onOpenSort,
  onOpenJournal,
  onJournalMenu,
  onCreate,
  onImport,
  onCapture,
}: ShelfScreenProps) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)

  const pageCounts = useMemo(() => {
    const counts = new Map<string, number>()
    folios.forEach((folio) => {
      if (!folio.deletedAt) counts.set(folio.journalId, (counts.get(folio.journalId) ?? 0) + 1)
    })
    return counts
  }, [folios])

  const tags = useMemo(() => {
    const tally = new Map<string, number>()
    journals.forEach((journal) => journal.tags.forEach((value) => tally.set(value, (tally.get(value) ?? 0) + 1)))
    return [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => value)
  }, [journals])

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sortJournals(journals, sort).filter((journal) => {
      if (tag && !journal.tags.includes(tag)) return false
      if (!needle) return true
      return journal.title.toLowerCase().includes(needle) || journal.tags.some((value) => value.toLowerCase().includes(needle))
    })
  }, [journals, query, sort, tag])

  const faceOut = shown.slice(0, 3)
  const spines = shown.slice(3)
  const filtering = !!query.trim() || !!tag

  /* "Your thoughts": the last line written on the most recently changed
     page that has words on it. */
  const thought = useMemo(() => {
    const liveJournals = new Set(journals.map((journal) => journal.id))
    const candidates = folios
      .filter((folio) => !folio.deletedAt && liveJournals.has(folio.journalId) && folio.type !== 'dashboard')
      .sort((a, b) => b.updatedAt - a.updatedAt)
    for (const folio of candidates) {
      const line = latestLine(folio)
      if (line) return { folio, line: truncate(line, 96) }
    }
    return null
  }, [folios, journals])

  return (
    <section className="jx-shelf" aria-labelledby="jx-shelf-title">
      <header className="jx-shelf__header">
        <div>
          <p className="jx-brand">briizOS</p>
          <h1 id="jx-shelf-title" className="jx-display">Journals</h1>
        </div>
        <div className="jx-shelf__aside">
          <button
            type="button"
            className="jx-sun"
            aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <Sun size={22} aria-hidden="true" /> : <Moon size={21} aria-hidden="true" />}
          </button>
          <p className="jx-motto">A quieter mind builds a brighter tomorrow.</p>
        </div>
      </header>

      <div className="jx-search">
        <Search size={20} aria-hidden="true" className="jx-search__icon" />
        <input
          className="jx-search__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search journals by title or tag…"
          aria-label="Search journals by title or tag"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="jx-search__clear" aria-label="Clear search" onClick={() => setQuery('')}>
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="jx-search__filter" aria-label="Sort the shelf" onClick={onOpenSort}>
          <SlidersHorizontal size={18} aria-hidden="true" />
        </button>
      </div>

      {tags.length > 0 && (
        <div className="jx-chips" role="group" aria-label="Filter by tag">
          <button type="button" className={`jx-chip${tag === null ? ' is-active' : ''}`} aria-pressed={tag === null} onClick={() => setTag(null)}>
            All
          </button>
          {tags.map((value) => (
            <button
              key={value}
              type="button"
              className={`jx-chip${tag === value ? ' is-active' : ''}`}
              aria-pressed={tag === value}
              onClick={() => setTag(tag === value ? null : value)}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      <div className="jx-ledge">
        <div className="jx-ledge__books">
          {faceOut.map((journal) => (
            <button
              key={journal.id}
              type="button"
              className="jx-faceout"
              onClick={() => onOpenJournal(journal.id)}
              aria-label={`Open ${journal.title}, ${pageCounts.get(journal.id) ?? 0} folios`}
            >
              <CoverImage journal={journal} />
            </button>
          ))}
          {Array.from({ length: Math.max(0, 3 - faceOut.length) }, (_, index) => (
            <div key={`slot-${index}`} className="jx-faceout jx-faceout--empty" aria-hidden="true">
              {index === 0 && faceOut.length === 0 && (
                <span>{filtering ? 'No journals match' : 'Your first journal stands here'}</span>
              )}
            </div>
          ))}
        </div>
        <div className="jx-ledge__board" aria-hidden="true" />
        <div className="jx-ledge__actions" role="group" aria-label="Quick capture">
          <button type="button" className="jx-orb jx-orb--write" aria-label="Write a quick entry" onClick={() => onCapture('write')}>
            <PenLine size={22} aria-hidden="true" />
          </button>
          <button type="button" className="jx-orb jx-orb--import" aria-label="Start a journal from text files" onClick={onImport}>
            <Import size={22} aria-hidden="true" />
          </button>
          <button type="button" className="jx-orb jx-orb--photo" aria-label="Add a photo to a journal" onClick={() => onCapture('photo')}>
            <Camera size={22} aria-hidden="true" />
          </button>
          <button type="button" className="jx-orb jx-orb--speak" aria-label="Speak an entry" onClick={() => onCapture('speak')}>
            <Mic size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="jx-lower">
        <div className="jx-spines" role="list" aria-label="More journals">
          {spines.map((journal) => (
            <div
              key={journal.id}
              role="listitem"
              className="jx-spine"
              style={{ '--jx-spine': coverTint(journal.cover) } as CSSProperties}
            >
              <button type="button" className="jx-spine__open" onClick={() => onOpenJournal(journal.id)}>
                <span className="jx-spine__title">{journal.title}</span>
                <span className="jx-spine__meta">{pageCounts.get(journal.id) ?? 0} folios</span>
              </button>
              <button type="button" className="jx-spine__more" aria-label={`Options for ${journal.title}`} onClick={() => onJournalMenu(journal.id)}>
                <Ellipsis size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
          {spines.length === 0 && (
            <p className="jx-spines__empty">
              {filtering && shown.length === 0 ? (
                <button type="button" className="jx-link" onClick={() => { setQuery(''); setTag(null) }}>Show every journal</button>
              ) : (
                'More journals line up here.'
              )}
            </p>
          )}
          <span className="jx-spines__edge" aria-hidden="true" />
        </div>

        <button
          type="button"
          className="jx-thoughts"
          disabled={!thought}
          onClick={() => thought && onOpenJournal(thought.folio.journalId, thought.folio.id)}
          aria-label={thought ? `Your thoughts: “${thought.line}”. Open this page.` : 'Your thoughts will show here once you write something.'}
        >
          <span className="jx-thoughts__label">
            Your thoughts:
            <span className="jx-thoughts__arrow" aria-hidden="true">- - - -›</span>
          </span>
          <span className="jx-thoughts__quote">
            {thought ? `“${thought.line}”` : 'Nothing written yet. Tap the pen to start.'}
          </span>
        </button>
      </div>

      <button type="button" className="jx-newcard" onClick={onCreate}>
        <span className="jx-newcard__plus" aria-hidden="true"><Plus size={46} strokeWidth={1.4} /></span>
        <span className="jx-newcard__text">
          <span className="jx-newcard__title">New Journal</span>
          <span className="jx-newcard__subtitle">Create something meaningful.</span>
        </span>
      </button>
    </section>
  )
}

export function CoverImage({ journal, small = false }: { journal: Journal; small?: boolean }) {
  const url = coverUrl(journal.cover)
  return (
    <span className={`jx-cover${small ? ' jx-cover--small' : ''}`} style={{ '--jx-spine': coverTint(journal.cover) } as CSSProperties}>
      {url ? <img src={url} alt="" draggable={false} loading="lazy" /> : <span className="jx-cover__fallback">{journal.title}</span>}
    </span>
  )
}
