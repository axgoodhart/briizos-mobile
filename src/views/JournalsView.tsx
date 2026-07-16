import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Feather,
  FileText,
  ListChecks,
  LockKeyhole,
  Plus,
  Search,
  Table2,
  Trash2,
  X,
} from 'lucide-react'
import {
  JOURNAL_COVERS,
  JOURNAL_TEMPLATES,
  createBlankFolio,
  createJournalFromTemplate,
  loadMobileJournals,
  makeJournalId,
  saveMobileJournals,
} from '../features/journals/journalStore'
import type {
  JournalCover,
  JournalFolio,
  JournalFolioContent,
  JournalFolioType,
  JournalTemplate,
  JournalTodoItem,
  MobileJournal,
} from '../features/journals/journalStore'
import './JournalsView.css'

type EditableFolioType = Exclude<JournalFolioType, 'dashboard'>

const COVER_CLASS: Record<string, string> = {
  Manuscript: 'manuscript',
  Humanist: 'humanist',
  'Fantasy Card': 'fantasy',
  Diagrammical: 'diagrammical',
  Coverboard: 'coverboard',
  Blushflower: 'blushflower',
}

const FOLIO_LABELS: Record<JournalFolioType, string> = {
  notes: 'Notes',
  todo: 'Checklist',
  prompts: 'Prompts',
  tracker: 'Tracker',
  dashboard: 'Dashboard',
}

const ADDABLE_FOLIOS: { type: EditableFolioType; label: string; description: string }[] = [
  { type: 'notes', label: 'Notes', description: 'A free-writing page' },
  { type: 'todo', label: 'Checklist', description: 'Things to finish' },
  { type: 'prompts', label: 'Reflection', description: 'Questions and answers' },
  { type: 'tracker', label: 'Tracker', description: 'Rows that build a record' },
]

function coverClassName(cover: string) {
  return `journal-cover--${COVER_CLASS[cover] ?? 'manuscript'}`
}

function folioIcon(type: JournalFolioType, size = 17) {
  if (type === 'todo') return <ListChecks size={size} aria-hidden="true" />
  if (type === 'prompts') return <Feather size={size} aria-hidden="true" />
  if (type === 'tracker' || type === 'dashboard') return <Table2 size={size} aria-hidden="true" />
  return <FileText size={size} aria-hidden="true" />
}

function formatEdited(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently edited'

  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  if (sameDay) return 'Edited today'

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Edited yesterday'

  return `Edited ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`
}

function CoverArt({ journal }: { journal: MobileJournal }) {
  return (
    <span className={`journal-cover ${coverClassName(journal.cover)}`} aria-hidden="true">
      <span className="journal-cover__spine" />
      <span className="journal-cover__rule journal-cover__rule--top" />
      <span className="journal-cover__ornament">✦</span>
      <span className="journal-cover__title">{journal.title}</span>
      <span className="journal-cover__rule journal-cover__rule--bottom" />
    </span>
  )
}

interface JournalLibraryProps {
  journals: MobileJournal[]
  onCreate: () => void
  onOpen: (journal: MobileJournal) => void
}

