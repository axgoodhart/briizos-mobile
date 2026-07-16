export const JOURNAL_COVERS = [
  'Manuscript',
  'Humanist',
  'Fantasy Card',
  'Diagrammical',
  'Coverboard',
  'Blushflower',
] as const

export const JOURNAL_PAGES = [
  'Parchment',
  'White Lined',
  'Pastel Botanical',
  'Graph-dark',
  'Modern Frame',
] as const

export type JournalCover = (typeof JOURNAL_COVERS)[number]
export type JournalPage = (typeof JOURNAL_PAGES)[number]
export type JournalFolioType = 'notes' | 'todo' | 'prompts' | 'tracker' | 'dashboard'

export interface JournalTodoItem {
  id: string
  text: string
  done: boolean
}

export interface JournalWidget {
  kind: 'progress' | 'stat'
  label: string
  value: string | number
  target?: number
  hint?: string
}

export interface JournalFolioContent {
  body?: string
  items?: JournalTodoItem[]
  intro?: string
  prompts?: string[]
  answers?: Record<string, string>
  columns?: string[]
  rows?: string[][]
  widgets?: JournalWidget[]
  note?: string
}

export interface JournalFolio {
  id: string
  journalId: string
  type: JournalFolioType
  title: string
  content: JournalFolioContent
  position: number
  createdAt: string
  updatedAt: string
}

export interface MobileJournal {
  id: string
  title: string
  tags: string[]
  cover: JournalCover
  page: JournalPage
  folios: JournalFolio[]
  folioCount: number
  createdAt: string
  updatedAt: string
}

interface FolioRecipe {
  type: JournalFolioType
  title: string
  content: JournalFolioContent
}

export interface JournalTemplate {
  id: 'blank' | 'idea-incubator' | 'daily-pages' | 'project-log'
  name: string
  tagline: string
  cover: JournalCover
  page: JournalPage
  tags: string[]
  folios: FolioRecipe[]
}

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    tagline: 'One quiet page. Start anywhere.',
    cover: 'Manuscript',
    page: 'Parchment',
    tags: [],
    folios: [
      { type: 'notes', title: 'First page', content: { body: '' } },
    ],
  },
  {
    id: 'idea-incubator',
    name: 'Idea Incubator',
    tagline: 'Catch sparks, test them, keep the bright ones.',
    cover: 'Fantasy Card',
    page: 'Pastel Botanical',
    tags: ['ideas'],
    folios: [
      {
        type: 'notes',
        title: 'Spark page',
        content: { body: 'Raw, unfiltered captures. No idea is too small for this page.\n\n• ' },
      },
      {
        type: 'tracker',
        title: 'Idea pipeline',
        content: {
          columns: ['Idea', 'Stage', 'Next step'],
          rows: [],
        },
      },
      {
        type: 'todo',
        title: 'To validate',
        content: {
          items: [
            { id: 'describe-it', text: 'Describe one idea in a single sentence', done: false },
            { id: 'find-person', text: 'Find one person who has this problem', done: false },
          ],
        },
      },
      {
        type: 'prompts',
        title: 'Incubation prompts',
        content: {
          intro: 'For an idea that feels stuck.',
          prompts: [
            'What would the lazy version look like?',
            'What would make this ten times smaller?',
            'If it failed, why did it fail?',
          ],
          answers: {},
        },
      },
    ],
  },
  {
    id: 'daily-pages',
    name: 'Daily Pages',
    tagline: 'A light morning compass and evening close-out.',
    cover: 'Blushflower',
    page: 'White Lined',
    tags: ['daily'],
    folios: [
      {
        type: 'prompts',
        title: 'Morning',
        content: {
          intro: 'Take two minutes before the day gets loud.',
          prompts: [
            'What deserves my best attention today?',
            'How do I want today to feel?',
            'What can wait?',
          ],
          answers: {},
        },
      },
      {
        type: 'todo',
        title: 'Today',
        content: { items: [] },
      },
      {
        type: 'notes',
        title: 'Evening notes',
        content: { body: 'One thing worth remembering:\n\n' },
      },
    ],
  },
  {
    id: 'project-log',
    name: 'Project Log',
    tagline: 'Decisions, next moves, and the trail behind them.',
    cover: 'Diagrammical',
    page: 'Modern Frame',
    tags: ['project'],
    folios: [
      {
        type: 'notes',
        title: 'North star',
        content: { body: 'This project exists to…\n\nDone looks like…\n' },
      },
      {
        type: 'todo',
        title: 'Next moves',
        content: { items: [] },
      },
      {
        type: 'tracker',
        title: 'Decision log',
        content: {
          columns: ['Date', 'Decision', 'Why'],
          rows: [],
        },
      },
    ],
  },
]

const STORAGE_KEY = 'briizos.mobile.journals.v1'

export function makeJournalId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.()
  return randomId ? `${prefix}-${randomId}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function loadMobileJournals(): MobileJournal[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((value): value is MobileJournal => {
        if (!value || typeof value !== 'object') return false
        const candidate = value as Partial<MobileJournal>
        return typeof candidate.id === 'string' && typeof candidate.title === 'string' && Array.isArray(candidate.folios)
      })
      .map((journal) => ({
        ...journal,
        tags: Array.isArray(journal.tags) ? journal.tags : [],
        folios: journal.folios.map((folio, position) => ({ ...folio, position })),
        folioCount: journal.folios.length,
      }))
  } catch {
    return []
  }
}

export function saveMobileJournals(journals: MobileJournal[]) {
  if (typeof window === 'undefined') return false

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journals))
    return true
  } catch {
    return false
  }
}

export function createJournalFromTemplate(input: {
  title: string
  tags: string[]
  cover: JournalCover
  templateId: JournalTemplate['id']
}): MobileJournal {
  const template = JOURNAL_TEMPLATES.find((candidate) => candidate.id === input.templateId) ?? JOURNAL_TEMPLATES[0]
  if (!template) throw new Error('Journal templates are unavailable')

  const journalId = makeJournalId('journal')
  const now = new Date().toISOString()
  const folios = template.folios.map((recipe, position): JournalFolio => ({
    id: makeJournalId('folio'),
    journalId,
    type: recipe.type,
    title: recipe.title,
    content: JSON.parse(JSON.stringify(recipe.content)) as JournalFolioContent,
    position,
    createdAt: now,
    updatedAt: now,
  }))

  return {
    id: journalId,
    title: input.title.trim(),
    tags: [...new Set([...template.tags, ...input.tags])],
    cover: input.cover,
    page: template.page,
    folios,
    folioCount: folios.length,
    createdAt: now,
    updatedAt: now,
  }
}

export function createBlankFolio(journalId: string, type: Exclude<JournalFolioType, 'dashboard'>, position: number): JournalFolio {
  const now = new Date().toISOString()
  const titles: Record<Exclude<JournalFolioType, 'dashboard'>, string> = {
    notes: 'Untitled page',
    todo: 'Checklist',
    prompts: 'Reflection',
    tracker: 'Tracker',
  }
  const content: Record<Exclude<JournalFolioType, 'dashboard'>, JournalFolioContent> = {
    notes: { body: '' },
    todo: { items: [] },
    prompts: {
      intro: '',
      prompts: ['What is on your mind?'],
      answers: {},
    },
    tracker: {
      columns: ['Item', 'Status'],
      rows: [],
    },
  }

  return {
    id: makeJournalId('folio'),
    journalId,
    type,
    title: titles[type],
    content: content[type],
    position,
    createdAt: now,
    updatedAt: now,
  }
}
