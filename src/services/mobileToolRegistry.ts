import { getMobileSyncService } from './mobileSyncService'
import type { BriizCalendarEvent, BriizOrganizerItem, BriizOSMobileState, BriizTask } from '../types/briizos'

export interface MobileToolDefinition {
  name: string
  description: string
  requiresConfirmation: boolean
  parameters: Record<string, { type: string; description: string; optional?: boolean }>
}

export interface MobileToolCall {
  id: string
  tool: string
  params: Record<string, unknown>
}

export interface MobileToolResult {
  success: boolean
  message: string
  data?: unknown
}

const TOOL_DEFINITIONS: MobileToolDefinition[] = [
  {
    name: 'getScheduleSummary',
    description: 'Read scheduled events for today, tomorrow, this week, next week, or all.',
    requiresConfirmation: false,
    parameters: {
      time_range: { type: 'string', description: 'today, tomorrow, this week, next week, or all', optional: true },
    },
  },
  {
    name: 'searchNotes',
    description: 'Search synced organizer notes and note records.',
    requiresConfirmation: false,
    parameters: {
      query: { type: 'string', description: 'Search term. Use an empty string to list recent notes.' },
      topic_filter: { type: 'string', description: 'Optional title or tag filter', optional: true },
    },
  },
  {
    name: 'findScheduleConflicts',
    description: 'Find events on the same day that may overlap.',
    requiresConfirmation: false,
    parameters: {
      time_range: { type: 'string', description: 'Optional time range to check', optional: true },
    },
  },
  {
    name: 'createNote',
    description: 'Create a synced organizer note.',
    requiresConfirmation: true,
    parameters: {
      title: { type: 'string', description: 'Note title' },
      body: { type: 'string', description: 'Note body', optional: true },
    },
  },
  {
    name: 'createTask',
    description: 'Create a synced task.',
    requiresConfirmation: true,
    parameters: {
      title: { type: 'string', description: 'Task title' },
      priority: { type: 'string', description: 'low, medium, or high', optional: true },
      due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format', optional: true },
    },
  },
  {
    name: 'completeTask',
    description: 'Mark a synced task or organizer item as completed.',
    requiresConfirmation: true,
    parameters: {
      task_id: { type: 'string', description: 'Task ID or exact title' },
    },
  },
  {
    name: 'createSingleCalendarEvent',
    description: 'Create a one-time synced calendar event.',
    requiresConfirmation: true,
    parameters: {
      title: { type: 'string', description: 'Event title' },
      date: { type: 'string', description: 'Event date in YYYY-MM-DD format' },
      time: { type: 'string', description: 'Optional start time such as 9am, 2:30pm, or 14:00', optional: true },
      duration: { type: 'number', description: 'Optional duration in minutes', optional: true },
    },
  },
  {
    name: 'updateCalendarEvent',
    description: 'Move an existing synced calendar event to a new date.',
    requiresConfirmation: true,
    parameters: {
      event_title: { type: 'string', description: 'Event title or ID' },
      new_date: { type: 'string', description: 'New date in YYYY-MM-DD format' },
      target_date: { type: 'string', description: 'Optional current date to disambiguate', optional: true },
    },
  },
]

type TimeRange = 'today' | 'tomorrow' | 'this week' | 'next week' | 'all'

function stringParam(params: Record<string, unknown>, key: string, fallback = '') {
  const value = params[key]
  return value == null ? fallback : String(value)
}

function optionalStringParam(params: Record<string, unknown>, key: string): string | null {
  const value = stringParam(params, key).trim()
  return value ? value : null
}

function numberParam(params: Record<string, unknown>, key: string, fallback: number) {
  const value = Number(params[key])
  return Number.isFinite(value) ? value : fallback
}

function todayDate() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function dateOnly(value: string) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function normalizeTimeRange(value: string): TimeRange {
  const lower = value.toLowerCase()
  if (lower === 'today' || lower === 'tomorrow' || lower === 'this week' || lower === 'next week') return lower
  return 'all'
}

