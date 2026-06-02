import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { ensureFirebaseAuthPersistence, getBriizFirebase } from './firebaseClient'
import { prepareBriizSyncWrite, type SyncWriteOp } from './briizSyncCore'
import { calendarAdapter, noteAdapter, organizerAdapter, taskAdapter } from './syncAdapters'
import type {
  BriizCalendarEvent,
  BriizOrganizerItem,
  BriizOSMobileState,
  BriizTask,
  BriizTimerState,
  BriizWindowState,
  SyncStatus,
} from '../types/briizos'

type StateListener = (state: BriizOSMobileState) => void
type ArrayStateKey = 'windowStates' | 'tasks' | 'events' | 'organizer'
type AuthUnsubscribe = () => void
type SyncArrayItem = BriizCalendarEvent | BriizOrganizerItem | BriizTask | BriizWindowState
type DestructiveWriteOptions = { confirmed: true }

function createEmptyState(status: SyncStatus = 'idle'): BriizOSMobileState {
  return {
    uid: null,
    email: null,
    status,
    error: null,
    windowStates: [],
    tasks: [],
    events: [],
    organizer: [],
    minStack: [],
    timer: null,
    lastUpdatedAt: null,
  }
}

function cloneState(state: BriizOSMobileState): BriizOSMobileState {
  return {
    ...state,
    windowStates: [...state.windowStates],
    tasks: [...state.tasks],
    events: [...state.events],
    organizer: [...state.organizer],
    minStack: [...state.minStack],
    timer: state.timer ? { ...state.timer } : null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function requireDestructiveConfirmation(options?: Partial<DestructiveWriteOptions>) {
  if (options?.confirmed !== true) {
    throw new Error('Destructive briizOS writes require an explicit confirmation gate.')
  }
}

function normalizeTimer(data: DocumentData): BriizTimerState {
  const raw = isRecord(data.value) ? data.value : data
  const mode = raw.mode === 'stopwatch' ? 'stopwatch' : 'timer'

  return {
    mode,
    running: Boolean(raw.running),
    paused: Boolean(raw.paused),
    startTime: Number(raw.startTime) || 0,
    endTime: Number(raw.endTime) || 0,
    defaultTimer: Number(raw.defaultTimer) || 25 * 60 * 1000,
    remaining: Number(raw.remaining) || 25 * 60 * 1000,
    elapsed: Number(raw.elapsed) || 0,
    compact: Boolean(raw.compact),
    needsAck: Boolean(raw.needsAck),
    ts: Number(raw.ts) || Date.now(),
    updatedAt: raw.updatedAt,
  }
}

class MobileSyncService {
  private state = createEmptyState()
  private authUnsubscribe: AuthUnsubscribe | null = null
  private firestoreUnsubscribers = new Map<string, Unsubscribe>()
  private listeners = new Set<StateListener>()
  private db: Firestore | null = null
  private started = false

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    listener(cloneState(this.state))
    return () => this.listeners.delete(listener)
  }

  async start() {
    if (this.started) return
    this.started = true
    this.setState({ status: 'authenticating', error: null })

    try {
      await ensureFirebaseAuthPersistence()
      const { auth, db } = getBriizFirebase()
      this.db = db

      this.authUnsubscribe = onAuthStateChanged(auth, user => {
        if (!user) {
          this.clearFirestoreListeners()
          this.state = createEmptyState('signed-out')
          this.emit()
          return
        }

        this.bindUser(user.uid)
      }, error => {
        this.setState({ status: 'error', error: error.message })
      })
    } catch (error) {
      this.started = false
      this.setState({ status: 'error', error: errorMessage(error) })
    }
  }

  stop() {
    this.authUnsubscribe?.()
    this.authUnsubscribe = null
    this.clearFirestoreListeners()
    this.started = false
    this.state = createEmptyState()
    this.emit()
  }

  async signIn(email: string, password: string) {
    await ensureFirebaseAuthPersistence()
    const { auth } = getBriizFirebase()
    await signInWithEmailAndPassword(auth, email, password)
  }

  async signUp(email: string, password: string) {
    await ensureFirebaseAuthPersistence()
    const { auth } = getBriizFirebase()
    await createUserWithEmailAndPassword(auth, email, password)
  }

  async signOut() {
    const { auth } = getBriizFirebase()
    await signOut(auth)
  }

  async saveWindowState(windowState: Partial<BriizWindowState> & { id: string }) {
    const uid = this.requireUid()
    if (!windowState.orgId) throw new Error('Panel window state writes require an organizer orgId.')
    await this.applySyncOps(prepareBriizSyncWrite({
      uid,
      entity: 'panel',
      action: 'update',
      platform: 'mobile',
      itemId: windowState.orgId,
      panelId: windowState.id,
      data: windowState,
      serverTimestamp,
    }))
  }

  async deleteWindowState(windowStateId: string, options: DestructiveWriteOptions) {
    requireDestructiveConfirmation(options)
    const uid = this.requireUid()
    const db = this.requireDb()
    await deleteDoc(doc(db, `users/${uid}/panels/${windowStateId}`))
  }

  async saveTask(task: Partial<BriizTask> & { id: string }) {
    const uid = this.requireUid()
    const db = this.requireDb()
    const isNew = !this.state.tasks.some(item => item.id === task.id)
    await setDoc(doc(db, `users/${uid}/tasks/${task.id}`), taskAdapter.prepareForWrite(task, isNew), { merge: true })
  }

  async deleteTask(taskId: string, options: DestructiveWriteOptions) {
    requireDestructiveConfirmation(options)
    const uid = this.requireUid()
    const db = this.requireDb()
    await deleteDoc(doc(db, `users/${uid}/tasks/${taskId}`))
  }

  async saveEvent(event: Partial<BriizCalendarEvent> & { id: string }) {
    const uid = this.requireUid()
    const db = this.requireDb()
    const isNew = !this.state.events.some(item => item.id === event.id)
    await setDoc(doc(db, `users/${uid}/events/${event.id}`), calendarAdapter.prepareForWrite(event, isNew), { merge: true })
  }

  async deleteEvent(eventId: string, options: DestructiveWriteOptions) {
    requireDestructiveConfirmation(options)
    const uid = this.requireUid()
    const db = this.requireDb()
    await deleteDoc(doc(db, `users/${uid}/events/${eventId}`))
  }

  async saveOrganizerItem(item: Partial<BriizOrganizerItem> & { id: string }) {
    const uid = this.requireUid()
    const isNew = !this.state.organizer.some(existing => existing.id === item.id)
    await this.applySyncOps(prepareBriizSyncWrite({
      uid,
      entity: 'organizer',
      action: isNew ? 'create' : 'update',
      itemId: item.id,
      data: item,
      serverTimestamp,
    }))
  }

  async deleteOrganizerItem(itemId: string, options: DestructiveWriteOptions) {
    requireDestructiveConfirmation(options)
    const uid = this.requireUid()
    const item = this.state.organizer.find(existing => existing.id === itemId)
    if (item?.type === 'note') {
      const panelId = (item as BriizOrganizerItem & { panelId?: string | null }).panelId || item.windowStateId || undefined
      await this.applySyncOps(prepareBriizSyncWrite({
        uid,
        entity: 'note',
        action: 'delete',
        itemId,
        panelId,
      }))
      return
    }
    const db = this.requireDb()
    await deleteDoc(doc(db, `users/${uid}/organizer/${itemId}`))
  }

  async saveTimer(timer: BriizTimerState) {
    const uid = this.requireUid()
    const db = this.requireDb()
    await setDoc(doc(db, `users/${uid}/app/timer`), { ...timer, updatedAt: serverTimestamp() }, { merge: true })
  }

  async saveMinStack(minStack: string[]) {
    const uid = this.requireUid()
    const db = this.requireDb()
    await setDoc(doc(db, `users/${uid}/app/minStack`), { value: minStack.map(String), updatedAt: serverTimestamp() }, { merge: true })
  }

  private bindUser(uid: string) {
    this.clearFirestoreListeners()
    const { auth } = getBriizFirebase()
    this.state = { ...createEmptyState('syncing'), uid, email: auth.currentUser?.email ?? null }
    this.emit()

    this.bindCollection('panels', 'windowStates', (id, data) => noteAdapter.normalizeOnRead(id, data))
    this.bindCollection('tasks', 'tasks', (id, data) => taskAdapter.normalizeOnRead(id, data))
    this.bindCollection('events', 'events', (id, data) => calendarAdapter.normalizeOnRead(id, data))
    this.bindCollection('organizer', 'organizer', (id, data) => organizerAdapter.normalizeOnRead(id, data))
    this.bindAppDocs(uid)
  }

  private async applySyncOps(ops: SyncWriteOp[]) {
    const db = this.requireDb()
    for (const op of ops) {
      if (op.kind === 'delete') {
        await deleteDoc(doc(db, op.path))
      } else {
        await setDoc(doc(db, op.path), op.data, op.options)
      }
    }
  }

  private bindCollection(
    collectionName: string,
    stateKey: ArrayStateKey,
    normalize: (id: string, data: DocumentData) => SyncArrayItem,
  ) {
    const uid = this.state.uid
    const db = this.db
    if (!uid || !db) return

    const unsubscribe = onSnapshot(collection(db, `users/${uid}/${collectionName}`), snapshot => {
      const items = snapshot.docs.map(item => normalize(item.id, item.data()))
      this.setArrayState(stateKey, items)
      this.emit()
    }, error => {
      this.setState({ status: 'error', error: error.message })
    })

    this.firestoreUnsubscribers.set(collectionName, unsubscribe)
  }

  private setArrayState(stateKey: ArrayStateKey, items: SyncArrayItem[]) {
    const base = {
      ...this.state,
      status: 'ready' as const,
      error: null,
      lastUpdatedAt: Date.now(),
    }

    if (stateKey === 'windowStates') this.state = { ...base, windowStates: items as BriizWindowState[] }
    if (stateKey === 'tasks') this.state = { ...base, tasks: items as BriizTask[] }
    if (stateKey === 'events') this.state = { ...base, events: items as BriizCalendarEvent[] }
    if (stateKey === 'organizer') this.state = { ...base, organizer: items as BriizOrganizerItem[] }
  }

  private bindAppDocs(uid: string) {
    const db = this.requireDb()

    const minStackUnsubscribe = onSnapshot(doc(db, `users/${uid}/app/minStack`), snapshot => {
      const data = snapshot.exists() ? snapshot.data() : null
      const minStack = Array.isArray(data?.value) ? data.value.map(String) : []
      this.setState({ minStack, status: 'ready', error: null, lastUpdatedAt: Date.now() })
    }, error => {
      this.setState({ status: 'error', error: error.message })
    })

    const timerUnsubscribe = onSnapshot(doc(db, `users/${uid}/app/timer`), snapshot => {
      const timer = snapshot.exists() ? normalizeTimer(snapshot.data()) : null
      this.setState({ timer, status: 'ready', error: null, lastUpdatedAt: Date.now() })
    }, error => {
      this.setState({ status: 'error', error: error.message })
    })

    this.firestoreUnsubscribers.set('app/minStack', minStackUnsubscribe)
    this.firestoreUnsubscribers.set('app/timer', timerUnsubscribe)
  }

  private clearFirestoreListeners() {
    this.firestoreUnsubscribers.forEach(unsubscribe => unsubscribe())
    this.firestoreUnsubscribers.clear()
  }

  private requireUid(): string {
    if (!this.state.uid) throw new Error('Sign in before writing briizOS data.')
    return this.state.uid
  }

  private requireDb(): Firestore {
    if (!this.db) throw new Error('Firebase has not been initialized.')
    return this.db
  }

  private setState(patch: Partial<BriizOSMobileState>) {
    this.state = { ...this.state, ...patch }
    this.emit()
  }

  private emit() {
    const snapshot = cloneState(this.state)
    this.listeners.forEach(listener => listener(snapshot))
  }
}

let mobileSyncService: MobileSyncService | null = null

export function getMobileSyncService(): MobileSyncService {
  if (!mobileSyncService) {
    mobileSyncService = new MobileSyncService()
  }
  return mobileSyncService
}
