import { serverTimestamp } from 'firebase/firestore'
import type {
  BriizCalendarEvent,
  BriizOrganizerItem,
  BriizTask,
  BriizWindowState,
  BriizWindowUiBranch,
} from '../types/briizos'

type RawDoc = Record<string, unknown>

function isRecord(value: unknown): value is RawDoc {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value)
}

function numberValue(value: unknown, fallback = 0): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function numberOrNull(value: unknown): number | null {
  return value == null ? null : numberValue(value)
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(item => String(item)) : []
}

function requireFields(doc: RawDoc, fields: string[], adapterName: string) {
  const missing = fields.filter(field => doc[field] === undefined || doc[field] === null)
  if (missing.length) {
    throw new Error(`[${adapterName}] missing: ${missing.join(', ')}`)
  }
}

function withServerStamp<T extends RawDoc>(doc: T, _isNew: boolean): T {
  const createdAt = numberValue(doc.createdAt, Date.now())
  return {
    ...doc,
    createdAt,
    updatedAt: serverTimestamp(),
  }
}

function xywhFrom(value: unknown, fallback?: Partial<BriizWindowUiBranch>): BriizWindowUiBranch {
  const source = isRecord(value) ? value : {}
  return {
    x: numberValue(source.x, fallback?.x ?? 0),
    y: numberValue(source.y, fallback?.y ?? 0),
    w: numberValue(source.w, fallback?.w ?? 300),
    h: numberValue(source.h, fallback?.h ?? 360),
  }
}

function readUiBranch(raw: RawDoc, branch: 'local' | 'web'): BriizWindowUiBranch | undefined {
  const ui = isRecord(raw.ui) ? raw.ui : undefined
  const branchRecord = ui && isRecord(ui[branch]) ? ui[branch] : undefined
  const xywh = branchRecord && isRecord(branchRecord.xywh) ? branchRecord.xywh : undefined
  return xywh ? xywhFrom(xywh) : undefined
}

function legacyWindowXywh(raw: RawDoc): BriizWindowUiBranch {
  return {
    x: numberValue(raw.x, 0),
    y: numberValue(raw.y, 0),
    w: numberValue(raw.w, 300),
    h: numberValue(raw.h, 360),
  }
}

export const taskAdapter = {
  normalizeOnRead(id: string, data: RawDoc): BriizTask {
    const completed = Boolean(data.completed || data.completedAt)
    const title = stringValue(data.title || data.text || data.name || data.message)

    return {
      ...data,
      id: String(id),
      type: stringValue(data.type, 'task'),
      title,
      text: title,
      status: completed ? 'completed' : stringValue(data.status, 'pending'),
      completed,
      completedAt: data.completedAt as BriizTask['completedAt'],
      priority: stringValue(data.priority, 'medium'),
      dueDate: data.dueDate == null ? null : String(data.dueDate),
      parentId: data.parentId == null ? null : String(data.parentId),
      actions: Array.isArray(data.actions) ? data.actions : undefined,
      position: isRecord(data.position)
        ? { x: numberValue(data.position.x), y: numberValue(data.position.y) }
        : null,
      createdAt: numberValue(data.createdAt || data.created, Date.now()),
      updatedAt: data.updatedAt,
    }
  },

  prepareForWrite(task: Partial<BriizTask> & RawDoc, isNew = false): RawDoc {
    const payload = withServerStamp({
      ...task,
      id: stringValue(task.id),
      type: stringValue(task.type, 'task'),
      title: stringValue(task.title || task.text || task.name || task.message),
      status: stringValue(task.status, task.completed ? 'completed' : 'pending'),
      completed: Boolean(task.completed || task.completedAt),
    }, isNew)

    delete payload.text
    delete payload.name
    delete payload.message
    requireFields(payload, ['id', 'type', 'title', 'status', 'completed', 'createdAt'], 'taskAdapter')
    return payload
  },
}

