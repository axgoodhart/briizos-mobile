import { useRef, useState } from 'react'
import { ChevronLeft, FileUp, X } from 'lucide-react'
import { COVER_NAMES, DEFAULT_COVER, DEFAULT_PAGE, coverUrl } from '../../features/journals/assets'
import {
  IMPORT_TARGETS,
  TEXT_FILE_ACCEPT,
  buildFolios,
  previewImport,
  readTextFiles,
  type ImportDoc,
  type ImportTarget,
} from '../../features/journals/importText'
import { createJournal, logActivity } from '../../features/journals/store'
import { TEMPLATES, TEMPLATE_BY_ID } from '../../features/journals/templates'
import type { Journal } from '../../features/journals/types'
import { Sheet } from './Sheet'
import { CoverPicker, PagePicker, TagEditor } from './Pickers'

interface CreateJournalSheetProps {
  initialDocs?: ImportDoc[]
  initialSkipped?: { name: string; reason: string }[]
  onCreated: (journal: Journal) => void
  onClose: () => void
}

export function CreateJournalSheet({ initialDocs = [], initialSkipped = [], onCreated, onClose }: CreateJournalSheetProps) {
  const [step, setStep] = useState<'start' | 'details'>(initialDocs.length ? 'details' : 'start')
  const [templateId, setTemplateId] = useState<string>('blank')
  const [title, setTitle] = useState(() => (initialDocs.length === 1 ? initialDocs[0].title : ''))
  const [tags, setTags] = useState<string[]>([])
  const [cover, setCover] = useState(DEFAULT_COVER)
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [docs, setDocs] = useState<ImportDoc[]>(initialDocs)
  const [targets, setTargets] = useState<Record<string, ImportTarget>>({})
  const [skipped, setSkipped] = useState(initialSkipped)
  const [reading, setReading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const chooseTemplate = (id: string) => {
    const template = TEMPLATE_BY_ID[id]
    setTemplateId(id)
    if (template?.cover) setCover(template.cover)
    if (template?.page) setPage(template.page)
    setTags((current) => [...new Set([...(template?.tags ?? []), ...current])])
    setStep('details')
  }

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setReading(true)
    const result = await readTextFiles(files)
    setReading(false)
    setDocs((current) => [...current, ...result.docs.filter((doc) => !current.some((existing) => existing.id === doc.id))])
    setSkipped(result.skipped)
    if (result.skipped.length) {
      logActivity('warn', 'import', `${result.skipped.length} file${result.skipped.length === 1 ? ' was' : 's were'} left out of the import.`, {
        files: result.skipped.map((file) => `${file.name} (${file.reason})`),
      })
    }
    if (!title && result.docs.length === 1) setTitle(result.docs[0].title)
    setTemplateId('blank')
    setStep('details')
    if (fileInput.current) fileInput.current.value = ''
  }

  const create = () => {
    const template = TEMPLATE_BY_ID[templateId] ?? TEMPLATE_BY_ID.blank
    const imported = buildFolios(docs, targets)
    // An import replaces the blank page; a real template keeps its pages first.
    const templatePages = docs.length && templateId === 'blank' ? [] : template.folios
    const journal = createJournal({
      title,
      tags,
      cover,
      page,
      folios: [...templatePages, ...imported],
      source: docs.length ? `${docs.length} imported text file${docs.length === 1 ? '' : 's'}` : `template: ${template.name}`,
    })
    onCreated(journal)
  }

  const fileInputElement = (
    <input ref={fileInput} type="file" accept={TEXT_FILE_ACCEPT} multiple hidden onChange={(event) => void addFiles(event.target.files)} />
  )

  if (step === 'start') {
    return (
      <Sheet title="New Journal" subtitle="Create something meaningful." onClose={onClose} tall>
        {fileInputElement}
        <div className="jx-template-grid">
          {TEMPLATES.map((template) => {
            const art = coverUrl(template.cover ?? DEFAULT_COVER)
            return (
              <button key={template.id} type="button" className="jx-template" onClick={() => chooseTemplate(template.id)}>
                {art && <img src={art} alt="" className="jx-template__cover" loading="lazy" />}
                <span className="jx-template__name">{template.name}</span>
                <span className="jx-template__tagline">{template.tagline}</span>
                <span className="jx-template__count">{template.folios.length} page{template.folios.length === 1 ? '' : 's'}</span>
              </button>
            )
          })}
          <button type="button" className="jx-template jx-template--import" onClick={() => fileInput.current?.click()} disabled={reading}>
            <FileUp size={30} aria-hidden="true" />
            <span className="jx-template__name">{reading ? 'Reading files…' : 'From text files'}</span>
            <span className="jx-template__tagline">Each file becomes a page: prose becomes notes, lists become checklists.</span>
          </button>
        </div>
      </Sheet>
    )
  }

  const template = TEMPLATE_BY_ID[templateId]

  return (
    <Sheet
      title="New Journal"
      subtitle={docs.length ? `${docs.length} file${docs.length === 1 ? '' : 's'} to bring in` : template ? `Starting from ${template.name}` : undefined}
      onClose={onClose}
      tall
      footer={
        <>
          {!initialDocs.length && (
            <button type="button" className="jx-button" onClick={() => setStep('start')}>
              <ChevronLeft size={16} aria-hidden="true" /> Templates
            </button>
          )}
          <button type="button" className="jx-button jx-button--primary" disabled={!title.trim()} onClick={create}>
            Create journal
          </button>
        </>
      }
    >
      {fileInputElement}
      <form
        className="jx-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (title.trim()) create()
        }}
      >
        <label className="jx-field">
          <span className="jx-field__label">Title</span>
          <input className="jx-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name your journal" enterKeyHint="done" />
        </label>
        <TagEditor tags={tags} onChange={setTags} />
      </form>

      <CoverPicker value={cover} onChange={setCover} names={COVER_NAMES} />
      <PagePicker value={page} onChange={setPage} />

      <section className="jx-field" aria-label="Text files">
        <span className="jx-field__label">Text files</span>
        {docs.length === 0 && <p className="jx-fineprint">Optional: bring in .txt or .md files as pages.</p>}
        <ul className="jx-import-list">
          {docs.map((doc) => {
            const target = targets[doc.id] ?? 'auto'
            const preview = previewImport(doc, target)
            return (
              <li key={doc.id} className="jx-import">
                <div className="jx-import__head">
                  <span className="jx-import__name">{doc.title}</span>
                  <button type="button" className="jx-x" aria-label={`Leave out ${doc.name}`} onClick={() => setDocs((current) => current.filter((existing) => existing.id !== doc.id))}>
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="jx-choice-row" role="group" aria-label={`How to bring in ${doc.name}`}>
                  {IMPORT_TARGETS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`jx-choice${target === option.id ? ' is-active' : ''}`}
                      aria-pressed={target === option.id}
                      onClick={() => setTargets((current) => ({ ...current, [doc.id]: option.id }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="jx-fineprint">
                  Becomes a {preview.type === 'todo' ? 'checklist' : 'notes page'} · {preview.label}
                  {preview.reason ? ` · ${preview.reason}` : ''}
                </p>
              </li>
            )
          })}
        </ul>
        {skipped.length > 0 && (
          <p className="jx-notice" role="status">
            Left out: {skipped.map((file) => `${file.name} (${file.reason})`).join(', ')}
          </p>
        )}
        <button type="button" className="jx-button jx-button--wide" onClick={() => fileInput.current?.click()} disabled={reading}>
          <FileUp size={16} aria-hidden="true" /> {reading ? 'Reading files…' : docs.length ? 'Add more files' : 'Choose text files'}
        </button>
      </section>
    </Sheet>
  )
}
