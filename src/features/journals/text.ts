/* Reading words back out of pages: for search, the Recents list and the
   "Your thoughts" card. */

import type { Folio, RichNode } from './types'
import { toProseDoc } from './importText'

function collectText(node: RichNode | undefined, out: string[]) {
  if (!node) return
  if (node.type === 'text' && node.text) out.push(node.text)
  if (node.type === 'hardBreak') out.push('\n')
  node.content?.forEach((child) => collectText(child, out))
}

/* Every block's text as its own line. */
export function docBlocks(doc: RichNode | undefined) {
  const blocks: string[] = []
  const walk = (node: RichNode | undefined) => {
    if (!node) return
    const isTextBlock = node.type === 'paragraph' || node.type === 'heading'
    if (isTextBlock) {
      const parts: string[] = []
      collectText(node, parts)
      const text = parts.join('').trim()
      if (text) blocks.push(text)
      return
    }
    node.content?.forEach(walk)
  }
  walk(doc)
  return blocks
}

/* A notes page's document, upgrading the older plain `body` string the way
   the Mac does when it first opens such a page. */
export function notesDoc(folio: Folio): RichNode {
  if (folio.content.doc && typeof folio.content.doc === 'object') return folio.content.doc
  return toProseDoc(folio.content.body ?? '')
}

export function folioBlocks(folio: Folio): string[] {
  const content = folio.content
  switch (folio.type) {
    case 'notes':
      return docBlocks(notesDoc(folio))
    case 'todo':
      return (content.items ?? []).map((item) => item.text).filter(Boolean)
    case 'prompts': {
      const prompts = content.prompts ?? []
      const answers = content.answers ?? []
      return [content.intro ?? '', ...prompts.flatMap((prompt, index) => [prompt, answers[index] ?? ''])]
        .map((text) => text.trim())
        .filter(Boolean)
    }
    case 'tracker':
      return (content.rows ?? []).map((row) => row.filter(Boolean).join(' · ')).filter(Boolean)
    case 'dashboard':
      return [content.note ?? '', ...(content.widgets ?? []).map((widget) => widget.label)].filter(Boolean)
    default:
      return []
  }
}

/* The words a person most recently wrote on a page: the last line with
   real text in it. Template boilerplate counts too, which is fine — it is
   still what the page currently says. */
export function latestLine(folio: Folio) {
  const blocks = folioBlocks(folio).filter((line) => line.replace(/[•\s→:]/g, '').length > 2)
  return blocks[blocks.length - 1] ?? ''
}

export function snippetAround(text: string, query: string, radius = 48) {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (!query) return flat.length > radius * 2 ? `${flat.slice(0, radius * 2).trimEnd()}…` : flat
  const at = flat.toLowerCase().indexOf(query.toLowerCase())
  if (at < 0) return flat.length > radius * 2 ? `${flat.slice(0, radius * 2).trimEnd()}…` : flat
  const start = Math.max(0, at - radius)
  const end = Math.min(flat.length, at + query.length + radius)
  return `${start > 0 ? '…' : ''}${flat.slice(start, end).trim()}${end < flat.length ? '…' : ''}`
}

export function truncate(text: string, length: number) {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > length ? `${flat.slice(0, length - 1).trimEnd()}…` : flat
}

const FOLIO_TYPE_LABELS: Record<Folio['type'], string> = {
  notes: 'Notes',
  todo: 'To-do list',
  prompts: 'Reflection',
  tracker: 'Log',
  dashboard: 'Dashboard',
}

export function folioTypeLabel(type: Folio['type']) {
  return FOLIO_TYPE_LABELS[type] ?? 'Page'
}

export function relativeTime(at: number, now = Date.now()) {
  const minutes = Math.round((now - at) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(at))
}
