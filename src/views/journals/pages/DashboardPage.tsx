import { useState } from 'react'
import { computeWidget, formatValue, parseNum } from '../../../features/journals/dashboard'
import type { DashboardWidget, Folio, FolioContent } from '../../../features/journals/types'
import { Sheet } from '../Sheet'

interface PageProps {
  folio: Folio
  siblings: Folio[]
  onSave: (content: FolioContent) => void
}

type EditTarget = { index: number; field: 'target' | 'value'; label: string; draft: string }

/* Numbers that work themselves out from the journal's other pages.
   "live" marks a number that is being calculated; goals and hand-kept
   numbers can be tapped to change them. */
export function DashboardPage({ folio, siblings, onSave }: PageProps) {
  const widgets = folio.content.widgets ?? []
  const [editing, setEditing] = useState<EditTarget | null>(null)

  const saveWidget = (index: number, patch: Partial<DashboardWidget>) => {
    onSave({ ...folio.content, widgets: widgets.map((widget, i) => (i === index ? { ...widget, ...patch } : widget)) })
  }

  const commit = () => {
    if (!editing) return
    if (editing.field === 'target') {
      const current = Number(widgets[editing.index]?.target) || 1
      saveWidget(editing.index, { target: parseNum(editing.draft) || current })
    } else {
      saveWidget(editing.index, { value: editing.draft.trim() || '—' })
    }
    setEditing(null)
  }

  return (
    <div className="jx-dashboard">
      {widgets.map((widget, index) => {
        const computed = computeWidget(widget, siblings)
        const live = computed !== null
        const value = live ? computed : widget.value

        if (widget.kind === 'progress') {
          const target = Number(widget.target) || 1
          const amount = typeof value === 'number' ? value : parseNum(value)
          const percent = Math.min(100, (amount / target) * 100)
          return (
            <div key={index} className={`jx-widget jx-widget--progress${amount > target ? ' is-over' : ''}`}>
              <span className="jx-widget__label">
                {widget.label}
                {live && <em className="jx-live">live</em>}
              </span>
              <span
                className="jx-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={target}
                aria-valuenow={amount}
                aria-label={widget.label}
              >
                <span className="jx-bar__fill" style={{ width: `${percent}%` }} />
              </span>
              <span className="jx-widget__hint">
                {formatValue(amount, widget.format)} of{' '}
                <button
                  type="button"
                  className="jx-inline-edit"
                  onClick={() => setEditing({ index, field: 'target', label: `Goal for “${widget.label}”`, draft: String(widget.target ?? '') })}
                >
                  {formatValue(target, widget.format)}
                </button>
              </span>
            </div>
          )
        }

        const canEdit = !live && widget.editable
        return (
          <div key={index} className="jx-widget">
            {canEdit ? (
              <button
                type="button"
                className="jx-widget__value jx-inline-edit"
                onClick={() => setEditing({ index, field: 'value', label: widget.label, draft: String(widget.value ?? '') })}
              >
                {formatValue(widget.value, widget.format)}
              </button>
            ) : (
              <span className="jx-widget__value">{formatValue(value, widget.format)}</span>
            )}
            <span className="jx-widget__label">
              {widget.label}
              {live && <em className="jx-live">live</em>}
            </span>
            {widget.hint && <span className="jx-widget__hint">{widget.hint}</span>}
          </div>
        )
      })}
      {folio.content.note && <p className="jx-dashboard__note">{folio.content.note}</p>}

      {editing && (
        <Sheet
          title={editing.label}
          onClose={() => setEditing(null)}
          footer={<button type="button" className="jx-button jx-button--primary" onClick={commit}>Save</button>}
        >
          <form
            className="jx-form"
            onSubmit={(event) => {
              event.preventDefault()
              commit()
            }}
          >
            <input
              className="jx-input"
              value={editing.draft}
              autoFocus
              inputMode={editing.field === 'target' ? 'decimal' : undefined}
              aria-label={editing.label}
              onChange={(event) => setEditing({ ...editing, draft: event.target.value })}
            />
          </form>
        </Sheet>
      )}
    </div>
  )
}
