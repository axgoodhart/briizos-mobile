import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { folioBlocks, folioTypeLabel, snippetAround } from '../../features/journals/text'
import type { Folio, Journal } from '../../features/journals/types'
import { CoverImage } from './ShelfScreen'

interface SearchScreenProps {
  journals: Journal[]
  folios: Folio[]
  onOpen: (journalId: string, folioId: string) => void
}

interface Hit {
  folio: Folio
  journal: Journal
  snippet: string
  inTitle: boolean
}

/* Search inside every page of every journal: page titles, writing,
   checklist items, reflection answers and log rows. */
export function SearchScreen({ journals, folios, onOpen }: SearchScreenProps) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()

  const hits = useMemo<Hit[]>(() => {
    if (needle.length < 2) return []
    const byId = new Map(journals.map((journal) => [journal.id, journal]))
    const found: Hit[] = []
    for (const folio of folios) {
      const journal = byId.get(folio.journalId)
      if (!journal || folio.deletedAt) continue
      const inTitle = folio.title.toLowerCase().includes(needle)
      const line = folioBlocks(folio).find((text) => text.toLowerCase().includes(needle))
      if (!inTitle && !line) continue
      found.push({ folio, journal, inTitle, snippet: line ? snippetAround(line, needle) : '' })
    }
    return found.sort((a, b) => Number(b.inTitle) - Number(a.inTitle) || b.folio.updatedAt - a.folio.updatedAt).slice(0, 200)
  }, [folios, journals, needle])

  return (
    <section className="jx-screen" aria-labelledby="jx-search-title">
      <header className="jx-screen__header">
        <p className="jx-brand">Journals</p>
        <h1 id="jx-search-title" className="jx-display jx-display--small">Search</h1>
      </header>
      <div className="jx-search">
        <Search size={20} aria-hidden="true" className="jx-search__icon" />
        <input
          className="jx-search__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search inside your pages…"
          aria-label="Search inside your pages"
          enterKeyHint="search"
          autoFocus
        />
        {query && (
          <button type="button" className="jx-search__clear" aria-label="Clear search" onClick={() => setQuery('')}>
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="jx-list" role="list">
        {needle.length < 2 && <p className="jx-empty">Type at least two letters to look through every page.</p>}
        {needle.length >= 2 && hits.length === 0 && <p className="jx-empty">Nothing on any page says “{query.trim()}”.</p>}
        {hits.map((hit) => (
          <button key={hit.folio.id} type="button" role="listitem" className="jx-row" onClick={() => onOpen(hit.journal.id, hit.folio.id)}>
            <CoverImage journal={hit.journal} small />
            <span className="jx-row__text">
              <span className="jx-row__title">{hit.folio.title || folioTypeLabel(hit.folio.type)}</span>
              <span className="jx-row__meta">{hit.journal.title} · {folioTypeLabel(hit.folio.type)}</span>
              {hit.snippet && <span className="jx-row__snippet">{hit.snippet}</span>}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
