import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Folio, FolioContent } from '../../../features/journals/types'
import { Sheet } from '../Sheet'

interface PageProps {
  folio: Folio
  onSave: (content: FolioContent) => void
}

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/* A log. On the Mac it is a wide table; on a phone each row becomes a
   small card, and tapping one opens it to edit every column. */
export function TrackerPage({ folio, onSave }: PageProps) {
  const columns = folio.content.columns ?? []
  const rows = folio.content.rows ?? []
  const [editing, setEditing] = useState<{ index: number | null; values: string[] } | null>(null)

  const saveRows = (next: string[][]) => onSave({ ...folio.content, rows: next })

  const openNew = () => {
    setEditing({
      index: null,
      values: columns.map((column) => (/date/i.test(column) ? today() : '')),
    })
  }

  const commit = () => {
    if (!editing) return
    const values = editing.values.map((value) => value.trim())
    if (editing.index === null) {
      if (values.some(Boolean)) saveRows([...rows, values])
    } else {
      const index = editing.index
      saveRows(rows.map((row, i) => (i === index ? values : row)))
    }
    setEditing(null)
  }

  const remove = () => {
    if (editing?.index === null || editing === null) return
    const index = editing.index
    saveRows(rows.filter((_, i) => i !== index))
    setEditing(null)
  }

  return (
    <div className="jx-tracker">
      {rows.length > 0 && <p className="jx-page__count">{rows.length} {rows.length === 1 ? 'entry' : 'entries'}</p>}
      {rows.length === 0 && <p className="jx-page__empty">Nothing logged yet. Each entry records: {columns.join(', ')}.</p>}
      <ol className="jx-tracker__rows">
        {rows.map((row, index) => (
          <li key={index}>
            <button type="button" className="jx-tracker__row" onClick={() => setEditing({ index, values: columns.map((_, i) => row[i] ?? '') })}>
              {columns.map((column, i) => (
                row[i] ? (
                  <span key={column} className="jx-tracker__cell">
                    <span className="jx-tracker__label">{column}</span>
                    <span className="jx-tracker__value">{row[i]}</span>
                  </span>
                ) : null
              ))}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="jx-button jx-button--ink jx-button--wide" onClick={openNew}>
        <Plus size={16} aria-hidden="true" /> Add an entry
      </button>

      {editing && (
        <Sheet
          title={editing.index === null ? 'New entry' : 'Edit entry'}
          subtitle={folio.title}
          onClose={() => setEditing(null)}
          footer={
            <>
              {editing.index !== null && (
                <button type="button" className="jx-button jx-button--danger" onClick={remove}>
                  <Trash2 size={16} aria-hidden="true" /> Remove
                </button>
              )}
              <button type="button" className="jx-button jx-button--primary" onClick={commit}>Save</button>
            </>
          }
        >
          <form
            className="jx-form"
            onSubmit={(event) => {
              event.preventDefault()
              commit()
            }}
          >
            {columns.map((column, i) => (
              <label key={column} className="jx-field">
                <span className="jx-field__label">{column}</span>
                <input
                  className="jx-input"
                  value={editing.values[i] ?? ''}
                  inputMode={/amount|duration|energy|\(1/i.test(column) ? 'decimal' : undefined}
                  onChange={(event) => {
                    const values = [...editing.values]
                    values[i] = event.target.value
                    setEditing({ ...editing, values })
                  }}
                />
              </label>
            ))}
            <button type="submit" hidden />
          </form>
        </Sheet>
      )}
    </div>
  )
}
