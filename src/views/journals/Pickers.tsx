import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { PAGE_NAMES, artworkLabel, coverUrl, pageUrl } from '../../features/journals/assets'

export function CoverPicker({ value, onChange, names }: { value: string; onChange: (name: string) => void; names: string[] }) {
  return (
    <section className="jx-field" aria-label="Cover">
      <span className="jx-field__label">Cover · {artworkLabel(value)}</span>
      <div className="jx-art-strip" role="radiogroup" aria-label="Cover">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={artworkLabel(name)}
            className={`jx-art jx-art--cover${value === name ? ' is-active' : ''}`}
            onClick={() => onChange(name)}
          >
            <img src={coverUrl(name)} alt="" loading="lazy" draggable={false} />
            {value === name && <span className="jx-art__check"><Check size={14} strokeWidth={3} aria-hidden="true" /></span>}
          </button>
        ))}
      </div>
    </section>
  )
}

export function PagePicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  return (
    <section className="jx-field" aria-label="Page style">
      <span className="jx-field__label">Page style · {artworkLabel(value)}</span>
      <div className="jx-art-strip" role="radiogroup" aria-label="Page style">
        {PAGE_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={artworkLabel(name)}
            className={`jx-art jx-art--page${value === name ? ' is-active' : ''}`}
            onClick={() => onChange(name)}
          >
            <img src={pageUrl(name)} alt="" loading="lazy" draggable={false} />
            {value === name && <span className="jx-art__check"><Check size={14} strokeWidth={3} aria-hidden="true" /></span>}
          </button>
        ))}
      </div>
    </section>
  )
}

/* Tags as removable chips; type and press return (or a comma) to add. */
export function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')

  const commit = (value = draft) => {
    const tag = value.trim().replace(/^#/, '').replace(/,+$/, '').toLowerCase()
    setDraft('')
    if (!tag || tags.includes(tag)) return
    onChange([...tags, tag])
  }

  return (
    <div className="jx-field">
      <span className="jx-field__label">Tags</span>
      <div className="jx-tag-editor">
        {tags.map((tag) => (
          <span key={tag} className="jx-chip is-active">
            {tag}
            <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => onChange(tags.filter((existing) => existing !== tag))}>
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="jx-tag-editor__input"
          value={draft}
          placeholder={tags.length ? 'add another' : 'ideas, health, money…'}
          aria-label="Add a tag"
          enterKeyHint="done"
          onChange={(event) => {
            const value = event.target.value
            if (value.endsWith(',')) commit(value.slice(0, -1))
            else setDraft(value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            } else if (event.key === 'Backspace' && !draft && tags.length) {
              onChange(tags.slice(0, -1))
            }
          }}
          onBlur={() => commit()}
        />
      </div>
    </div>
  )
}
