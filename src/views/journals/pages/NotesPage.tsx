import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  TextAlignCenter,
  TextAlignStart,
  TextAlignEnd,
  Bold,
  Heading,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import { FONT_CHOICES, LINE_HEIGHT_CHOICES, SIZE_CHOICES, createNotesEditor, type Editor } from '../../../features/journals/richText'
import { storePhoto } from '../../../features/journals/media'
import { notesDoc } from '../../../features/journals/text'
import type { Folio, FolioContent, RichNode } from '../../../features/journals/types'
import { Sheet } from '../Sheet'

interface NotesPageProps {
  folio: Folio
  onSave: (content: FolioContent, options: { quiet: boolean }) => void
}

/* How far the on-screen keyboard pushes up from the bottom of the screen,
   so the formatting bar can sit right on top of it. */
function useKeyboardOffset() {
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setOffset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop))
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])
  return offset
}

export function NotesPage({ folio, onSave }: NotesPageProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const lastSaved = useRef<string>('')
  const latest = useRef({ folio, onSave })
  const [focused, setFocused] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)
  const [, refresh] = useState(0)

  useEffect(() => {
    latest.current = { folio, onSave }
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const doc = notesDoc(latest.current.folio)

    const save = (quiet: boolean) => {
      window.clearTimeout(timer.current)
      const editor = editorRef.current
      if (!editor || editor.isDestroyed) return
      const next = editor.getJSON() as RichNode
      const serialized = JSON.stringify(next)
      if (serialized === lastSaved.current) return
      lastSaved.current = serialized
      const { folio: current, onSave: persist } = latest.current
      const content: FolioContent = { ...current.content, doc: next }
      delete content.body
      persist(content, { quiet })
    }

    let blurTimer: number | undefined
    const editor = createNotesEditor(host, doc, {
      editable: true,
      placeholder: 'Write…',
      onUpdate: () => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => save(true), 600)
      },
      onFocus: () => {
        window.clearTimeout(blurTimer)
        setFocused(true)
      },
      onBlur: () => {
        save(false)
        // A tap on the formatting bar briefly takes focus; wait before hiding it.
        blurTimer = window.setTimeout(() => {
          if (!editorRef.current?.isFocused) setFocused(false)
        }, 180)
      },
      onSelection: () => refresh((count) => count + 1),
    })
    editorRef.current = editor
    // Compare future saves against what the page showed when it opened, so
    // simply opening a page never counts as writing in it.
    lastSaved.current = JSON.stringify(editor.getJSON())

    const onHide = () => {
      if (document.visibilityState === 'hidden') save(true)
    }
    document.addEventListener('visibilitychange', onHide)

    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.clearTimeout(blurTimer)
      save(true)
      editor.destroy()
      editorRef.current = null
    }
  }, [])

  /* Writing added from elsewhere (for example the quick-entry pen) shows
     up here, but never while you are typing on this page. */
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || editor.isDestroyed || editor.isFocused) return
    const doc = folio.content.doc
    if (!doc) return
    const serialized = JSON.stringify(doc)
    if (serialized !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(doc as Parameters<typeof editor.commands.setContent>[0], false)
      lastSaved.current = serialized
    }
  }, [folio.content.doc])

  /* Photos are added here rather than inside the formatting bar: choosing
     one takes the focus away from the page, which hides the bar. */
  const addPhoto = async (file: File | undefined) => {
    const editor = editorRef.current
    if (!file || !editor) return
    setPhotoBusy(true)
    try {
      const src = await storePhoto(file)
      editor.chain().focus().insertContent([{ type: 'journalImage', attrs: { src, alt: '' } }, { type: 'paragraph' }]).run()
    } catch {
      /* storePhoto already explained the problem in the Activity log. */
    } finally {
      setPhotoBusy(false)
      if (photoInput.current) photoInput.current.value = ''
    }
  }

  const editor = editorRef.current
  return (
    <div className="jx-notes">
      <div className="jx-prose" ref={hostRef} />
      <input ref={photoInput} type="file" accept="image/*" hidden onChange={(event) => void addPhoto(event.target.files?.[0])} />
      {photoBusy && <p className="jx-page__count" role="status">Adding photo…</p>}
      {editor && (focused || panel !== null) && (
        <FormatBar
          editor={editor}
          panel={panel}
          setPanel={setPanel}
          photoBusy={photoBusy}
          onPickPhoto={() => photoInput.current?.click()}
        />
      )}
    </div>
  )
}