export const organizerAdapter = {
  normalizeOnRead(id: string, data: RawDoc): BriizOrganizerItem {
    const title = stringValue(data.title || data.name || data.text)
    const body = stringValue(data.body || data.description || data.content)
    const completedAt = data.completedAt as BriizOrganizerItem['completedAt']

    return {
      ...data,
      id: String(id),
      type: stringValue(data.type, 'note'),
      title,
      name: title,
      body,
      status: completedAt || data.status === 'done' ? 'done' : stringValue(data.status, 'todo'),
      completed: Boolean(data.completed || completedAt),
      completedAt,
      createdAt: numberValue(data.createdAt, Date.now()),
      updatedAt: data.updatedAt,
      tags: stringArray(data.tags),
      importance: data.importance as BriizOrganizerItem['importance'],
      size: data.size as BriizOrganizerItem['size'],
      relevance: data.relevance as BriizOrganizerItem['relevance'],
      deadline: data.deadline == null ? null : String(data.deadline),
      attachments: Array.isArray(data.attachments) ? data.attachments : [],
      links: Array.isArray(data.links) ? data.links : [],
      scheduledDate: data.scheduledDate == null ? null : String(data.scheduledDate),
      due: data.due == null ? null : String(data.due),
      dateMode: data.dateMode == null ? null : String(data.dateMode),
      dateValue: data.dateValue == null ? null : String(data.dateValue),
      start: data.start == null ? null : numberValue(data.start),
      end: data.end == null ? null : numberValue(data.end),
      duration: data.duration == null ? null : numberValue(data.duration),
      windowStateId: data.panelId == null ? null : String(data.panelId),
      windowStateType: data.panelType == null ? null : String(data.panelType),
      chat: isRecord(data.chat) ? data.chat as BriizOrganizerItem['chat'] : null,
      external: isRecord(data.external) ? data.external as BriizOrganizerItem['external'] : null,
      recurrence: data.recurrence,
    }
  },

  prepareForWrite(item: Partial<BriizOrganizerItem> & RawDoc, isNew = false): RawDoc {
    const payload = withServerStamp({
      ...item,
      id: stringValue(item.id),
      type: stringValue(item.type, 'note'),
      title: stringValue(item.title || item.name || item.text),
      body: stringValue(item.body || item.description || item.content),
      status: stringValue(item.status, item.completedAt ? 'done' : 'todo'),
      tags: stringArray(item.tags),
    }, isNew)

    delete payload.name
    delete payload.text
    delete payload.description
    delete payload.content
    requireFields(payload, ['id', 'type', 'title', 'status', 'createdAt'], 'organizerAdapter')
    return payload
  },
}

export const calendarAdapter = {
  normalizeOnRead(id: string, data: RawDoc): BriizCalendarEvent {
    const completed = Boolean(data.completed || data.completedAt)
    const title = stringValue(data.title || data.text || data.name)
    const scheduledDate = stringValue(data.scheduledDate || data.date || data.dateValue)

    return {
      ...data,
      id: String(id),
      type: stringValue(data.type, 'event'),
      title,
      text: title,
      body: stringValue(data.body || data.description),
      scheduledDate,
      status: completed ? 'done' : stringValue(data.status, 'todo'),
      completed,
      completedAt: data.completedAt as BriizCalendarEvent['completedAt'],
      time: data.time == null ? null : String(data.time),
      start: numberOrNull(data.start ?? data.startMinute),
      end: numberOrNull(data.end),
      durationMinutes: numberOrNull(data.durationMinutes ?? data.duration),
      allDay: Boolean(data.allDay),
      color: stringValue(data.color, '#3b82f6'),
      createdAt: numberValue(data.createdAt || data.created, Date.now()),
      updatedAt: data.updatedAt,
    }
  },

  prepareForWrite(event: Partial<BriizCalendarEvent> & RawDoc, isNew = false): RawDoc {
    const scheduledDate = stringValue(event.scheduledDate || event.date || event.dateValue)
    const payload = withServerStamp({
      ...event,
      id: stringValue(event.id),
      type: stringValue(event.type, 'event'),
      title: stringValue(event.title || event.text || event.name),
      body: stringValue(event.body || event.description),
      scheduledDate,
      status: stringValue(event.status, event.completed ? 'done' : 'todo'),
      completed: Boolean(event.completed || event.completedAt),
    }, isNew)

    delete payload.text
    delete payload.name
    delete payload.date
    delete payload.dateValue
    delete payload.description
    requireFields(payload, ['id', 'type', 'title', 'scheduledDate', 'status', 'createdAt'], 'calendarAdapter')
    return payload
  },
}

