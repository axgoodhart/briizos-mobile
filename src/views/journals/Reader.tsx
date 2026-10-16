import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns2,
  FileText,
  LayoutDashboard,
  ListChecks,
  ListOrdered,
  MessageCircleQuestionMark,
  Ellipsis,
  Plus,
  Rows3,
  Table2,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import { pageIsDark, pageUrl } from '../../features/journals/assets'
import { FONT_CHOICES } from '../../features/journals/richText'
import {
  addFolio,
  journalFolios,
  moveFolio,
  trashFolio,
  updateFolio,
  updateJournal,
} from '../../features/journals/store'
import { BLANK_PAGES, TEMPLATES } from '../../features/journals/templates'
import { folioTypeLabel } from '../../features/journals/text'
import type { Folio, FolioContent, FolioRecipe, FolioType, Journal, ReadingMode, Typography } from '../../features/journals/types'
import { Confirm, Sheet } from './Sheet'
import { DashboardPage } from './pages/DashboardPage'
import { NotesPage } from './pages/NotesPage'
import { PromptsPage } from './pages/PromptsPage'
import { TodoPage } from './pages/TodoPage'
import { TrackerPage } from './pages/TrackerPage'

/* The Mac's default journal typography (JournalView.jsx → DEFAULT_TYPO). */
export const DEFAULT_TYPOGRAPHY: Typography = {
  h1: "Jost, 'SF Pro', system-ui, sans-serif",
  h2: "Jost, 'SF Pro', system-ui, sans-serif",
  h3: "Jost, 'SF Pro', system-ui, sans-serif",
  body: "Georgia, 'Times New Roman', serif",
  size: 16,
  lineHeight: 1.65,
}

export function FolioIcon({ type, size = 16 }: { type: FolioType; size?: number }) {
  if (type === 'todo') return <ListChecks size={size} aria-hidden="true" />
  if (type === 'prompts') return <MessageCircleQuestionMark size={size} aria-hidden="true" />
  if (type === 'tracker') return <Table2 size={size} aria-hidden="true" />
  if (type === 'dashboard') return <LayoutDashboard size={size} aria-hidden="true" />
  return <FileText size={size} aria-hidden="true" />
}

interface ReaderProps {
  journal: Journal
  folios: Folio[]
  startFolioId: string | null
  onBack: () => void
  onJournalSettings: () => void
}

type ReaderSheet = 'pages' | 'add' | 'type' | 'more' | null

