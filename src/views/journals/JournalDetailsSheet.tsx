import { useState } from 'react'
import { BookOpen, Trash2 } from 'lucide-react'
import { COVER_NAMES } from '../../features/journals/assets'
import { trashJournal, updateJournal } from '../../features/journals/store'
import type { Journal } from '../../features/journals/types'
import { Confirm, Sheet } from './Sheet'
import { CoverPicker, PagePicker, TagEditor } from './Pickers'

interface JournalDetailsSheetProps {
  journal: Journal
  onOpen?: () => void
  onTrashed: () => void
  onClose: () => void
}

/* A journal's title, tags, cover and page style; also opens it or moves
   it to Trash. Reached from a spine's "…" button and from inside a journal. */
export function JournalDetailsSheet({ journal, onOpen, onTrashed, onClose }: JournalDetailsSheetProps) {
  const [title, setTitle] = useState(journal.title)
  const [tags, setTags] = useState(journal.tags)
  const [cover, setCover] = useState(journal.cover)
  const [page, setPage] = useState(journal.page)
  const [confirming, setConfirming] = useState(false)

  const changed = title.trim() !== journal.title
    || cover !== journal.cover
    || page !== journal.page
    || tags.join('\u0000') !== journal.tags.join('\u0000')

  const save = () => {
    if (changed && title.trim()) {
      const parts = [
        title.trim() !== journal.title ? 'title' : null,
        tags.join() !== journal.tags.join() ? 'tags' : null,
        cover !== journal.cover ? 'cover' : null,
        page !== journal.page ? 'page style' : null,
      ].filter(Boolean)
      updateJournal(journal.id, { title: title.trim(), tags, cover, page }, `Changed the ${parts.join(', ')} of “${title.trim()}”.`)
    }
    onClose()
  }

  return (
    <>
      <Sheet
        title={journal.title}
        subtitle="Journal details"
        onClose={save}
        tall
        footer={
          <>
            {onOpen && (
              <button type="button" className="jx-button" onClick={() => { save(); onOpen() }}>
                <BookOpen size={16} aria-hidden="true" /> Open
              </button>
            )}
            <button type="button" className="jx-button jx-button--primary" disabled={!title.trim()} onClick={save}>
              {changed ? 'Save' : 'Done'}
            </button>
          </>
        }
      >
        <form
          className="jx-form"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <label className="jx-field">
            <span className="jx-field__label">Title</span>
            <input className="jx-input" value={title} onChange={(event) => setTitle(event.target.value)} enterKeyHint="done" />
          </label>
          <TagEditor tags={tags} onChange={setTags} />
        </form>
        <CoverPicker value={cover} onChange={setCover} names={COVER_NAMES} />
        <PagePicker value={page} onChange={setPage} />
        <button type="button" className="jx-setting jx-setting--danger" onClick={() => setConfirming(true)}>
          <Trash2 size={18} aria-hidden="true" />
          <span className="jx-setting__text">
            <span className="jx-setting__label">Move to Trash</span>
            <span className="jx-setting__hint">The journal and its pages can be restored from Settings → Trash</span>
          </span>
        </button>
      </Sheet>
      {confirming && (
        <Confirm
          title={`Move “${journal.title}” to Trash?`}
          message="You can restore it, with every page, from Settings → Trash."
          confirmLabel="Move to Trash"
          onConfirm={() => {
            trashJournal(journal.id)
            setConfirming(false)
            onTrashed()
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
