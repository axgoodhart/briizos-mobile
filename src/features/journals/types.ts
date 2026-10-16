/* Journal records on the phone.

   These mirror the shape briizOS on the Mac keeps for journals and folios
   (electron/local-data-service.js → _journalRow / _folioRow), so the two can
   be connected later without converting anything. Times are milliseconds. */

export type FolioType = 'notes' | 'todo' | 'prompts' | 'tracker' | 'dashboard'

export interface TodoItem {
  text: string
  done: boolean
}

export type WidgetFormat = 'money' | 'days' | 'hours'

export interface WidgetSource {
  from: 'tracker' | 'todo'
  folio: string
  agg: 'count' | 'countWeek' | 'sumMonth' | 'sumNum' | 'topValue' | 'daysSinceLast' | 'doneRatio'
  column?: string
}

export interface DashboardWidget {
  kind: 'progress' | 'stat'
  label: string
  value: string | number
  target?: number
  hint?: string
  format?: WidgetFormat
  editable?: boolean
  source?: WidgetSource
}

/* Rich text documents are TipTap / ProseMirror JSON, exactly as the Mac
   stores them in folio.content.doc. */
export interface RichNode {
  type: string
  attrs?: Record<string, unknown>
  content?: RichNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

export interface FolioContent {
  /* notes */
  doc?: RichNode
  body?: string
  /* todo */
  items?: TodoItem[]
  /* prompts */
  intro?: string
  prompts?: string[]
  answers?: string[]
  /* tracker */
  columns?: string[]
  rows?: string[][]
  /* dashboard */
  widgets?: DashboardWidget[]
  note?: string
  /* every page */
  groupStart?: boolean
  groupTags?: string[]
}

export interface Typography {
  h1: string
  h2: string
  h3: string
  body: string
  size: number
  lineHeight: number
}

export type ReadingMode = 'pages' | 'scroll'

export interface JournalSettings {
  typography?: Typography
  view?: ReadingMode
}

export interface Journal {
  id: string
  title: string
  tags: string[]
  cover: string
  page: string
  settings: JournalSettings
  mode: 'journal'
  position: number
  createdAt: number
  updatedAt: number
  openedAt: number | null
  deletedAt: number | null
  revision: number
}

export interface Folio {
  id: string
  journalId: string
  type: FolioType
  title: string
  content: FolioContent
  position: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  revision: number
}

export interface FolioRecipe {
  type: FolioType
  title: string
  content: FolioContent
}

export interface StoredImage {
  id: string
  blob: Blob
  type: string
  width: number
  height: number
  createdAt: number
}

export type ActivityLevel = 'info' | 'warn' | 'error'

export interface ActivityEntry {
  id: string
  at: number
  level: ActivityLevel
  area: string
  message: string
  detail?: Record<string, unknown>
}
