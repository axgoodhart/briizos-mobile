/* Journal templates. A template is a starting cover, a page style and a set
   of ready-made pages. The first six are the Mac's templates
   (briizOS.local src/components/journals/templates.js). One difference:
   Blank starts with a single notes page so there is somewhere to write
   straight away. Daily Pages and Project Log come from the earlier phone
   version. Execubriiz is not offered on the phone yet. */

import type { FolioRecipe } from './types'

export interface JournalTemplate {
  id: string
  name: string
  tagline: string
  cover: string | null
  page: string | null
  tags: string[]
  folios: FolioRecipe[]
}

export const TEMPLATES: JournalTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    tagline: 'An empty book. You bring the ink.',
    cover: null,
    page: null,
    tags: [],
    folios: [{ type: 'notes', title: 'Notes', content: { body: '' } }],
  },
  {
    id: 'health-goal',
    name: 'Health Goal',
    tagline: 'Track a habit, find its triggers, wean it down.',
    cover: 'Humanist',
    page: 'White Lined',
    tags: ['health'],
    folios: [
      {
        type: 'dashboard',
        title: 'Habit Dashboard',
        content: {
          widgets: [
            {
              kind: 'progress', label: 'Weekly limit used', value: 0, target: 7,
              source: { from: 'tracker', folio: 'Habit Log', agg: 'countWeek' },
            },
            {
              kind: 'stat', label: 'Instances this week', value: '0', hint: 'live from the log',
              source: { from: 'tracker', folio: 'Habit Log', agg: 'countWeek' },
            },
            {
              kind: 'stat', label: 'Days since last', value: '—', hint: 'keep it climbing', format: 'days',
              source: { from: 'tracker', folio: 'Habit Log', agg: 'daysSinceLast' },
            },
            {
              kind: 'stat', label: 'Top trigger', value: '—', hint: 'live from the log',
              source: { from: 'tracker', folio: 'Habit Log', agg: 'topValue', column: 'Trigger' },
            },
          ],
          note: 'Tap the limit to set it, then log every instance honestly — patterns beat willpower.',
        },
      },
      {
        type: 'tracker',
        title: 'Habit Log',
        content: { columns: ['Date', 'Time', 'Location', 'Trigger', 'Notes'], rows: [] },
      },
      {
        type: 'todo',
        title: 'Wean-Off Goals',
        content: {
          items: [
            { text: 'Define the habit I’m tracking, precisely', done: false },
            { text: 'Set a weekly instance limit', done: false },
            { text: 'Pick one substitution to try this week', done: false },
            { text: 'Review the log every Sunday', done: false },
          ],
        },
      },
      {
        type: 'prompts',
        title: 'Trigger Insights',
        content: {
          intro: 'After a week of logging, sit with these.',
          prompts: [
            'When does the habit show up most — time of day, place, mood?',
            'What happened right before the last three instances?',
            'Which trigger surprised you?',
            'What does the habit actually give you in that moment?',
          ],
        },
      },
      {
        type: 'notes',
        title: 'Substitutions',
        content: {
          body: 'Alternative activities to reach for, matched to triggers:\n\nBoredom →\nStress →\nSocial settings →\nLate night →\n',
        },
      },
      {
        type: 'prompts',
        title: 'Daily Summary',
        content: {
          intro: 'A two-minute close-out, every evening.',
          prompts: [
            'How did today go against the goal?',
            'One win, however small.',
            'One thing to do differently tomorrow.',
          ],
        },
      },
    ],
  },
  {
    id: 'idea-incubator',
    name: 'Idea Incubator',
    tagline: 'Catch sparks, grow seedlings, ship the keepers.',
    cover: 'Fantasy Card',
    page: 'Pastel Botanical',
    tags: ['ideas'],
    folios: [
      {
        type: 'notes',
        title: 'Spark Page',
        content: { body: 'Raw, unfiltered captures. No idea is too dumb for this page.\n\n• ' },
      },
      {
        type: 'tracker',
        title: 'Idea Pipeline',
        content: { columns: ['Idea', 'Stage', 'Next step', 'Energy (1–5)'], rows: [] },
      },
      {
        type: 'todo',
        title: 'To Validate',
        content: {
          items: [
            { text: 'Pick one idea and describe it in a single sentence', done: false },
            { text: 'Find one person who has this problem', done: false },
          ],
        },
      },
      {
        type: 'prompts',
        title: 'Incubation Prompts',
        content: {
          intro: 'For ideas that feel stuck.',
          prompts: [
            'What would the lazy version of this look like?',
            'Who already solved something adjacent?',
            'What would make this idea ten times smaller?',
            'If it failed, why did it fail?',
          ],
        },
      },
    ],
  },
  {
    id: 'finances',
    name: 'Finances',
    tagline: 'Expense log, budget dials, money plans.',
    cover: 'Coverboard',
    page: 'Graph-dark',
    tags: ['money'],
    folios: [
      {
        type: 'dashboard',
        title: 'Money Dashboard',
        content: {
          widgets: [
            {
              kind: 'progress', label: 'Monthly budget used', value: 0, target: 500, format: 'money',
              source: { from: 'tracker', folio: 'Expense Log', agg: 'sumMonth', column: 'Amount' },
            },
            {
              kind: 'stat', label: 'Spent this month', value: '$0', hint: 'live from the log', format: 'money',
              source: { from: 'tracker', folio: 'Expense Log', agg: 'sumMonth', column: 'Amount' },
            },
            {
              kind: 'stat', label: 'Biggest category', value: '—', hint: 'watch this one',
              source: { from: 'tracker', folio: 'Expense Log', agg: 'topValue', column: 'Category' },
            },
            { kind: 'stat', label: 'Savings goal', value: '0%', hint: 'tap to edit', editable: true },
          ],
          note: 'Tap the budget to set it. Log first, judge later — the dashboard only works if the log is honest.',
        },
      },
      {
        type: 'tracker',
        title: 'Expense Log',
        content: { columns: ['Date', 'Item', 'Category', 'Amount', 'Worth it?'], rows: [] },
      },
      {
        type: 'todo',
        title: 'Bills & Planning',
        content: {
          items: [
            { text: 'List fixed monthly bills with due dates', done: false },
            { text: 'Set this month’s budget ceiling', done: false },
            { text: 'Pick one subscription to cancel or downgrade', done: false },
          ],
        },
      },
      {
        type: 'notes',
        title: 'Money Notes',
        content: { body: 'Plans, worries, windfalls, weird purchases that need explaining.\n' },
      },
    ],
  },
  {
    id: 'new-skill',
    name: 'New Skill Log',
    tagline: 'Practice sessions, milestones, honest reflection.',
    cover: 'Diagrammical',
    page: 'Modern Frame',
    tags: ['learning'],
    folios: [
      {
        type: 'dashboard',
        title: 'Skill Dashboard',
        content: {
          widgets: [
            {
              kind: 'progress', label: 'Hours practiced', value: 0, target: 20, format: 'hours',
              source: { from: 'tracker', folio: 'Practice Sessions', agg: 'sumNum', column: 'Duration' },
            },
            {
              kind: 'stat', label: 'Sessions logged', value: '0', hint: 'consistency > length',
              source: { from: 'tracker', folio: 'Practice Sessions', agg: 'count' },
            },
            {
              kind: 'stat', label: 'Milestones hit', value: '0%', hint: 'from the checklist',
              source: { from: 'todo', folio: 'Milestones', agg: 'doneRatio' },
            },
            { kind: 'stat', label: 'Current focus', value: '—', hint: 'tap to edit', editable: true },
          ],
          note: 'Log Duration in hours (e.g. 1.5). Tap the target to change the 20-hour goal.',
        },
      },
      {
        type: 'tracker',
        title: 'Practice Sessions',
        content: { columns: ['Date', 'Duration', 'Focus', 'What clicked', 'What fought back'], rows: [] },
      },
      {
        type: 'todo',
        title: 'Milestones',
        content: {
          items: [
            { text: 'Define what “good enough” looks like', done: false },
            { text: 'First micro-milestone', done: false },
            { text: 'First thing made/performed for someone else', done: false },
          ],
        },
      },
      {
        type: 'prompts',
        title: 'Reflection',
        content: {
          intro: 'Every few sessions, not every session.',
          prompts: [
            'What feels easier than it did last week?',
            'Where am I practicing the comfortable part instead of the hard part?',
            'What would a teacher tell me to stop doing?',
          ],
        },
      },
    ],
  },
  {
    id: 'meandering',
    name: 'Meandering Thoughts',
    tagline: 'No structure, no goals. Just a place to wander.',
    cover: 'Leathermeal',
    page: 'Parchment',
    tags: [],
    folios: [
      {
        type: 'prompts',
        title: 'Wander Starters',
        content: {
          intro: 'Only if you want them. Blank pages follow.',
          prompts: [
            'What’s been circling in your head lately?',
            'Describe today as weather.',
            'Something you noticed that nobody else seemed to.',
          ],
        },
      },
      { type: 'notes', title: 'Stream', content: { body: '' } },
      { type: 'notes', title: 'Fragments', content: { body: '' } },
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
          prompts: ['What deserves my best attention today?', 'How do I want today to feel?', 'What can wait?'],
        },
      },
      { type: 'todo', title: 'Today', content: { items: [] } },
      { type: 'notes', title: 'Evening Notes', content: { body: 'One thing worth remembering:\n\n' } },
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
      { type: 'notes', title: 'North Star', content: { body: 'This project exists to…\n\nDone looks like…\n' } },
      { type: 'todo', title: 'Next Moves', content: { items: [] } },
      { type: 'tracker', title: 'Decision Log', content: { columns: ['Date', 'Decision', 'Why'], rows: [] } },
    ],
  },
]

export const TEMPLATE_BY_ID: Record<string, JournalTemplate> = Object.fromEntries(
  TEMPLATES.map((template) => [template.id, template]),
)

/* The blank page types offered by "add a page" (the Mac offers the first
   three; Reflection is the phone's addition). */
export const BLANK_PAGES: { label: string; hint: string; folio: FolioRecipe }[] = [
  { label: 'Notes', hint: 'Free writing with formatting', folio: { type: 'notes', title: 'Notes', content: { body: '' } } },
  { label: 'To-do list', hint: 'Things to tick off', folio: { type: 'todo', title: 'List', content: { items: [] } } },
  {
    label: 'Log',
    hint: 'Rows that build a record',
    folio: { type: 'tracker', title: 'Log', content: { columns: ['Date', 'Entry', 'Notes'], rows: [] } },
  },
  {
    label: 'Reflection',
    hint: 'Questions with room to answer',
    folio: { type: 'prompts', title: 'Reflection', content: { intro: '', prompts: ['What is on your mind?'] } },
  },
]
