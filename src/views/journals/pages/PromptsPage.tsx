import { useEffect, useRef, useState } from 'react'
import type { Folio, FolioContent } from '../../../features/journals/types'

interface PageProps {
  folio: Folio
  onSave: (content: FolioContent) => void
}

/* Reflection questions with room to answer. Answers save a moment after
   you stop typing, and when you leave the field. */
export function PromptsPage({ folio, onSave }: PageProps) {
  const prompts = folio.content.prompts ?? []
  const [answers, setAnswers] = useState<string[]>(() => prompts.map((_, index) => folio.content.answers?.[index] ?? ''))
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef({ answers, content: folio.content, onSave })

  useEffect(() => {
    latest.current = { answers, content: folio.content, onSave }
  })

  const flush = () => {
    window.clearTimeout(timer.current)
    const { answers: current, content, onSave: save } = latest.current
    const stored = content.answers ?? []
    if (current.some((answer, index) => answer !== (stored[index] ?? ''))) save({ ...content, answers: current })
  }

  useEffect(() => () => flush(), []) // save on leaving the page

  const change = (index: number, value: string) => {
    setAnswers((current) => current.map((answer, i) => (i === index ? value : answer)))
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 700)
  }

  return (
    <div className="jx-prompts">
      {folio.content.intro && <p className="jx-prompts__intro">{folio.content.intro}</p>}
      <ol className="jx-prompts__list">
        {prompts.map((prompt, index) => (
          <li key={index}>
            <label className="jx-prompts__q" htmlFor={`${folio.id}-answer-${index}`}>{prompt}</label>
            <textarea
              id={`${folio.id}-answer-${index}`}
              className="jx-prompts__answer"
              value={answers[index] ?? ''}
              placeholder="Write your answer…"
              rows={Math.max(2, (answers[index] ?? '').split('\n').length + Math.floor((answers[index] ?? '').length / 38))}
              onChange={(event) => {
                change(index, event.target.value)
                event.target.style.height = 'auto'
                event.target.style.height = `${event.target.scrollHeight}px`
              }}
              onBlur={flush}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
