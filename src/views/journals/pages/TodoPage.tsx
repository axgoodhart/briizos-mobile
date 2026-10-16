import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type { Folio, FolioContent, TodoItem } from '../../../features/journals/types'

interface PageProps {
  folio: Folio
  onSave: (content: FolioContent) => void
}

export function TodoPage({ folio, onSave }: PageProps) {
  const items = folio.content.items ?? []
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const save = (next: TodoItem[]) => onSave({ ...folio.content, items: next })

  const add = () => {
    const text = draft.trim()
    if (!text) return
    save([...items, { text, done: false }])
    setDraft('')
  }

  const commitEdit = () => {
    if (editing === null) return
    const text = editDraft.trim()
    const index = editing
    setEditing(null)
    if (text && text !== items[index]?.text) save(items.map((item, i) => (i === index ? { ...item, text } : item)))
  }

  const done = items.filter((item) => item.done).length

  return (
    <div className="jx-todo">
      {items.length > 0 && (
        <p className="jx-page__count" aria-live="polite">{done} of {items.length} done</p>
      )}
      <ul className="jx-todo__list">
        {items.map((item, index) => (
          <li key={index} className={`jx-todo__item${item.done ? ' is-done' : ''}`}>
            <button
              type="button"
              className="jx-check"
              role="checkbox"
              aria-checked={item.done}
              aria-label={item.text}
              onClick={() => save(items.map((candidate, i) => (i === index ? { ...candidate, done: !candidate.done } : candidate)))}
            >
              {item.done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
            </button>
            {editing === index ? (
              <input
                className="jx-todo__edit"
                value={editDraft}
                autoFocus
                aria-label="Edit item"
                enterKeyHint="done"
                onChange={(event) => setEditDraft(event.target.value)}
                onBlur={commitEdit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitEdit()
                  if (event.key === 'Escape') setEditing(null)
                }}
              />
            ) : (
              <button
                type="button"
                className="jx-todo__text"
                onClick={() => {
                  setEditing(index)
                  setEditDraft(item.text)
                }}
              >
                {item.text}
              </button>
            )}
            <button type="button" className="jx-x" aria-label={`Remove “${item.text}”`} onClick={() => save(items.filter((_, i) => i !== index))}>
              <X size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="jx-addline"
        onSubmit={(event) => {
          event.preventDefault()
          add()
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add an item…"
          aria-label="Add an item"
          enterKeyHint="enter"
        />
        <button type="submit" className="jx-round" aria-label="Add item" disabled={!draft.trim()}>
          <Plus size={18} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