function rangeBounds(range: TimeRange) {
  const today = todayDate()
  const start = new Date(today)
  const end = new Date(today)

  if (range === 'today') {
    end.setDate(end.getDate() + 1)
  } else if (range === 'tomorrow') {
    start.setDate(start.getDate() + 1)
    end.setDate(end.getDate() + 2)
  } else if (range === 'this week') {
    end.setDate(end.getDate() + 7)
  } else if (range === 'next week') {
    start.setDate(start.getDate() + 7)
    end.setDate(end.getDate() + 14)
  } else {
    start.setFullYear(1970)
    end.setFullYear(2100)
  }

  return { start, end }
}

function eventDate(event: BriizCalendarEvent | BriizOrganizerItem) {
  return event.scheduledDate || ('dateValue' in event ? event.dateValue : null) || null
}

function eventTitle(event: BriizCalendarEvent | BriizOrganizerItem) {
  return event.title || event.name || 'Untitled event'
}

function eventStart(event: BriizCalendarEvent | BriizOrganizerItem) {
  return typeof event.start === 'number' ? event.start : null
}

function eventEnd(event: BriizCalendarEvent | BriizOrganizerItem) {
  if (typeof event.end === 'number') return event.end
  const start = eventStart(event)
  if (start == null) return null
  const duration = (event as BriizCalendarEvent).durationMinutes ?? (event as BriizOrganizerItem).duration
  return start + (typeof duration === 'number' ? duration : 60)
}

function collectEvents(sync: BriizOSMobileState): (BriizCalendarEvent | BriizOrganizerItem)[] {
  const organizerEvents = sync.organizer.filter(item => item.type === 'event' && item.scheduledDate)
  return [...sync.events, ...organizerEvents]
}

function collectNotes(sync: BriizOSMobileState) {
  const organizerNotes = sync.organizer
    .filter(item => item.type !== 'event')
    .map(item => ({
      id: item.id,
      title: item.title || item.name || 'Untitled note',
      body: item.body || '',
      tags: item.tags || [],
      source: 'organizer',
    }))

  const noteRecords = sync.windowStates
    .filter(item => item.type === 'note')
    .map(item => ({
      id: item.id,
      title: item.title || 'Untitled note',
      body: item.body || item.content || '',
      tags: item.tags || [],
      source: 'notes',
    }))

  return [...organizerNotes, ...noteRecords]
}

function parseTimeString(value: string | null): number | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()

  let match = normalized.match(/^(\d{1,2}):(\d{2})$/)
  if (match) return Number(match[1]) * 60 + Number(match[2])

  match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const period = match[3]

  if (period === 'pm' && hours !== 12) hours += 12
  if (period === 'am' && hours === 12) hours = 0
  return hours * 60 + minutes
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function taskMatches(task: BriizTask | BriizOrganizerItem, taskId: string) {
  const needle = taskId.toLowerCase()
  return String(task.id) === taskId || (task.title || task.name || '').toLowerCase() === needle
}

export function getMobileToolDefinitions() {
  return TOOL_DEFINITIONS
}

export function isWriteTool(toolName: string) {
  return TOOL_DEFINITIONS.some(tool => tool.name === toolName && tool.requiresConfirmation)
}

export function formatToolCall(call: MobileToolCall) {
  if (call.tool === 'createNote') return `Create note "${stringParam(call.params, 'title', 'Untitled note')}"`
  if (call.tool === 'createTask') return `Create task "${stringParam(call.params, 'title', 'Untitled task')}"`
  if (call.tool === 'completeTask') return `Complete "${stringParam(call.params, 'task_id', 'task')}"`
  if (call.tool === 'createSingleCalendarEvent') {
    return `Create event "${stringParam(call.params, 'title', 'Untitled event')}" on ${stringParam(call.params, 'date', 'unscheduled')}`
  }
  if (call.tool === 'updateCalendarEvent') {
    return `Move "${stringParam(call.params, 'event_title', 'event')}" to ${stringParam(call.params, 'new_date', 'new date')}`
  }
  return call.tool
}