export const noteAdapter = {
  normalizeOnRead(id: string, data: RawDoc): BriizWindowState {
    const webBranch = readUiBranch(data, 'web')
    const localBranch = readUiBranch(data, 'local')
    const legacy = legacyWindowXywh(data)
    const body = stringValue(data.body || data.content)
    const displayBranch = webBranch ?? legacy

    return {
      ...data,
      id: String(id),
      type: stringValue(data.type, 'note'),
      title: stringValue(data.title),
      body,
      content: body,
      customColor: (data.customColor ?? null) as BriizWindowState['customColor'],
      active: data.active !== false,
      isDocked: data.isDocked !== false,
      tags: stringArray(data.tags),
      ui: {
        ...(isRecord(data.ui) ? data.ui : {}),
        local: { xywh: localBranch ?? legacy },
        web: { xywh: webBranch ?? legacy },
      },
      orgId: data.orgId == null ? null : String(data.orgId),
      chat: isRecord(data.chat) ? data.chat as BriizWindowState['chat'] : null,
      externalUrl: stringValue(data.externalUrl),
      externalShowUrl: Boolean(data.externalShowUrl),
      externalData: data.externalData,
      subtype: data.subtype == null ? null : String(data.subtype),
      autoHeight: data.autoHeight !== false,
      expansionCount: numberValue(data.expansionCount),
      jobMessage: data.jobMessage,
      taskId: data.taskId == null ? null : String(data.taskId),
      x: displayBranch.x,
      y: displayBranch.y,
      w: displayBranch.w,
      h: displayBranch.h,
      createdAt: numberValue(data.createdAt, Date.now()),
      updatedAt: data.updatedAt,
    }
  },

  prepareForWrite(windowState: Partial<BriizWindowState> & RawDoc, isNew = false): RawDoc {
    const legacy = legacyWindowXywh(windowState)
    const existingUi = isRecord(windowState.ui) ? windowState.ui : {}
    const existingWeb = isRecord(existingUi.web) ? existingUi.web : undefined
    const existingLocal = isRecord(existingUi.local) ? existingUi.local : undefined
    const hasFlatXywh = ['x', 'y', 'w', 'h'].some(key => windowState[key] !== undefined)
    const payload: RawDoc = {
      ...windowState,
      id: stringValue(windowState.id),
      type: stringValue(windowState.type, 'note'),
      updatedAt: serverTimestamp(),
    }

    if (isNew || windowState.createdAt !== undefined) payload.createdAt = numberValue(windowState.createdAt, Date.now())
    if (isNew || windowState.title !== undefined) payload.title = stringValue(windowState.title)
    if (isNew || windowState.body !== undefined || windowState.content !== undefined) {
      payload.body = stringValue(windowState.body ?? windowState.content)
    }
    if (isNew || windowState.customColor !== undefined) payload.customColor = windowState.customColor ?? null
    if (isNew || windowState.active !== undefined) payload.active = windowState.active !== false
    if (isNew || windowState.tags !== undefined) payload.tags = stringArray(windowState.tags)

    delete payload.ui
    if (isNew) {
      payload.ui = {
        local: existingLocal ?? { xywh: legacy },
        web: existingWeb ?? { xywh: legacy },
      }
    } else if (hasFlatXywh || existingWeb) {
      payload.ui = {
        web: hasFlatXywh ? { ...(existingWeb ?? {}), xywh: legacy } : existingWeb,
      }
    }

    delete payload.content
    delete payload.x
    delete payload.y
    delete payload.w
    delete payload.h
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key]
    })
    if (isNew) {
      requireFields(payload, ['id', 'type', 'title', 'body', 'createdAt'], 'noteAdapter')
    } else {
      requireFields(payload, ['id'], 'noteAdapter')
    }
    return payload
  },
}

export const syncAdapters = {
  taskAdapter,
  organizerAdapter,
  calendarAdapter,
  noteAdapter,
}
