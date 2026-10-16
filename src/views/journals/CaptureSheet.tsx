import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ImagePlus, Mic, Square, X } from 'lucide-react'
import { dictationAvailable, startDictation, storePhoto, type DictationSession } from '../../features/journals/media'
import {
  addFolio,
  createJournal,
  discardImage,
  journalFolios,
  logActivity,
  resolveImageSrc,
  updateFolio,
} from '../../features/journals/store'
import { notesDoc } from '../../features/journals/text'
import type { Folio, Journal, RichNode } from '../../features/journals/types'
import type { CaptureMode } from './ShelfScreen'
import { Sheet } from './Sheet'

interface CaptureSheetProps {
  mode: CaptureMode
  journals: Journal[]
  folios: Folio[]
  initialPhotos?: string[]
  onSaved: (journalId: string, folioId: string, summary: string) => void
  onClose: () => void
}

const NEW_JOURNAL = '__new__'

function stampTitle(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

function PhotoThumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void resolveImageSrc(src).then((resolved) => alive && setUrl(resolved))
    return () => {
      alive = false
    }
  }, [src])
  return (
    <span className="jx-capture__photo">
      {url ? <img src={url} alt="" /> : <span className="jx-capture__photo-wait" />}
      <button type="button" aria-label="Remove this photo" onClick={onRemove}>
        <X size={13} aria-hidden="true" />
      </button>
    </span>
  )
}

/* The pen, microphone and camera buttons on the shelf all open this:
   write, speak or photograph something, then drop it into a journal,
   either as a new page or at the end of that journal's latest notes page. */
