/* Start a journal from text files. Each file becomes one page: prose files
   become notes pages, list-shaped files become to-do lists. Same rules as
   the Mac (briizOS.local src/components/journals/import.js). */

import type { FolioRecipe, RichNode, TodoItem } from './types'

export type ImportTarget = 'auto' | 'notes' | 'todo'

export interface ImportDoc {
  id: string
  name: string
  title: string
  text: string
  size: number
}

export const IMPORT_TARGETS: { id: ImportTarget; label: string; hint: string }[] = [
  { id: 'auto', label: 'sort for me', hint: 'Read each file and pick notes or list' },
  { id: 'notes', label: 'notes', hint: 'Prose pages, paragraphs preserved' },
  { id: 'todo', label: 'list', hint: 'One checkbox per paragraph break' },
]

export const TEXT_FILE_ACCEPT = '.txt,.md,.markdown,.text,.log,.csv,text/plain,text/markdown'
export const MAX_FILE_BYTES = 1024 * 1024
export const MAX_FILES = 999

const normalize = (text: string) =>
  String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(/\t/g, '    ')
    .trim()

export function splitParagraphs(text: string) {
  return normalize(text)
    .split(/\n[ \t]*\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
}

const nonEmptyLines = (text: string) =>
  normalize(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const MARKER = /^\s*(?:[-*+•·–—]|\d+[.)])?\s*(?:\[([ xX])\])?\s*/

function stripMarker(line: string): TodoItem {
  const match = line.match(MARKER)
  const box = match?.[1]
  const text = line.slice(match?.[0].length ?? 0).trim()
  return { text, done: box === 'x' || box === 'X' }
}

const hasMarker = (line: string) => /^\s*(?:[-*+•·–—]\s|\d+[.)]\s|\[[ xX]\])/.test(line)

const TODO_NAME_HINT = /\b(todo|to-?do|task|tasks|checklist|check-?list|shopping|groceries|errands|punch-?list)\b/i
const NOTES_NAME_HINT = /\b(notes?|journal|diary|essay|draft|log|minutes|transcript|readme)\b/i

export function classifyText(text: string, filename = ''): { type: 'notes' | 'todo'; reason: string } {
  const lines = nonEmptyLines(text)
  const blocks = splitParagraphs(text)

  if (!lines.length) return { type: 'notes', reason: 'empty file' }

  const markers = lines.filter(hasMarker).length
  if (markers / lines.length >= 0.5) {
    return { type: 'todo', reason: `${markers} of ${lines.length} lines are bulleted` }
  }
  if (TODO_NAME_HINT.test(filename) && !NOTES_NAME_HINT.test(filename)) {
    return { type: 'todo', reason: 'filename reads like a checklist' }
  }
  if (NOTES_NAME_HINT.test(filename)) {
    return { type: 'notes', reason: 'filename reads like prose' }
  }

  const units = blocks.length > 1 ? blocks : lines
  const avgLength = units.reduce((sum, unit) => sum + unit.length, 0) / units.length
  const sentenceish = units.filter((unit) => /[.!?]["')\]]?$/.test(unit)).length / units.length

  if (units.length >= 3 && avgLength <= 60 && sentenceish < 0.5) {
    return { type: 'todo', reason: `${units.length} short fragments, no sentence endings` }
  }
  return { type: 'notes', reason: avgLength > 60 ? 'long, prose-shaped blocks' : 'reads as prose' }
}

export function toListItems(text: string) {
  const blocks = splitParagraphs(text)
  const lines = nonEmptyLines(text)
  const units = blocks.length > 1 ? blocks : lines
  return units.map((unit) => stripMarker(unit.replace(/\n[ \t]*/g, ' '))).filter((item) => item.text)
}

export function toProseDoc(text: string): RichNode {
  const content: RichNode[] = splitParagraphs(text).map((block) => {
    const nodes: RichNode[] = []
    block.split('\n').forEach((line, index) => {
      if (index) nodes.push({ type: 'hardBreak' })
      const trimmed = line.trim()
      if (trimmed) nodes.push({ type: 'text', text: trimmed })
    })
    return nodes.length ? { type: 'paragraph', content: nodes } : { type: 'paragraph' }
  })
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] }
}

export function titleFromFilename(name: string) {
  const base = String(name || '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!base) return 'Imported'
  const titled = base.charAt(0).toUpperCase() + base.slice(1)
  return titled.length > 48 ? `${titled.slice(0, 47).trimEnd()}…` : titled
}

export function buildFolio(doc: ImportDoc, target: ImportTarget = 'auto'): FolioRecipe {
  const resolved = target === 'auto' ? classifyText(doc.text, doc.name).type : target
  const title = doc.title || titleFromFilename(doc.name)
  if (resolved === 'todo') return { type: 'todo', title, content: { items: toListItems(doc.text) } }
  return { type: 'notes', title, content: { doc: toProseDoc(doc.text) } }
}

export function buildFolios(docs: ImportDoc[], targets: Record<string, ImportTarget> = {}) {
  return docs.filter((doc) => normalize(doc.text)).map((doc) => buildFolio(doc, targets[doc.id] ?? 'auto'))
}

export function previewImport(doc: ImportDoc, target: ImportTarget = 'auto') {
  const classified = target === 'auto' ? classifyText(doc.text, doc.name) : null
  const type = classified ? classified.type : target
  if (type === 'todo') {
    const count = toListItems(doc.text).length
    return { type, label: count === 1 ? '1 item' : `${count} items`, reason: classified?.reason }
  }
  const count = splitParagraphs(doc.text).length
  return { type, label: count === 1 ? '1 paragraph' : `${count} paragraphs`, reason: classified?.reason }
}

const isProbablyText = (file: File) =>
  !file.type || file.type.startsWith('text/') || /\.(txt|md|markdown|text|log|csv)$/i.test(file.name)

export async function readTextFiles(fileList: FileList | File[] | null) {
  const files = Array.from(fileList ?? [])
  const docs: ImportDoc[] = []
  const skipped: { name: string; reason: string }[] = []

  for (const file of files.slice(0, MAX_FILES)) {
    if (!isProbablyText(file)) {
      skipped.push({ name: file.name, reason: 'not a text file' })
      continue
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push({ name: file.name, reason: 'larger than 1 MB' })
      continue
    }
    try {
      const text = await file.text()
      if (!normalize(text)) {
        skipped.push({ name: file.name, reason: 'empty' })
        continue
      }
      docs.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        title: titleFromFilename(file.name),
        text,
        size: file.size,
      })
    } catch {
      skipped.push({ name: file.name, reason: 'could not be read' })
    }
  }

  if (files.length > MAX_FILES) {
    skipped.push({ name: `${files.length - MAX_FILES} more file(s)`, reason: `over the ${MAX_FILES}-file limit` })
  }
  return { docs, skipped }
}
