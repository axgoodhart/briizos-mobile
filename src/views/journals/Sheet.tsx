import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  tall?: boolean
}

/* A panel that rises from the bottom of the screen. Tapping the dimmed
   area above it, the × button, or Escape closes it. */
export function Sheet({ title, subtitle, onClose, children, footer, tall = false }: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <div className="jx-sheet-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className={`jx-sheet${tall ? ' jx-sheet--tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <span className="jx-sheet__grip" aria-hidden="true" />
        <header className="jx-sheet__header">
          <div>
            <h2 id={titleId} className="jx-sheet__title">{title}</h2>
            {subtitle && <p className="jx-sheet__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="jx-round" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="jx-sheet__body">{children}</div>
        {footer && <footer className="jx-sheet__footer">{footer}</footer>}
      </div>
    </div>
  )
}

interface ConfirmProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/* A yes/no question that sits in the middle of the screen. Used before
   anything that can't be undone. */
export function Confirm({ title, message, confirmLabel, cancelLabel = 'Keep it', danger = false, onConfirm, onCancel }: ConfirmProps) {
  const titleId = useId()
  return (
    <div className="jx-sheet-backdrop jx-sheet-backdrop--center" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="jx-confirm" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="jx-confirm__title">{title}</h2>
        <p className="jx-confirm__message">{message}</p>
        <div className="jx-confirm__actions">
          <button type="button" className="jx-button" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`jx-button ${danger ? 'jx-button--danger' : 'jx-button--primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