/* ── Formatting bar ─────────────────────────────────────────────────── */

type HeadingLevel = 1 | 2 | 3
type Panel = 'style' | 'link' | null

function portalTarget() {
  return document.querySelector('.bz-journals') ?? document.body
}

function BarButton({ label, active = false, onPress, children }: { label: string; active?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`jx-fmt__btn${active ? ' is-active' : ''}`}
      aria-label={label}
      aria-pressed={active}
      onPointerDown={(event) => event.preventDefault()}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
    >
      {children}
    </button>
  )
}

interface FormatBarProps {
  editor: Editor
  panel: Panel
  setPanel: (panel: Panel) => void
  photoBusy: boolean
  onPickPhoto: () => void
}

function FormatBar({ editor, panel, setPanel, photoBusy, onPickPhoto }: FormatBarProps) {
  const offset = useKeyboardOffset()
  const [linkDraft, setLinkDraft] = useState('')

  const chain = () => editor.chain().focus()
  const headingLevel = ([1, 2, 3] as HeadingLevel[]).find((level) => editor.isActive('heading', { level })) ?? null
  const align = editor.isActive({ textAlign: 'center' }) ? 'center' : editor.isActive({ textAlign: 'right' }) ? 'right' : 'left'

  const cycleHeading = () => {
    if (headingLevel === null) chain().setHeading({ level: 1 }).run()
    else if (headingLevel < 3) chain().setHeading({ level: (headingLevel + 1) as HeadingLevel }).run()
    else chain().setParagraph().run()
  }

  const cycleAlign = () => {
    const next = align === 'left' ? 'center' : align === 'center' ? 'right' : 'left'
    chain().setTextAlign(next).run()
  }

  const openLink = () => {
    if (editor.isActive('link')) editor.chain().extendMarkRange('link').run()
    setLinkDraft(String(editor.getAttributes('link').href ?? ''))
    setPanel('link')
  }

  const applyLink = () => {
    const url = linkDraft.trim()
    const href = /^[a-z]+:/i.test(url) ? url : `https://${url}`
    if (!url) chain().extendMarkRange('link').unsetLink().run()
    else if (editor.state.selection.empty && !editor.isActive('link')) {
      // Nothing selected: write the address itself as the link.
      chain().insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href } }] }).run()
    } else chain().extendMarkRange('link').setLink({ href }).run()
    setPanel(null)
  }

  const textStyle = editor.getAttributes('textStyle') as { fontFamily?: string | null; fontSize?: string | null }
  const lineHeight = String(editor.getAttributes(headingLevel ? 'heading' : 'paragraph').lineHeight ?? '')

  return createPortal(
    <>
      <div className="jx-fmt" role="toolbar" aria-label="Formatting" style={{ bottom: `${offset}px` }}>
        <div className="jx-fmt__scroll">
          <BarButton label="Bold" active={editor.isActive('bold')} onPress={() => chain().toggleBold().run()}><Bold size={18} /></BarButton>
          <BarButton label="Italic" active={editor.isActive('italic')} onPress={() => chain().toggleItalic().run()}><Italic size={18} /></BarButton>
          <BarButton label="Underline" active={editor.isActive('underline')} onPress={() => chain().toggleUnderline().run()}><UnderlineIcon size={18} /></BarButton>
          <BarButton label={headingLevel ? `Heading ${headingLevel}; tap for the next size` : 'Make a heading'} active={headingLevel !== null} onPress={cycleHeading}>
            <Heading size={18} />{headingLevel && <small>{headingLevel}</small>}
          </BarButton>
          <BarButton label="Bulleted list" active={editor.isActive('bulletList')} onPress={() => chain().toggleBulletList().run()}><List size={18} /></BarButton>
          <BarButton label="Numbered list" active={editor.isActive('orderedList')} onPress={() => chain().toggleOrderedList().run()}><ListOrdered size={18} /></BarButton>
          <BarButton label="Quote" active={editor.isActive('blockquote')} onPress={() => chain().toggleBlockquote().run()}><Quote size={18} /></BarButton>
          <BarButton label={`Aligned ${align}; tap to change`} active={align !== 'left'} onPress={cycleAlign}>
            {align === 'center' ? <TextAlignCenter size={18} /> : align === 'right' ? <TextAlignEnd size={18} /> : <TextAlignStart size={18} />}
          </BarButton>
          <BarButton label="Link" active={editor.isActive('link')} onPress={openLink}><Link2 size={18} /></BarButton>
          <BarButton label="Font, size and line spacing" active={!!(textStyle.fontFamily || textStyle.fontSize || lineHeight)} onPress={() => setPanel('style')}><Type size={18} /></BarButton>
          <BarButton label={photoBusy ? 'Adding photo…' : 'Add a photo'} onPress={onPickPhoto}><ImagePlus size={18} /></BarButton>
          <BarButton label="Undo" onPress={() => chain().undo().run()}><Undo2 size={18} /></BarButton>
          <BarButton label="Redo" onPress={() => chain().redo().run()}><Redo2 size={18} /></BarButton>
        </div>
        <button
          type="button"
          className="jx-fmt__done"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => editor.commands.blur()}
        >
          Done
        </button>
      </div>

      {panel === 'style' && (
        <Sheet title="Text style" subtitle="Applies to the selected words, or what you type next" onClose={() => setPanel(null)}>
          <h3 className="jx-field__label">Font</h3>
          <div className="jx-choice-grid">
            <button type="button" className={`jx-choice${!textStyle.fontFamily ? ' is-active' : ''}`} onClick={() => chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run()}>
              Journal default
            </button>
            {FONT_CHOICES.map((font) => (
              <button
                key={font.label}
                type="button"
                className={`jx-choice${textStyle.fontFamily === font.value ? ' is-active' : ''}`}
                style={{ fontFamily: font.value, '--theme-font': font.value } as CSSProperties}
                onClick={() => chain().setMark('textStyle', { fontFamily: font.value }).run()}
              >
                {font.label}
              </button>
            ))}
          </div>
          <h3 className="jx-field__label">Size</h3>
          <div className="jx-choice-row">
            <button type="button" className={`jx-choice${!textStyle.fontSize ? ' is-active' : ''}`} onClick={() => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()}>Auto</button>
            {SIZE_CHOICES.map((size) => (
              <button key={size} type="button" className={`jx-choice${textStyle.fontSize === String(size) ? ' is-active' : ''}`} onClick={() => chain().setMark('textStyle', { fontSize: String(size) }).run()}>
                {size}
              </button>
            ))}
          </div>
          <h3 className="jx-field__label">Line spacing</h3>
          <div className="jx-choice-row">
            <button
              type="button"
              className={`jx-choice${!lineHeight ? ' is-active' : ''}`}
              onClick={() => chain().updateAttributes('paragraph', { lineHeight: null }).updateAttributes('heading', { lineHeight: null }).run()}
            >
              Auto
            </button>
            {LINE_HEIGHT_CHOICES.map((value) => (
              <button
                key={value}
                type="button"
                className={`jx-choice${lineHeight === value ? ' is-active' : ''}`}
                onClick={() => chain().updateAttributes('paragraph', { lineHeight: value }).updateAttributes('heading', { lineHeight: value }).run()}
              >
                {value}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {panel === 'link' && (
        <Sheet
          title="Link"
          subtitle="Leave the address empty to remove the link"
          onClose={() => setPanel(null)}
          footer={<button type="button" className="jx-button jx-button--primary" onClick={applyLink}>Apply</button>}
        >
          <form
            className="jx-form"
            onSubmit={(event) => {
              event.preventDefault()
              applyLink()
            }}
          >
            <input
              className="jx-input"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="example.com"
              value={linkDraft}
              autoFocus
              aria-label="Link address"
              onChange={(event) => setLinkDraft(event.target.value)}
            />
          </form>
        </Sheet>
      )}
    </>,
    portalTarget(),
  )
}