export function CaptureSheet({ mode, journals, folios, initialPhotos = [], onSaved, onClose }: CaptureSheetProps) {
  const ordered = useMemo(
    () => [...journals].sort((a, b) => (b.openedAt ?? b.updatedAt) - (a.openedAt ?? a.updatedAt)),
    [journals],
  )
  const [journalId, setJournalId] = useState(ordered[0]?.id ?? NEW_JOURNAL)
  const [placement, setPlacement] = useState<'new' | 'append'>('new')
  const [text, setText] = useState('')
  const [draftSpeech, setDraftSpeech] = useState('')
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [listening, setListening] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const session = useRef<DictationSession | null>(null)
  const textArea = useRef<HTMLTextAreaElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  const saved = useRef(false)
  const photosRef = useRef(photos)

  useEffect(() => {
    photosRef.current = photos
  })

  const lastNotes = useMemo(() => {
    if (journalId === NEW_JOURNAL) return null
    return [...journalFolios(journalId, folios)].reverse().find((folio) => folio.type === 'notes') ?? null
  }, [folios, journalId])

  const listen = () => {
    setProblem(null)
    const started = startDictation({
      onText: (phrase) => setText((current) => `${current}${current && !/\s$/.test(current) ? ' ' : ''}${phrase.trim()}`),
      onDraft: setDraftSpeech,
      onEnd: (reason) => {
        setListening(false)
        session.current = null
        if (reason) setProblem(reason)
      },
    })
    if (started) {
      session.current = started
      setListening(true)
    }
  }

  const stopListening = () => session.current?.stop()

  useEffect(() => {
    if (mode === 'speak') listen()
    else if (mode === 'write') textArea.current?.focus()
    return () => {
      session.current?.stop()
      // Photos taken for a capture that was never saved are cleaned up.
      if (!saved.current) photosRef.current.forEach(discardImage)
    }
    // Runs once when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setProblem(null)
    for (const file of Array.from(files)) {
      try {
        const src = await storePhoto(file)
        setPhotos((current) => [...current, src])
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'A photo could not be added.')
      }
    }
    setBusy(false)
    if (cameraInput.current) cameraInput.current.value = ''
    if (libraryInput.current) libraryInput.current.value = ''
  }

  const removePhoto = (src: string) => {
    setPhotos((current) => current.filter((existing) => existing !== src))
    discardImage(src)
  }

  const words = text.trim()
  const canSave = !busy && (words.length > 0 || photos.length > 0)

  const save = () => {
    if (!canSave) return
    session.current?.stop()
    const nodes: RichNode[] = [
      ...words.split(/\n+/).map((line) => line.trim()).filter(Boolean)
        .map((line): RichNode => ({ type: 'paragraph', content: [{ type: 'text', text: line }] })),
      ...photos.flatMap((src): RichNode[] => [{ type: 'journalImage', attrs: { src, alt: '' } }, { type: 'paragraph' }]),
    ]

    let targetJournalId = journalId
    let journalTitle = journals.find((journal) => journal.id === journalId)?.title ?? ''
    if (journalId === NEW_JOURNAL) {
      const created = createJournal({ title: 'Quick Notes', tags: [], folios: [], source: 'quick capture' })
      targetJournalId = created.id
      journalTitle = created.title
    }

    let folioId: string
    if (placement === 'append' && lastNotes && journalId !== NEW_JOURNAL) {
      const doc = notesDoc(lastNotes)
      const content = { ...lastNotes.content, doc: { ...doc, content: [...(doc.content ?? []), ...nodes] } }
      delete content.body
      updateFolio(lastNotes.id, { content }, { quiet: true })
      folioId = lastNotes.id
    } else {
      // A brand-new "Quick Notes" journal already has an empty first page; write on it.
      const existing = journalId === NEW_JOURNAL ? journalFolios(targetJournalId)[0] : null
      const page = existing ?? addFolio(targetJournalId, { type: 'notes', title: stampTitle(), content: {} })
      if (!page) return
      if (existing) updateFolio(existing.id, { title: stampTitle() }, { quiet: true })
      updateFolio(page.id, { content: { ...page.content, doc: { type: 'doc', content: nodes } } }, { quiet: true })
      folioId = page.id
    }

    saved.current = true
    const what = [
      words ? `${words.split(/\s+/).length} words` : null,
      photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'}` : null,
    ].filter(Boolean).join(' and ')
    const where = placement === 'append' && lastNotes && journalId !== NEW_JOURNAL ? `the end of “${lastNotes.title}”` : 'a new page'
    logActivity('info', 'capture', `Saved ${what} from the ${mode === 'speak' ? 'microphone' : mode === 'photo' ? 'camera' : 'pen'} to ${where} in “${journalTitle}”.`)
    onSaved(targetJournalId, folioId, `Saved to ${journalTitle}`)
  }

  const title = mode === 'speak' ? 'Speak an entry' : mode === 'photo' ? 'Add a photo' : 'Write a quick entry'

  return (
    <Sheet
      title={title}
      onClose={onClose}
      tall
      footer={<button type="button" className="jx-button jx-button--primary" disabled={!canSave} onClick={save}>Save</button>}
    >
      <label className="jx-field">
        <span className="jx-field__label">Journal</span>
        <select className="jx-input" value={journalId} onChange={(event) => setJournalId(event.target.value)}>
          {ordered.map((journal) => (
            <option key={journal.id} value={journal.id}>{journal.title}</option>
          ))}
          <option value={NEW_JOURNAL}>A new journal called “Quick Notes”</option>
        </select>
      </label>

      {journalId !== NEW_JOURNAL && (
        <div className="jx-segment" role="group" aria-label="Where it goes">
          <button type="button" className={placement === 'new' ? 'is-active' : ''} aria-pressed={placement === 'new'} onClick={() => setPlacement('new')}>
            New page
          </button>
          <button
            type="button"
            className={placement === 'append' ? 'is-active' : ''}
            aria-pressed={placement === 'append'}
            disabled={!lastNotes}
            onClick={() => setPlacement('append')}
          >
            {lastNotes ? `End of “${lastNotes.title}”` : 'No notes page yet'}
          </button>
        </div>
      )}

      <div className="jx-capture__write">
        <textarea
          ref={textArea}
          className="jx-input jx-capture__text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={mode === 'photo' ? 'Add a caption or a thought (optional)' : 'What’s on your mind?'}
          aria-label="Your entry"
          rows={5}
        />
        {draftSpeech && <p className="jx-capture__draft" aria-live="polite">{draftSpeech}…</p>}
      </div>

      {photos.length > 0 && (
        <div className="jx-capture__photos">
          {photos.map((src) => <PhotoThumb key={src} src={src} onRemove={() => removePhoto(src)} />)}
        </div>
      )}

      <div className="jx-capture__tools">
        {listening ? (
          <button type="button" className="jx-button jx-button--listening" onClick={stopListening}>
            <Square size={14} aria-hidden="true" /> Stop listening
          </button>
        ) : (
          <button type="button" className="jx-button" onClick={listen} disabled={!dictationAvailable()}>
            <Mic size={16} aria-hidden="true" /> {dictationAvailable() ? 'Dictate' : 'Dictation unavailable'}
          </button>
        )}
        <button type="button" className="jx-button" onClick={() => cameraInput.current?.click()} disabled={busy}>
          <Camera size={16} aria-hidden="true" /> Camera
        </button>
        <button type="button" className="jx-button" onClick={() => libraryInput.current?.click()} disabled={busy}>
          <ImagePlus size={16} aria-hidden="true" /> Library
        </button>
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(event) => void addPhotos(event.target.files)} />
        <input ref={libraryInput} type="file" accept="image/*" multiple hidden onChange={(event) => void addPhotos(event.target.files)} />
      </div>

      {busy && <p className="jx-notice" role="status">Preparing photo…</p>}
      {problem && <p className="jx-notice jx-notice--problem" role="alert">{problem}</p>}
      {!dictationAvailable() && (
        <p className="jx-fineprint">This browser can’t take dictation here; the microphone key on your keyboard still can.</p>
      )}
    </Sheet>
  )
}