export async function executeMobileTool(
  call: MobileToolCall,
  sync: BriizOSMobileState,
  options: { confirmed?: boolean } = {},
): Promise<MobileToolResult> {
  const definition = TOOL_DEFINITIONS.find(tool => tool.name === call.tool)
  if (!definition) throw new Error(`Unknown mobile tool: ${call.tool}`)
  if (definition.requiresConfirmation && options.confirmed !== true) {
    throw new Error(`${call.tool} requires confirmation before it can write data.`)
  }

  if (call.tool === 'getScheduleSummary') return getScheduleSummary(call.params, sync)
  if (call.tool === 'searchNotes') return searchNotes(call.params, sync)
  if (call.tool === 'findScheduleConflicts') return findScheduleConflicts(call.params, sync)
  if (call.tool === 'createNote') return createNote(call.params)
  if (call.tool === 'createTask') return createTask(call.params)
  if (call.tool === 'completeTask') return completeTask(call.params, sync)
  if (call.tool === 'createSingleCalendarEvent') return createSingleCalendarEvent(call.params)
  if (call.tool === 'updateCalendarEvent') return updateCalendarEvent(call.params, sync)

  throw new Error(`Unhandled mobile tool: ${call.tool}`)
}

function getScheduleSummary(params: Record<string, unknown>, sync: BriizOSMobileState): MobileToolResult {
  const range = normalizeTimeRange(stringParam(params, 'time_range', 'all'))
  const { start, end } = rangeBounds(range)
  const events = collectEvents(sync)
    .filter(event => {
      const date = dateOnly(eventDate(event) || '')
      return date ? date >= start && date < end : false
    })
    .sort((a, b) => String(eventDate(a)).localeCompare(String(eventDate(b))))

  if (!events.length) {
    return { success: true, message: `No events found for ${range}.`, data: [] }
  }

  const lines = events.slice(0, 12).map(event => `${eventDate(event)}: ${eventTitle(event)}`)
  return {
    success: true,
    message: `Events for ${range}:\n${lines.join('\n')}`,
    data: events,
  }
}

function searchNotes(params: Record<string, unknown>, sync: BriizOSMobileState): MobileToolResult {
  const query = stringParam(params, 'query').toLowerCase()
  const topic = stringParam(params, 'topic_filter').toLowerCase()
  const notes = collectNotes(sync).filter(note => {
    const haystack = `${note.title} ${note.body} ${note.tags.join(' ')}`.toLowerCase()
    return (!query || haystack.includes(query)) && (!topic || haystack.includes(topic))
  })

  if (!notes.length) {
    return { success: true, message: query ? `No notes found matching "${query}".` : 'No notes found.', data: [] }
  }

  const lines = notes.slice(0, 8).map(note => {
    const preview = note.body.trim().slice(0, 120)
    return `- ${note.title}${preview ? `: ${preview}` : ''}`
  })

  return {
    success: true,
    message: `Found ${notes.length} note${notes.length === 1 ? '' : 's'}:\n${lines.join('\n')}`,
    data: notes,
  }
}

function findScheduleConflicts(params: Record<string, unknown>, sync: BriizOSMobileState): MobileToolResult {
  const range = normalizeTimeRange(stringParam(params, 'time_range', 'all'))
  const { start, end } = rangeBounds(range)
  const events = collectEvents(sync)
    .filter(event => {
      const date = dateOnly(eventDate(event) || '')
      return date ? date >= start && date < end : false
    })

  const conflicts: string[] = []

  events.forEach((event, index) => {
    events.slice(index + 1).forEach(other => {
      const firstDate = eventDate(event)
      const secondDate = eventDate(other)
      if (!firstDate || firstDate !== secondDate) return

      const firstStart = eventStart(event)
      const secondStart = eventStart(other)
      const firstEnd = eventEnd(event)
      const secondEnd = eventEnd(other)
      const overlaps = firstStart != null && secondStart != null && firstEnd != null && secondEnd != null
        ? firstStart < secondEnd && secondStart < firstEnd
        : true

      if (overlaps) conflicts.push(`${firstDate}: "${eventTitle(event)}" overlaps "${eventTitle(other)}"`)
    })
  })

  if (!conflicts.length) return { success: true, message: `No schedule conflicts found for ${range}.`, data: [] }
  return { success: true, message: `Found ${conflicts.length} possible conflict${conflicts.length === 1 ? '' : 's'}:\n${conflicts.join('\n')}`, data: conflicts }
}

