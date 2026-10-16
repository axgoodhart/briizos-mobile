/* The notes-page editor. It writes the same document format as the Mac's
   journal editor (briizOS.local src/components/journals/richtext.jsx):
   bold, italic, underline, links, headings, lists, quotes, alignment,
   fonts, text sizes, line height and photos. */

import { Editor, Extension, Node } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import type { RichNode } from './types'
import { resolveImageSrc } from './store'

/* The app's base stylesheet forces one font on every element through the
   --theme-font variable. Writing a chosen font into that variable as well
   as font-family is what lets a font picked here actually show. */
const TextStyleAttributes = Extension.create({
  name: 'journalTextStyleAttributes',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontFamily?.replace(/["']/g, '') || null,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.fontFamily
                ? { style: `font-family: ${String(attributes.fontFamily)}; --theme-font: ${String(attributes.fontFamily)}` }
                : {},
          },
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/px$/, '') || null,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.fontSize ? { style: `font-size: ${String(attributes.fontSize)}px` } : {},
          },
        },
      },
    ]
  },
})

const LineHeight = Extension.create({
  name: 'lineHeight',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.lineHeight || null,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.lineHeight ? { style: `line-height: ${String(attributes.lineHeight)}` } : {},
          },
        },
      },
    ]
  },
})

/* A photo is its own block in the document, like on the Mac. On the phone
   its picture lives in on-device storage, so the page shows it through a
   small loader instead of a file path. */
const JournalImage = Node.create({
  name: 'journalImage',
  group: 'block',
  atom: true,
  draggable: false,
  addAttributes() {
    return {
      src: { default: null, parseHTML: (element: HTMLElement) => element.getAttribute('src') },
      alt: { default: '', parseHTML: (element: HTMLElement) => element.getAttribute('alt') || '' },
    }
  },
  parseHTML() {
    return [{ tag: 'img[data-journal-image]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', { ...HTMLAttributes, 'data-journal-image': '' }]
  },
  addNodeView() {
    return ({ node }) => {
      const frame = document.createElement('figure')
      frame.className = 'jx-photo is-loading'
      frame.setAttribute('data-journal-image', '')
      const img = document.createElement('img')
      img.alt = String(node.attrs.alt ?? '')
      frame.appendChild(img)
      void resolveImageSrc(node.attrs.src as string | null).then((url) => {
        frame.classList.remove('is-loading')
        if (url) img.src = url
        else {
          frame.classList.add('is-missing')
          frame.setAttribute('data-message', 'This photo is on another device')
        }
      })
      return { dom: frame }
    }
  },
})

export const FONT_CHOICES: { label: string; value: string }[] = [
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Jost', value: 'Jost, system-ui, sans-serif' },
  { label: 'Afacad Flux', value: "'Afacad Flux', system-ui, sans-serif" },
  { label: 'System', value: 'system-ui, sans-serif' },
  { label: 'Mono', value: "'SF Mono', Menlo, monospace" },
  { label: 'Cormorant', value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'Playfair', value: "'Playfair Display', Georgia, serif" },
  { label: 'Chillax', value: "'Journal Chillax', system-ui, sans-serif" },
  { label: 'Palatino', value: "Palatino, 'Palatino Linotype', serif" },
  { label: 'Baskerville', value: 'Baskerville, Georgia, serif' },
  { label: 'Didot', value: 'Didot, Georgia, serif' },
  { label: 'Avenir Next', value: "'Avenir Next', system-ui, sans-serif" },
  { label: 'Futura', value: 'Futura, system-ui, sans-serif' },
  { label: 'Gill Sans', value: "'Gill Sans', system-ui, sans-serif" },
  { label: 'Typewriter', value: "'American Typewriter', 'Courier New', monospace" },
  { label: 'Handwriting', value: "'Snell Roundhand', 'Bradley Hand', cursive" },
]

export const SIZE_CHOICES = [12, 14, 16, 18, 20, 24, 28, 32, 40]
export const LINE_HEIGHT_CHOICES = ['1', '1.15', '1.35', '1.5', '1.65', '1.8', '2']

export function createNotesEditor(element: HTMLElement, doc: RichNode, options: {
  editable: boolean
  placeholder?: string
  onUpdate: (editor: Editor) => void
  onFocus: (editor: Editor) => void
  onBlur: (editor: Editor) => void
  onSelection: (editor: Editor) => void
}) {
  return new Editor({
    element,
    editable: options.editable,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      TextStyleAttributes,
      LineHeight,
      JournalImage,
      Placeholder.configure({ placeholder: options.placeholder ?? 'Write…' }),
    ],
    content: doc as JSONContent,
    onUpdate: ({ editor }) => options.onUpdate(editor),
    onFocus: ({ editor }) => options.onFocus(editor),
    onBlur: ({ editor }) => options.onBlur(editor),
    onSelectionUpdate: ({ editor }) => options.onSelection(editor),
    onTransaction: ({ editor }) => options.onSelection(editor),
  })
}

export type { Editor }