function JournalLibrary({ journals, onCreate, onOpen }: JournalLibraryProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const visibleJournals = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return journals
    return journals.filter((journal) => (
      journal.title.toLocaleLowerCase().includes(normalizedQuery)
      || journal.tags.some((tag) => tag.toLocaleLowerCase().includes(normalizedQuery))
    ))
  }, [journals, query])

  const countCopy = journals.length === 1 ? '1 volume on your shelf' : `${journals.length} volumes on your shelf`

  return (
    <section className="journals-library" aria-labelledby="journals-title">
      <header className="journals-library__header">
        <div>
          <p className="journals-eyebrow">Private shelf</p>
          <h1 id="journals-title">Journals</h1>
          <p className="journals-library__count">{countCopy}</p>
        </div>
        <div className="journals-library__actions">
          <button
            type="button"
            className={`journal-icon-button${searchOpen ? ' is-active' : ''}`}
            aria-label={searchOpen ? 'Close journal search' : 'Search journals'}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((current) => !current)
              if (searchOpen) setQuery('')
            }}
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>
          <button type="button" className="journal-icon-button journal-icon-button--primary" aria-label="Create journal" onClick={onCreate}>
            <Plus size={20} />
          </button>
        </div>
      </header>

      <div className={`journals-search${searchOpen ? ' is-open' : ''}`} aria-hidden={!searchOpen}>
        <div className="journals-search__inner">
          <Search size={17} aria-hidden="true" />
          <label className="sr-only" htmlFor="journal-search">Search by title or tag</label>
          <input
            ref={searchRef}
            id="journal-search"
            type="search"
            value={query}
            placeholder="Search by title or tag"
            tabIndex={searchOpen ? 0 : -1}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="journals-library__scroll">
        {journals.length === 0 ? (
          <div className="journals-empty">
            <div className="journals-empty__shelf" aria-hidden="true">
              <span />
              <span />
              <span />
              <i />
            </div>
            <p className="journals-eyebrow">An empty shelf</p>
            <h2>Start a book worth returning to.</h2>
            <p>Keep loose notes, daily pages, checklists, and small records together.</p>
            <button type="button" className="journal-text-button journal-text-button--primary" onClick={onCreate}>
              <BookOpenText size={18} />
              Create your first journal
            </button>
          </div>
        ) : visibleJournals.length === 0 ? (
          <div className="journals-no-results">
            <Search size={22} aria-hidden="true" />
            <h2>No journal matches “{query}”.</h2>
            <button type="button" onClick={() => setQuery('')}>Clear search</button>
          </div>
        ) : (
          <div className="journals-grid">
            {visibleJournals.map((journal, index) => (
              <article className="journal-volume" key={journal.id} style={{ '--journal-index': index } as CSSProperties}>
                <button type="button" className="journal-volume__open" onClick={() => onOpen(journal)} aria-label={`Open ${journal.title}`}>
                  <CoverArt journal={journal} />
                  <span className="journal-volume__meta">
                    <strong>{journal.title}</strong>
                    <span>{journal.folioCount === 1 ? '1 page' : `${journal.folioCount} pages`}</span>
                    <span>{formatEdited(journal.updatedAt)}</span>
                  </span>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

interface SheetFrameProps {
  titleId: string
  onClose: () => void
  children: ReactNode
  className?: string
}

function SheetFrame({ titleId, onClose, children, className = '' }: SheetFrameProps) {
  return (
    <div className="journal-sheet-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section
        className={`journal-sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
      >
        <div className="journal-sheet__handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  )
}

interface CreateJournalSheetProps {
  onClose: () => void
  onCreate: (journal: MobileJournal) => void
}

function CreateJournalSheet({ onClose, onCreate }: CreateJournalSheetProps) {
  const [title, setTitle] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [templateId, setTemplateId] = useState<JournalTemplate['id']>('blank')
  const [cover, setCover] = useState<JournalCover>('Manuscript')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => titleRef.current?.focus(), [])

  const chooseTemplate = (template: JournalTemplate) => {
    setTemplateId(template.id)
    setCover(template.cover)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return
    const tags = tagDraft
      .split(',')
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean)
    onCreate(createJournalFromTemplate({ title, tags, cover, templateId }))
  }

  return (
    <SheetFrame titleId="create-journal-title" onClose={onClose} className="journal-sheet--create">
      <form onSubmit={submit}>
        <header className="journal-sheet__header">
          <div>
            <p className="journals-eyebrow">New volume</p>
            <h2 id="create-journal-title">Make a journal</h2>
          </div>
          <button type="button" className="journal-icon-button" aria-label="Close journal creator" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        <label className="journal-field" htmlFor="new-journal-title">
          <span>Name</span>
          <input
            ref={titleRef}
            id="new-journal-title"
            value={title}
            placeholder="The book of…"
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <fieldset className="journal-fieldset">
          <legend>Begin with</legend>
          <div className="journal-template-list">
            {JOURNAL_TEMPLATES.map((template) => (
              <button
                type="button"
                key={template.id}
                className={`journal-template${templateId === template.id ? ' is-selected' : ''}`}
                aria-pressed={templateId === template.id}
                onClick={() => chooseTemplate(template)}
              >
                <span>{template.name}</span>
                <small>{template.tagline}</small>
                {templateId === template.id && <Check size={17} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="journal-fieldset">
          <legend>Cover</legend>
          <div className="journal-cover-picker">
            {JOURNAL_COVERS.map((coverName) => (
              <button
                type="button"
                key={coverName}
                className={`journal-cover-swatch ${coverClassName(coverName)}${cover === coverName ? ' is-selected' : ''}`}
                aria-label={`${coverName} cover`}
                aria-pressed={cover === coverName}
                onClick={() => setCover(coverName)}
              >
                <span aria-hidden="true">✦</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="journal-field" htmlFor="new-journal-tags">
          <span>Tags <small>optional, separated by commas</small></span>
          <input
            id="new-journal-tags"
            value={tagDraft}
            placeholder="ideas, garden, work"
            autoComplete="off"
            onChange={(event) => setTagDraft(event.target.value)}
          />
        </label>

        <div className="journal-sheet__actions">
          <button type="button" className="journal-text-button" onClick={onClose}>Keep browsing</button>
          <button type="submit" className="journal-text-button journal-text-button--primary" disabled={!title.trim()}>
            Create journal
          </button>
        </div>
      </form>
    </SheetFrame>
  )
}

interface JournalSettingsSheetProps {
  journal: MobileJournal
  onClose: () => void
  onSave: (patch: Pick<MobileJournal, 'title' | 'tags' | 'cover'>) => void
  onDelete: () => void
}

function JournalSettingsSheet({ journal, onClose, onSave, onDelete }: JournalSettingsSheetProps) {
  const [title, setTitle] = useState(journal.title)
  const [tagDraft, setTagDraft] = useState(journal.tags.join(', '))
  const [cover, setCover] = useState(journal.cover)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      cover,
      tags: tagDraft.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean),
    })
    onClose()
  }

  return (
    <SheetFrame titleId="journal-settings-title" onClose={onClose}>
      <form onSubmit={save}>
        <header className="journal-sheet__header">
          <div>
            <p className="journals-eyebrow">Volume details</p>
            <h2 id="journal-settings-title">Journal settings</h2>
          </div>
          <button type="button" className="journal-icon-button" aria-label="Close journal settings" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        <label className="journal-field" htmlFor="journal-settings-name">
          <span>Name</span>
          <input id="journal-settings-name" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label className="journal-field" htmlFor="journal-settings-tags">
          <span>Tags</span>
          <input id="journal-settings-tags" value={tagDraft} placeholder="Separate tags with commas" onChange={(event) => setTagDraft(event.target.value)} />
        </label>

        <fieldset className="journal-fieldset">
          <legend>Cover</legend>
          <div className="journal-cover-picker">
            {JOURNAL_COVERS.map((coverName) => (
              <button
                type="button"
                key={coverName}
                className={`journal-cover-swatch ${coverClassName(coverName)}${cover === coverName ? ' is-selected' : ''}`}
                aria-label={`${coverName} cover`}
                aria-pressed={cover === coverName}
                onClick={() => setCover(coverName)}
              >
                <span aria-hidden="true">✦</span>
              </button>
            ))}
          </div>
        </fieldset>

        {confirmingDelete ? (
          <div className="journal-delete-confirm" role="alert">
            <div>
              <strong>Delete “{journal.title}”?</strong>
              <span>Its {journal.folioCount === 1 ? 'page' : `${journal.folioCount} pages`} will be deleted from this device.</span>
            </div>
            <div>
              <button type="button" onClick={() => setConfirmingDelete(false)}>Keep journal</button>
              <button type="button" className="is-danger" onClick={onDelete}>Delete journal</button>
            </div>
          </div>
        ) : (
          <button type="button" className="journal-delete-trigger" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={17} />
            Delete this journal
          </button>
        )}

        <div className="journal-sheet__actions">
          <button type="button" className="journal-text-button" onClick={onClose}>Keep editing</button>
          <button type="submit" className="journal-text-button journal-text-button--primary" disabled={!title.trim()}>Save changes</button>
        </div>
      </form>
    </SheetFrame>
  )
}

interface AddPageSheetProps {
  onClose: () => void
  onAdd: (type: EditableFolioType) => void
}

function AddPageSheet({ onClose, onAdd }: AddPageSheetProps) {
  return (
    <SheetFrame titleId="add-journal-page-title" onClose={onClose}>
      <header className="journal-sheet__header">
        <div>
          <p className="journals-eyebrow">Another leaf</p>
          <h2 id="add-journal-page-title">Add a page</h2>
        </div>
        <button type="button" className="journal-icon-button" aria-label="Close page picker" onClick={onClose}>
          <X size={19} />
        </button>
      </header>
      <div className="journal-page-type-list">
        {ADDABLE_FOLIOS.map((option) => (
          <button type="button" key={option.type} onClick={() => onAdd(option.type)}>
            <span className="journal-page-type-list__icon">{folioIcon(option.type, 19)}</span>
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
    </SheetFrame>
  )
}

interface DeletePageSheetProps {
  folio: JournalFolio
  onClose: () => void
  onDelete: () => void
}

function DeletePageSheet({ folio, onClose, onDelete }: DeletePageSheetProps) {
  return (
    <SheetFrame titleId="delete-journal-page-title" onClose={onClose}>
      <div className="journal-sheet__compact">
        <span className="journal-sheet__danger-icon"><Trash2 size={20} /></span>
        <p className="journals-eyebrow">Delete page</p>
        <h2 id="delete-journal-page-title">Delete “{folio.title}”?</h2>
        <p>This page and everything written on it will be deleted from this device.</p>
        <div className="journal-sheet__actions">
          <button type="button" className="journal-text-button" onClick={onClose}>Keep page</button>
          <button type="button" className="journal-text-button journal-text-button--danger" onClick={onDelete}>Delete page</button>
        </div>
      </div>
    </SheetFrame>
  )
}

interface FolioEditorProps {
  folio: JournalFolio
  onChange: (content: JournalFolioContent) => void
}

function NotesEditor({ folio, onChange }: FolioEditorProps) {
  return (
    <textarea
      className="journal-notes-editor"
      value={folio.content.body ?? ''}
      aria-label={`${folio.title} notes`}
      placeholder="Put the first line down…"
      spellCheck="true"
      onChange={(event) => onChange({ ...folio.content, body: event.target.value })}
    />
  )
}

function TodoEditor({ folio, onChange }: FolioEditorProps) {
  const [draft, setDraft] = useState('')
  const items = folio.content.items ?? []

  const setItems = (nextItems: JournalTodoItem[]) => onChange({ ...folio.content, items: nextItems })
  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setItems([...items, { id: makeJournalId('item'), text, done: false }])
    setDraft('')
  }

  return (
    <div className="journal-todo-editor">
      <div className="journal-todo-list">
        {items.map((item) => (
          <div className={`journal-todo${item.done ? ' is-done' : ''}`} key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                aria-label={`Mark ${item.text || 'item'} ${item.done ? 'not done' : 'done'}`}
                onChange={() => setItems(items.map((candidate) => candidate.id === item.id ? { ...candidate, done: !candidate.done } : candidate))}
              />
              <span><Check size={14} /></span>
            </label>
            <input
              type="text"
              value={item.text}
              aria-label="Checklist item"
              onChange={(event) => setItems(items.map((candidate) => candidate.id === item.id ? { ...candidate, text: event.target.value } : candidate))}
            />
            <button type="button" aria-label={`Delete ${item.text || 'checklist item'}`} onClick={() => setItems(items.filter((candidate) => candidate.id !== item.id))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <form className="journal-inline-add" onSubmit={addItem}>
        <Plus size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor={`todo-draft-${folio.id}`}>New checklist item</label>
        <input id={`todo-draft-${folio.id}`} value={draft} placeholder="Add something to do" onChange={(event) => setDraft(event.target.value)} />
        <button type="submit" disabled={!draft.trim()}>Add</button>
      </form>
    </div>
  )
}

function PromptsEditor({ folio, onChange }: FolioEditorProps) {
  const prompts = folio.content.prompts ?? []
  const answers = folio.content.answers ?? {}

  const updatePrompts = (nextPrompts: string[]) => onChange({ ...folio.content, prompts: nextPrompts })

  return (
    <div className="journal-prompts-editor">
      <textarea
        className="journal-prompts-editor__intro"
        value={folio.content.intro ?? ''}
        aria-label="Prompt page introduction"
        placeholder="A note before the questions…"
        onChange={(event) => onChange({ ...folio.content, intro: event.target.value })}
      />
      <ol>
        {prompts.map((prompt, index) => (
          <li key={`${folio.id}-${index}`}>
            <div className="journal-prompt-question">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <input
                value={prompt}
                aria-label={`Prompt ${index + 1}`}
                onChange={(event) => updatePrompts(prompts.map((candidate, promptIndex) => promptIndex === index ? event.target.value : candidate))}
              />
              <button
                type="button"
                aria-label={`Delete prompt ${index + 1}`}
                onClick={() => updatePrompts(prompts.filter((_, promptIndex) => promptIndex !== index))}
              >
                <X size={15} />
              </button>
            </div>
            <textarea
              value={answers[String(index)] ?? ''}
              aria-label={`Answer to prompt ${index + 1}`}
              placeholder="Write without editing yourself…"
              onChange={(event) => onChange({
                ...folio.content,
                answers: { ...answers, [String(index)]: event.target.value },
              })}
            />
          </li>
        ))}
      </ol>
      <button type="button" className="journal-add-prompt" onClick={() => updatePrompts([...prompts, 'A new question'])}>
        <Plus size={17} />
        Add a prompt
      </button>
    </div>
  )
}

function TrackerEditor({ folio, onChange }: FolioEditorProps) {
  const columns = folio.content.columns?.length ? folio.content.columns : ['Item', 'Status']
  const rows = folio.content.rows ?? []

  const setRows = (nextRows: string[][]) => onChange({ ...folio.content, columns, rows: nextRows })
  const setColumns = (nextColumns: string[]) => onChange({ ...folio.content, columns: nextColumns, rows })

  return (
    <div className="journal-tracker-editor">
      <div className="journal-tracker-editor__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column, columnIndex) => (
                <th key={`${folio.id}-column-${columnIndex}`}>
                  <input
                    value={column}
                    aria-label={`Column ${columnIndex + 1}`}
                    onChange={(event) => setColumns(columns.map((candidate, index) => index === columnIndex ? event.target.value : candidate))}
                  />
                </th>
              ))}
              <th aria-label="Row actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${folio.id}-row-${rowIndex}`}>
                {columns.map((_, columnIndex) => (
                  <td key={`${folio.id}-cell-${rowIndex}-${columnIndex}`}>
                    <input
                      value={row[columnIndex] ?? ''}
                      aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`}
                      onChange={(event) => setRows(rows.map((candidate, candidateIndex) => {
                        if (candidateIndex !== rowIndex) return candidate
                        const nextRow = [...candidate]
                        nextRow[columnIndex] = event.target.value
                        return nextRow
                      }))}
                    />
                  </td>
                ))}
                <td>
                  <button type="button" aria-label={`Delete row ${rowIndex + 1}`} onClick={() => setRows(rows.filter((_, index) => index !== rowIndex))}>
                    <X size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="journal-add-row" onClick={() => setRows([...rows, columns.map(() => '')])}>
        <Plus size={17} />
        Add a row
      </button>
    </div>
  )
}

function DashboardPage({ folio }: { folio: JournalFolio }) {
  return (
    <div className="journal-dashboard-page">
      {(folio.content.widgets ?? []).map((widget, index) => (
        <div key={`${widget.label}-${index}`}>
          <span>{widget.label}</span>
          <strong>{widget.value}</strong>
          {widget.target !== undefined && <small>of {widget.target}</small>}
          {widget.hint && <small>{widget.hint}</small>}
        </div>
      ))}
      {folio.content.note && <p>{folio.content.note}</p>}
    </div>
  )
}

function FolioEditor(props: FolioEditorProps) {
  if (props.folio.type === 'todo') return <TodoEditor {...props} />
  if (props.folio.type === 'prompts') return <PromptsEditor {...props} />
  if (props.folio.type === 'tracker') return <TrackerEditor {...props} />
  if (props.folio.type === 'dashboard') return <DashboardPage folio={props.folio} />
  return <NotesEditor {...props} />
}

interface JournalReaderProps {
  journal: MobileJournal
  activeFolioId: string | null
  storageState: 'saved' | 'error'
  onBack: () => void
  onSelectFolio: (folioId: string) => void
  onUpdateJournal: (patch: Partial<Pick<MobileJournal, 'title' | 'tags' | 'cover'>>) => void
  onUpdateFolio: (folioId: string, patch: Partial<Pick<JournalFolio, 'title' | 'content'>>) => void
  onAddFolio: (type: EditableFolioType) => void
  onDeleteFolio: (folioId: string) => void
  onDeleteJournal: () => void
}

function JournalReader({
  journal,
  activeFolioId,
  storageState,
  onBack,
  onSelectFolio,
  onUpdateJournal,
  onUpdateFolio,
  onAddFolio,
  onDeleteFolio,
  onDeleteJournal,
}: JournalReaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addPageOpen, setAddPageOpen] = useState(false)
  const [deletePage, setDeletePage] = useState<JournalFolio | null>(null)

  const activeIndex = Math.max(0, journal.folios.findIndex((folio) => folio.id === activeFolioId))
  const activeFolio = journal.folios[activeIndex]
  const previousFolio = activeIndex > 0 ? journal.folios[activeIndex - 1] : undefined
  const nextFolio = activeIndex < journal.folios.length - 1 ? journal.folios[activeIndex + 1] : undefined

  return (
    <section className={`journal-reader ${coverClassName(journal.cover)}`} aria-label={`${journal.title} journal`}>
      <div className="journal-reader__ambient" aria-hidden="true" />
      <header className="journal-reader__header">
        <button type="button" className="journal-icon-button journal-icon-button--on-dark" aria-label="Back to journals" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="journal-reader__identity">
          <span>Journals</span>
          <strong>{journal.title}</strong>
        </div>
        <button type="button" className="journal-icon-button journal-icon-button--on-dark" aria-label="Journal settings" onClick={() => setSettingsOpen(true)}>
          <Ellipsis size={21} />
        </button>
      </header>

      <div className="journal-reader__stage">
        {activeFolio ? (
          <article className={`journal-paper journal-paper--${journal.page.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={activeFolio.id}>
            <header className="journal-paper__header">
              <span className="journal-paper__kind">
                {folioIcon(activeFolio.type)}
                {FOLIO_LABELS[activeFolio.type]}
              </span>
              <span className="journal-paper__number">{activeIndex + 1} / {journal.folios.length}</span>
              <button type="button" aria-label={`Delete ${activeFolio.title}`} onClick={() => setDeletePage(activeFolio)}>
                <Trash2 size={16} />
              </button>
            </header>
            <input
              className="journal-paper__title"
              value={activeFolio.title}
              aria-label="Page title"
              onChange={(event) => onUpdateFolio(activeFolio.id, { title: event.target.value })}
            />
            <div className="journal-paper__content">
              <FolioEditor
                key={activeFolio.id}
                folio={activeFolio}
                onChange={(content) => onUpdateFolio(activeFolio.id, { content })}
              />
            </div>
            <footer className="journal-paper__footer">
              <button
                type="button"
                disabled={!previousFolio}
                aria-label="Previous page"
                onClick={() => previousFolio && onSelectFolio(previousFolio.id)}
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <span aria-hidden="true">✦</span>
              <button
                type="button"
                disabled={!nextFolio}
                aria-label="Next page"
                onClick={() => nextFolio && onSelectFolio(nextFolio.id)}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </footer>
          </article>
        ) : (
          <div className="journal-paper journal-paper--empty">
            <BookOpenText size={30} aria-hidden="true" />
            <h2>This journal needs its first page.</h2>
            <p>Choose the kind of page that fits what you want to keep.</p>
            <button type="button" className="journal-text-button journal-text-button--ink" onClick={() => setAddPageOpen(true)}>
              <Plus size={18} />
              Add a page
            </button>
          </div>
        )}

        <div className="journal-page-rail" aria-label="Journal pages">
          <div className="journal-page-rail__scroll">
            {journal.folios.map((folio, index) => (
              <button
                type="button"
                key={folio.id}
                className={folio.id === activeFolio?.id ? 'is-active' : ''}
                aria-current={folio.id === activeFolio?.id ? 'page' : undefined}
                onClick={() => onSelectFolio(folio.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{folio.title || FOLIO_LABELS[folio.type]}</strong>
              </button>
            ))}
          </div>
          <button type="button" className="journal-page-rail__add" aria-label="Add journal page" onClick={() => setAddPageOpen(true)}>
            <Plus size={19} />
          </button>
        </div>
      </div>

      <footer
        className={`journal-reader__save-state${storageState === 'error' ? ' is-error' : ''}`}
        role="status"
        aria-live="polite"
      >
        <LockKeyhole size={13} aria-hidden="true" />
        {storageState === 'saved' ? 'Saved on this device' : 'Could not save on this device'}
      </footer>

      {settingsOpen && (
        <JournalSettingsSheet
          journal={journal}
          onClose={() => setSettingsOpen(false)}
          onSave={onUpdateJournal}
          onDelete={onDeleteJournal}
        />
      )}
      {addPageOpen && (
        <AddPageSheet
          onClose={() => setAddPageOpen(false)}
          onAdd={(type) => {
            onAddFolio(type)
            setAddPageOpen(false)
          }}
        />
      )}
      {deletePage && (
        <DeletePageSheet
          folio={deletePage}
          onClose={() => setDeletePage(null)}
          onDelete={() => {
            onDeleteFolio(deletePage.id)
            setDeletePage(null)
          }}
        />
      )}
    </section>
  )
}

export default function JournalsView() {
  const [journals, setJournals] = useState<MobileJournal[]>(loadMobileJournals)
  const [openJournalId, setOpenJournalId] = useState<string | null>(null)
  const [activeFolioId, setActiveFolioId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [storageState, setStorageState] = useState<'saved' | 'error'>('saved')

  const openJournal = journals.find((journal) => journal.id === openJournalId)

  useEffect(() => {
    setStorageState(saveMobileJournals(journals) ? 'saved' : 'error')
  }, [journals])

  const open = (journal: MobileJournal) => {
    setOpenJournalId(journal.id)
    setActiveFolioId(journal.folios[0]?.id ?? null)
  }

  const updateJournal = (journalId: string, patch: Partial<Pick<MobileJournal, 'title' | 'tags' | 'cover'>>) => {
    const updatedAt = new Date().toISOString()
    setJournals((current) => current.map((journal) => (
      journal.id === journalId ? { ...journal, ...patch, updatedAt } : journal
    )))
  }

  const updateFolio = (journalId: string, folioId: string, patch: Partial<Pick<JournalFolio, 'title' | 'content'>>) => {
    const updatedAt = new Date().toISOString()
    setJournals((current) => current.map((journal) => {
      if (journal.id !== journalId) return journal
      return {
        ...journal,
        updatedAt,
        folios: journal.folios.map((folio) => folio.id === folioId ? { ...folio, ...patch, updatedAt } : folio),
      }
    }))
  }

  const addFolio = (journal: MobileJournal, type: EditableFolioType) => {
    const folio = createBlankFolio(journal.id, type, journal.folios.length)
    setJournals((current) => current.map((candidate) => candidate.id === journal.id ? {
      ...candidate,
      folios: [...candidate.folios, folio],
      folioCount: candidate.folios.length + 1,
      updatedAt: folio.updatedAt,
    } : candidate))
    setActiveFolioId(folio.id)
  }

  const deleteFolio = (journal: MobileJournal, folioId: string) => {
    const targetIndex = journal.folios.findIndex((folio) => folio.id === folioId)
    const nextActive = journal.folios[targetIndex + 1] ?? journal.folios[targetIndex - 1]
    const updatedAt = new Date().toISOString()
    setJournals((current) => current.map((candidate) => {
      if (candidate.id !== journal.id) return candidate
      const folios = candidate.folios
        .filter((folio) => folio.id !== folioId)
        .map((folio, position) => ({ ...folio, position }))
      return { ...candidate, folios, folioCount: folios.length, updatedAt }
    }))
    setActiveFolioId(nextActive?.id ?? null)
  }

  const deleteJournal = (journalId: string) => {
    setJournals((current) => current.filter((journal) => journal.id !== journalId))
    setOpenJournalId(null)
    setActiveFolioId(null)
  }

  return (
    <div className="mobile-journals">
      {openJournal ? (
        <JournalReader
          journal={openJournal}
          activeFolioId={activeFolioId}
          storageState={storageState}
          onBack={() => {
            setOpenJournalId(null)
            setActiveFolioId(null)
          }}
          onSelectFolio={setActiveFolioId}
          onUpdateJournal={(patch) => updateJournal(openJournal.id, patch)}
          onUpdateFolio={(folioId, patch) => updateFolio(openJournal.id, folioId, patch)}
          onAddFolio={(type) => addFolio(openJournal, type)}
          onDeleteFolio={(folioId) => deleteFolio(openJournal, folioId)}
          onDeleteJournal={() => deleteJournal(openJournal.id)}
        />
      ) : (
        <JournalLibrary journals={journals} onCreate={() => setCreating(true)} onOpen={open} />
      )}

      {creating && (
        <CreateJournalSheet
          onClose={() => setCreating(false)}
          onCreate={(journal) => {
            setJournals((current) => [journal, ...current])
            setCreating(false)
            open(journal)
          }}
        />
      )}
    </div>
  )
}