async function createNote(params: Record<string, unknown>): Promise<MobileToolResult> {
  const title = stringParam(params, 'title', 'Untitled note').trim() || 'Untitled note'
  const body = stringParam(params, 'body')
  const id = makeId('note')

  await getMobileSyncService().saveOrganizerItem({
    id,
    type: 'note',
    title,
    body,
    status: 'todo',
    tags: [],
    completed: false,
    createdAt: Date.now(),
  })

  return { success: true, message: `Created note "${title}".`, data: { id } }
}

async function createTask(params: Record<string, unknown>): Promise<MobileToolResult> {
  const title = stringParam(params, 'title', 'Untitled task').trim() || 'Untitled task'
  const id = makeId('task')

  await getMobileSyncService().saveTask({
    id,
    type: 'task',
    title,
    status: 'pending',
    completed: false,
    priority: optionalStringParam(params, 'priority') || 'medium',
    dueDate: optionalStringParam(params, 'due_date'),
    createdAt: Date.now(),
  })

  return { success: true, message: `Created task "${title}".`, data: { id } }
}

async function completeTask(params: Record<string, unknown>, sync: BriizOSMobileState): Promise<MobileToolResult> {
  const taskId = stringParam(params, 'task_id').trim()
  if (!taskId) throw new Error('completeTask needs task_id.')

  const task = sync.tasks.find(item => taskMatches(item, taskId))
  if (task) {
    await getMobileSyncService().saveTask({
      ...task,
      status: 'completed',
      completed: true,
      completedAt: task.completedAt || Date.now(),
    })
    return { success: true, message: `Completed task "${task.title}".`, data: { id: task.id } }
  }

  const organizerItem = sync.organizer.find(item => taskMatches(item, taskId))
  if (!organizerItem) throw new Error(`Task "${taskId}" was not found.`)

  await getMobileSyncService().saveOrganizerItem({
    ...organizerItem,
    status: 'done',
    completed: true,
    completedAt: organizerItem.completedAt || Date.now(),
  })

  return { success: true, message: `Completed "${organizerItem.title}".`, data: { id: organizerItem.id } }
}

async function createSingleCalendarEvent(params: Record<string, unknown>): Promise<MobileToolResult> {
  const title = stringParam(params, 'title', 'Untitled event').trim() || 'Untitled event'
  const date = stringParam(params, 'date', isoDate(todayDate())).trim()
  const start = parseTimeString(optionalStringParam(params, 'time'))
  const duration = numberParam(params, 'duration', 60)
  const id = makeId('event')

  await getMobileSyncService().saveEvent({
    id,
    type: 'event',
    title,
    body: '',
    scheduledDate: date,
    status: 'todo',
    completed: false,
    time: optionalStringParam(params, 'time'),
    start,
    end: start == null ? null : start + duration,
    durationMinutes: duration,
    allDay: start == null,
    createdAt: Date.now(),
  })

  return { success: true, message: `Created event "${title}" on ${date}.`, data: { id } }
}

async function updateCalendarEvent(params: Record<string, unknown>, sync: BriizOSMobileState): Promise<MobileToolResult> {
  const eventTitleOrId = stringParam(params, 'event_title').trim()
  const newDate = stringParam(params, 'new_date').trim()
  const targetDate = optionalStringParam(params, 'target_date')
  if (!eventTitleOrId || !newDate) throw new Error('updateCalendarEvent needs event_title and new_date.')

  const needle = eventTitleOrId.toLowerCase()
  const event = sync.events.find(item => {
    const titleMatches = String(item.id) === eventTitleOrId || item.title.toLowerCase() === needle
    const dateMatches = !targetDate || item.scheduledDate === targetDate
    return titleMatches && dateMatches
  })

  if (!event) throw new Error(`Event "${eventTitleOrId}" was not found.`)

  await getMobileSyncService().saveEvent({
    ...event,
    scheduledDate: newDate,
  })

  return { success: true, message: `Moved "${event.title}" to ${newDate}.`, data: { id: event.id } }
}