export function Reader({ journal, folios, startFolioId, onBack, onJournalSettings }: ReaderProps) {
  const pages = useMemo(() => journalFolios(journal.id, folios), [folios, journal.id])
  const mode: ReadingMode = journal.settings.view ?? 'pages'
  const typography = { ...DEFAULT_TYPOGRAPHY, ...(journal.settings.typography ?? {}) }
  const [current, setCurrent] = useState(() => Math.max(0, pages.findIndex((page) => page.id === startFolioId)))
  const [sheet, setSheet] = useState<ReaderSheet>(null)
  const [pendingTrash, setPendingTrash] = useState<Folio | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef(new Map<string, HTMLElement>())
  const jumpedTo = useRef<string | null>(null)

  const currentPage = pages[Math.min(current, pages.length - 1)] ?? null

  const scrollToPage = useCallback((index: number, smooth = true) => {
    const page = pages[index]
    if (!page) return
    const element = pageRefs.current.get(page.id)
    const track = trackRef.current
    if (!element || !track) return
    if (mode === 'pages') track.scrollTo({ left: element.offsetLeft - 12, behavior: smooth ? 'smooth' : 'auto' })
    else track.scrollTo({ top: element.offsetTop - 4, behavior: smooth ? 'smooth' : 'auto' })
    setCurrent(index)
  }, [mode, pages])

  /* Open on the page we were asked for (from Search, Recents, the
     thoughts card) once its element exists. */
  useEffect(() => {
    if (!startFolioId || jumpedTo.current === startFolioId) return
    const index = pages.findIndex((page) => page.id === startFolioId)
    if (index < 0) return
    jumpedTo.current = startFolioId
    requestAnimationFrame(() => scrollToPage(index, false))
  }, [pages, scrollToPage, startFolioId])

  /* Keep the page counter in step with swiping or scrolling. */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible) return
      const id = (visible.target as HTMLElement).dataset.folioId
      const index = pages.findIndex((page) => page.id === id)
      if (index >= 0) setCurrent(index)
    }, { root: track, threshold: mode === 'pages' ? [0.6] : [0.35, 0.6] })
    pageRefs.current.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [mode, pages])

  const savePage = (folio: Folio) => (content: FolioContent, options: { quiet?: boolean } = {}) => {
    updateFolio(folio.id, { content }, { quiet: options.quiet ?? false })
  }

  const addPage = (recipe: FolioRecipe) => {
    const created = addFolio(journal.id, recipe, { afterId: currentPage?.id })
    setSheet(null)
    if (!created) return
    requestAnimationFrame(() => {
      const index = journalFolios(journal.id).findIndex((page) => page.id === created.id)
      if (index >= 0) scrollToPage(index)
    })
  }

  const setMode = (next: ReadingMode) => {
    const keep = currentPage
    updateJournal(journal.id, { settings: { view: next } }, `Switched “${journal.title}” to ${next === 'pages' ? 'page-by-page' : 'continuous scroll'} reading.`)
    if (keep) {
      jumpedTo.current = null
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const index = journalFolios(journal.id).findIndex((page) => page.id === keep.id)
        if (index >= 0) scrollToPage(index, false)
      }))
    }
  }

  const typographyStyle = {
    '--jx-h1-font': typography.h1,
    '--jx-h2-font': typography.h2,
    '--jx-h3-font': typography.h3,
    '--jx-body-font': typography.body,
    '--jx-body-size': `${typography.size}px`,
    '--jx-lh': String(typography.lineHeight),
    '--jx-paper': pageUrl(journal.page) ? `url("${pageUrl(journal.page)}")` : 'none',
  } as CSSProperties

  return (
    <section
      className={`jx-reader jx-reader--${mode}${pageIsDark(journal.page) ? ' jx-reader--dark-paper' : ''}`}
      style={typographyStyle}
      aria-label={`${journal.title} journal`}
    >
      <header className="jx-reader__bar">
        <button type="button" className="jx-round" aria-label="Back to your shelf" onClick={onBack}>
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div className="jx-reader__heading">
          <h1 className="jx-reader__title">{journal.title}</h1>
          {currentPage && <p className="jx-reader__subtitle">{currentPage.title || folioTypeLabel(currentPage.type)}</p>}
        </div>
        <button type="button" className="jx-round" aria-label="Typography" onClick={() => setSheet('type')}>
          <Type size={19} aria-hidden="true" />
        </button>
        <button type="button" className="jx-round" aria-label="More options" onClick={() => setSheet('more')}>
          <Ellipsis size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="jx-reader__track" ref={trackRef}>
        {pages.length === 0 && (
          <div className="jx-reader__empty">
            <p>This journal has no pages yet.</p>
            <button type="button" className="jx-button jx-button--primary" onClick={() => setSheet('add')}>
              <Plus size={16} aria-hidden="true" /> Add a page
            </button>
          </div>
        )}
        {pages.map((page, index) => (
          <article
            key={page.id}
            data-folio-id={page.id}
            ref={(element) => {
              if (element) pageRefs.current.set(page.id, element)
              else pageRefs.current.delete(page.id)
            }}
            className={`jx-paper jx-paper--${page.type}`}
            aria-label={`Page ${index + 1} of ${pages.length}: ${page.title || folioTypeLabel(page.type)}`}
          >
            <div className="jx-paper__scroll">
              <PageHeader folio={page} />
              <PageTags folio={page} />
              <div className="jx-paper__body">
                {page.type === 'notes' && <NotesPage key={page.id} folio={page} onSave={savePage(page)} />}
                {page.type === 'todo' && <TodoPage key={page.id} folio={page} onSave={savePage(page)} />}
                {page.type === 'prompts' && <PromptsPage key={page.id} folio={page} onSave={(content) => savePage(page)(content, { quiet: true })} />}
                {page.type === 'tracker' && <TrackerPage key={page.id} folio={page} onSave={savePage(page)} />}
                {page.type === 'dashboard' && <DashboardPage key={page.id} folio={page} siblings={pages} onSave={savePage(page)} />}
              </div>
              <p className="jx-paper__folio" aria-hidden="true">pg. {index + 1} of {pages.length}</p>
            </div>
          </article>
        ))}
      </div>

      <nav className="jx-reader__nav" aria-label="Turn pages">
        <button type="button" className="jx-round" aria-label="Previous page" disabled={current <= 0} onClick={() => scrollToPage(current - 1)}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button type="button" className="jx-reader__count" onClick={() => setSheet('pages')} aria-label={`Page ${current + 1} of ${pages.length}. Show all pages.`}>
          <BookOpen size={16} aria-hidden="true" />
          {pages.length ? `${current + 1} / ${pages.length}` : '0 pages'}
        </button>
        <button type="button" className="jx-round" aria-label="Next page" disabled={current >= pages.length - 1} onClick={() => scrollToPage(current + 1)}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <button type="button" className="jx-reader__add" onClick={() => setSheet('add')}>
          <Plus size={16} aria-hidden="true" /> Page
        </button>
      </nav>

      {sheet === 'pages' && (
        <PagesSheet
          pages={pages}
          current={current}
          onJump={(index) => {
            setSheet(null)
            requestAnimationFrame(() => scrollToPage(index))
          }}
          onTrash={(page) => setPendingTrash(page)}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'add' && <AddPageSheet onPick={addPage} onClose={() => setSheet(null)} />}

      {sheet === 'type' && (
        <TypographySheet
          value={typography}
          onChange={(next) => updateJournal(journal.id, { settings: { typography: next } }, `Changed the typography of “${journal.title}”.`)}
          onReset={() => updateJournal(journal.id, { settings: { typography: { ...DEFAULT_TYPOGRAPHY } } }, `Reset the typography of “${journal.title}”.`)}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'more' && (
        <Sheet title={journal.title} onClose={() => setSheet(null)}>
          <div className="jx-segment" role="group" aria-label="Reading">
            <button type="button" className={mode === 'pages' ? 'is-active' : ''} aria-pressed={mode === 'pages'} onClick={() => setMode('pages')}>
              <Columns2 size={16} aria-hidden="true" /> Pages
            </button>
            <button type="button" className={mode === 'scroll' ? 'is-active' : ''} aria-pressed={mode === 'scroll'} onClick={() => setMode('scroll')}>
              <Rows3 size={16} aria-hidden="true" /> Scroll
            </button>
          </div>
          <button type="button" className="jx-setting" onClick={() => setSheet('pages')}>
            <ListOrdered size={18} aria-hidden="true" />
            <span className="jx-setting__text"><span className="jx-setting__label">All pages</span><span className="jx-setting__hint">Jump to, reorder or remove pages</span></span>
          </button>
          <button type="button" className="jx-setting" onClick={() => setSheet('add')}>
            <Plus size={18} aria-hidden="true" />
            <span className="jx-setting__text"><span className="jx-setting__label">Add a page</span><span className="jx-setting__hint">Blank, or borrowed from a template</span></span>
          </button>
          <button type="button" className="jx-setting" onClick={() => { setSheet(null); onJournalSettings() }}>
            <BookOpen size={18} aria-hidden="true" />
            <span className="jx-setting__text"><span className="jx-setting__label">Journal details</span><span className="jx-setting__hint">Title, tags, cover and page style</span></span>
          </button>
          {currentPage && (
            <button type="button" className="jx-setting jx-setting--danger" onClick={() => setPendingTrash(currentPage)}>
              <Trash2 size={18} aria-hidden="true" />
              <span className="jx-setting__text"><span className="jx-setting__label">Remove this page</span><span className="jx-setting__hint">It goes to Trash and can be restored</span></span>
            </button>
          )}
        </Sheet>
      )}

      {pendingTrash && (
        <Confirm
          title={`Remove “${pendingTrash.title || folioTypeLabel(pendingTrash.type)}”?`}
          message="The page moves to Trash. You can restore it from Settings → Trash."
          confirmLabel="Move to Trash"
          onConfirm={() => {
            trashFolio(pendingTrash.id)
            setPendingTrash(null)
            setSheet(null)
            setCurrent((index) => Math.max(0, Math.min(index, pages.length - 2)))
          }}
          onCancel={() => setPendingTrash(null)}
        />
      )}
    </section>
  )
}

/* ── Page title and tags ────────────────────────────────────────────── */

function PageHeader({ folio }: { folio: Folio }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(folio.title)

  const commit = () => {
    setEditing(false)
    const title = draft.trim()
    if (title && title !== folio.title) updateFolio(folio.id, { title })
    else setDraft(folio.title)
  }

  return (
    <header className="jx-paper__header">
      <span className="jx-paper__type"><FolioIcon type={folio.type} size={13} /> {folioTypeLabel(folio.type)}</span>
      {editing ? (
        <input
          className="jx-paper__title-input"
          value={draft}
          autoFocus
          aria-label="Page title"
          enterKeyHint="done"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') {
              setDraft(folio.title)
              setEditing(false)
            }
          }}
        />
      ) : (
        <button type="button" className="jx-paper__title" onClick={() => { setDraft(folio.title); setEditing(true) }} aria-label={`Page title: ${folio.title}. Tap to rename.`}>
          {folio.title || folioTypeLabel(folio.type)}
        </button>
      )}
    </header>
  )
}

