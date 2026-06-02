export type SyncStatus = 'idle' | 'authenticating' | 'signed-out' | 'syncing' | 'ready' | 'error'

export type BriizDocTimestamp = number | string | Date | { seconds?: number; nanoseconds?: number } | null

export interface BriizBaseDoc {
  id: string
  type: string
  createdAt: number
  updatedAt?: unknown
}

export interface BriizTask extends BriizBaseDoc {
  title: string
  status: string
  completed: boolean
  priority?: string | null
  dueDate?: string | null
  parentId?: string | null
  actions?: unknown[]
  completedAt?: BriizDocTimestamp
  position?: { x: number; y: number } | null
  text?: string
  name?: string
  message?: string
}

export interface BriizOrganizerItem extends BriizBaseDoc {
  title: string
  body: string
  status: string
  name?: string
  tags: string[]
  importance?: string | number | null
  size?: string | number | null
  relevance?: string | number | null
  deadline?: string | null
  attachments?: unknown[]
  links?: unknown[]
  completed?: boolean
  completedAt?: BriizDocTimestamp
  scheduledDate?: string | null
  due?: string | null
  dateMode?: string | null
  dateValue?: string | null
  start?: number | null
  end?: number | null
  duration?: number | null
  windowStateId?: string | null
  windowStateType?: string | null
  chat?: { provider?: string | null; model?: string | null } | null
  external?: { url?: string; showUrl?: boolean } | null
  recurrence?: unknown
}

export interface BriizCalendarEvent extends BriizBaseDoc {
  title: string
  body: string
  scheduledDate: string
  status: string
  completed: boolean
  completedAt?: BriizDocTimestamp
  time?: string | null
  start?: number | null
  end?: number | null
  durationMinutes?: number | null
  allDay?: boolean
  color?: string
  text?: string
  name?: string
  date?: string
  dateValue?: string
}

export interface BriizWindowUiBranch {
  x: number
  y: number
  w: number
  h?: number
}

export interface BriizWindowUi {
  local?: { xywh?: BriizWindowUiBranch }
  web?: { xywh?: BriizWindowUiBranch }
}

export type BriizCustomColor = string | Record<string, unknown> | null

export interface BriizWindowState extends BriizBaseDoc {
  title: string
  body: string
  content?: string
  customColor: BriizCustomColor
  active: boolean
  isDocked?: boolean
  tags: string[]
  ui?: BriizWindowUi
  orgId?: string | null
  chat?: { provider?: string | null; model?: string | null } | null
  externalUrl?: string
  externalShowUrl?: boolean
  externalData?: unknown
  subtype?: string | null
  autoHeight?: boolean
  expansionCount?: number
  jobMessage?: unknown
  taskId?: string | null
  x?: number
  y?: number
  w?: number
  h?: number
}

export interface BriizTimerState {
  mode: 'timer' | 'stopwatch'
  running: boolean
  paused: boolean
  startTime: number
  endTime: number
  defaultTimer: number
  remaining: number
  elapsed: number
  compact: boolean
  needsAck: boolean
  ts: number
  updatedAt?: unknown
}

export interface BriizChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  ts: number
  isError?: boolean
}

export interface BriizChatSettings {
  provider: 'chatgpt' | 'openai' | 'gemini' | 'claude'
  model: string
  temperature?: number
  topP?: number
  maxTokens?: number
  enableTools?: boolean
}

export interface BriizOSMobileState {
  uid: string | null
  email: string | null
  status: SyncStatus
  error: string | null
  windowStates: BriizWindowState[]
  tasks: BriizTask[]
  events: BriizCalendarEvent[]
  organizer: BriizOrganizerItem[]
  minStack: string[]
  timer: BriizTimerState | null
  lastUpdatedAt: number | null
}
