import { useMemo } from 'react'
import { folioTypeLabel, latestLine, relativeTime, truncate } from '../../features/journals/text'
import type { Folio, Journal } from '../../features/journals/types'
import { CoverImage } from './ShelfScreen'

interface RecentsScreenProps {
  journals: Journal[]
  folios: Folio[]
  onOpen: (journalId: string, folioId: string) => void
}

/* Pages you changed lately, newest first, grouped by day. */
export function RecentsScreen({ journals, folios, onOpen }: RecentsScreenProps) {
  const groups = useMemo(() => {
    const byId = new Map(journals.map((journal) => [journal.id, journal]))
    const recent = folios
      // Only pages someone has written in; a template's untouched pages stay out.
      .filter((folio) => !folio.deletedAt && byId.has(folio.journalId) && folio.updatedAt > folio.createdAt)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 60)
    const days = new Map<string, { label: string; items: { folio: Folio; journal: Journal }[] }>()
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    for (const folio of recent) {
      const date = new Date(folio.updatedAt)
      const key = date.toDateString()
      const label = key === today
        ? 'Today'
        : key === yesterday
          ? 'Yesterday'
          : new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
      if (!days.has(key)) days.set(key, { label, items: [] })
      days.get(key)?.items.push({ folio, journal: byId.get(folio.journalId) as Journal })
    }
    return [...days.values()]
  }, [folios, journals])

  return (
    <section className="jx-screen" aria-labelledby="jx-recents-title">
      <header className="jx-screen__header">
        <p className="jx-brand">Journals</p>
        <h1 id="jx-recents-title" className="jx-display jx-display--small">Recents</h1>
      </header>
      <div className="jx-list">
        {groups.length === 0 && <p className="jx-empty">Pages you write in will gather here.</p>}
        {groups.map((group) => (
          <section key={group.label} className="jx-list__group" aria-label={group.label}>
            <h2 className="jx-list__heading">{group.label}</h2>
            {group.items.map(({ folio, journal }) => {
              const line = latestLine(folio)
              return (
                <button key={folio.id} type="button" className="jx-row" onClick={() => onOpen(journal.id, folio.id)}>
                  <CoverImage journal={journal} small />
                  <span className="jx-row__text">
                    <span className="jx-row__title">{folio.title || folioTypeLabel(folio.type)}</span>
                    <span className="jx-row__meta">{journal.title} · {relativeTime(folio.updatedAt)}</span>
                    {line && <span className="jx-row__snippet">{truncate(line, 110)}</span>}
                  </span>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </section>
  )
}