function PageTags({ folio }: { folio: Folio }) {
  const tags = folio.content.groupTags ?? []
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const save = (next: string[]) => updateFolio(folio.id, { content: { ...folio.content, groupTags: next } }, { quiet: true })

  const commit = () => {
    const tag = draft.trim().replace(/^#/, '').replace(/,+$/, '')
    setDraft('')
    setAdding(false)
    if (!tag || tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return
    save([...tags, tag])
  }

  return (
    <div className="jx-paper__tags" aria-label="Page tags">
      {tags.map((tag) => (
        <span key={tag} className="jx-tag">
          #{tag}
          <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => save(tags.filter((existing) => existing !== tag))}>
            <X size={11} aria-hidden="true" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          className="jx-tag-input"
          value={draft}
          autoFocus
          placeholder="tag"
          aria-label="New tag"
          enterKeyHint="done"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              commit()
            }
            if (event.key === 'Escape') {
              setDraft('')
              setAdding(false)
            }
          }}
        />
      ) : (
        <button type="button" className="jx-tag jx-tag--add" onClick={() => setAdding(true)} aria-label="Add a tag to this page">
          + tag
        </button>
      )}
    </div>
  )
}

/* ── Sheets ─────────────────────────────────────────────────────────── */

function PagesSheet({ pages, current, onJump, onTrash, onClose }: {
  pages: Folio[]
  current: number
  onJump: (index: number) => void
  onTrash: (page: Folio) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  return (
    <Sheet title="Pages" subtitle={`${pages.length} page${pages.length === 1 ? '' : 's'}`} onClose={onClose} tall>
      {pages.length > 6 && (
        <input
          className="jx-input"
          type="search"
          placeholder="Find a page by title"
          aria-label="Find a page by title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      <ol className="jx-pagelist">
        {pages.map((page, index) => {
          if (needle && !page.title.toLowerCase().includes(needle)) return null
          return (
            <li key={page.id} className={`jx-pagelist__item${index === current ? ' is-current' : ''}`}>
              <button type="button" className="jx-pagelist__open" onClick={() => onJump(index)}>
                <span className="jx-pagelist__number">{index + 1}</span>
                <FolioIcon type={page.type} />
                <span className="jx-pagelist__title">{page.title || folioTypeLabel(page.type)}</span>
              </button>
              <span className="jx-pagelist__actions">
                <button type="button" className="jx-round jx-round--small" aria-label={`Move ${page.title} earlier`} disabled={index === 0} onClick={() => moveFolio(page.id, -1)}>
                  <ArrowUp size={15} aria-hidden="true" />
                </button>
                <button type="button" className="jx-round jx-round--small" aria-label={`Move ${page.title} later`} disabled={index === pages.length - 1} onClick={() => moveFolio(page.id, 1)}>
                  <ArrowDown size={15} aria-hidden="true" />
                </button>
                <button type="button" className="jx-round jx-round--small jx-round--danger" aria-label={`Remove ${page.title}`} onClick={() => onTrash(page)}>
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </span>
            </li>
          )
        })}
      </ol>
    </Sheet>
  )
}

function AddPageSheet({ onPick, onClose }: { onPick: (recipe: FolioRecipe) => void; onClose: () => void }) {
  return (
    <Sheet title="Add a page" subtitle="It goes right after the page you’re on" onClose={onClose} tall>
      <h3 className="jx-field__label">Blank pages</h3>
      <div className="jx-option-list">
        {BLANK_PAGES.map((option) => (
          <button key={option.label} type="button" className="jx-option" onClick={() => onPick(option.folio)}>
            <FolioIcon type={option.folio.type} size={18} />
            <span className="jx-option__text">
              <span className="jx-option__label">{option.label}</span>
              <span className="jx-option__hint">{option.hint}</span>
            </span>
          </button>
        ))}
      </div>
      {TEMPLATES.filter((template) => template.id !== 'blank').map((template) => (
        <section key={template.id} aria-label={`Pages from ${template.name}`}>
          <h3 className="jx-field__label">From {template.name}</h3>
          <div className="jx-option-list">
            {template.folios.map((folio) => (
              <button key={`${template.id}-${folio.title}`} type="button" className="jx-option" onClick={() => onPick(folio)}>
                <FolioIcon type={folio.type} size={18} />
                <span className="jx-option__text">
                  <span className="jx-option__label">{folio.title}</span>
                  <span className="jx-option__hint">{folioTypeLabel(folio.type)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </Sheet>
  )
}

function TypographySheet({ value, onChange, onReset, onClose }: {
  value: Typography
  onChange: (next: Typography) => void
  onReset: () => void
  onClose: () => void
}) {
  const fontRow = (key: 'h1' | 'h2' | 'h3' | 'body', label: string) => {
    const known = FONT_CHOICES.some((font) => font.value === value[key])
    return (
      <label className="jx-field" key={key}>
        <span className="jx-field__label">{label}</span>
        <select
          className="jx-input"
          value={value[key]}
          onChange={(event) => onChange({ ...value, [key]: event.target.value })}
          style={{ '--theme-font': value[key], fontFamily: value[key] } as CSSProperties}
        >
          {!known && <option value={value[key]}>Current font</option>}
          {FONT_CHOICES.map((font) => (
            <option key={font.label} value={font.value}>{font.label}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <Sheet
      title="Typography"
      subtitle="For this journal’s writing pages"
      onClose={onClose}
      footer={<button type="button" className="jx-button" onClick={onReset}>Reset to default</button>}
    >
      {fontRow('h1', 'Large heading font')}
      {fontRow('h2', 'Medium heading font')}
      {fontRow('h3', 'Small heading font')}
      {fontRow('body', 'Body font')}
      <label className="jx-field">
        <span className="jx-field__label">Text size · {value.size}px</span>
        <input
          type="range"
          min={12}
          max={24}
          step={1}
          value={value.size}
          onChange={(event) => onChange({ ...value, size: Number(event.target.value) })}
        />
      </label>
      <div className="jx-field">
        <span className="jx-field__label">Line spacing</span>
        <div className="jx-choice-row">
          {[1.35, 1.5, 1.65, 1.8, 2].map((height) => (
            <button
              key={height}
              type="button"
              className={`jx-choice${value.lineHeight === height ? ' is-active' : ''}`}
              onClick={() => onChange({ ...value, lineHeight: height })}
            >
              {height}
            </button>
          ))}
        </div>
      </div>
      <p className="jx-type-preview" style={{ '--theme-font': value.body, fontFamily: value.body, fontSize: `${value.size}px`, lineHeight: value.lineHeight } as CSSProperties}>
        <strong style={{ '--theme-font': value.h1, fontFamily: value.h1 } as CSSProperties}>A heading</strong>
        <br />
        The quick brown fox jumps over the lazy dog, then writes it all down.
      </p>
    </Sheet>
  )
}
