/* The phone's journal storage: one IndexedDB database in this browser.
   It holds far more than the old 5 MB localStorage shelf and can keep
   photos. The earlier phone journals ('briizos.mobile.journals.v1' in
   localStorage) are left untouched and are not read. */

export const DB_NAME = 'briizos-journals'
const DB_VERSION = 1

export type StoreName = 'journals' | 'folios' | 'images' | 'activity'

let dbPromise: Promise<IDBDatabase> | null = null

export function openJournalDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not offer on-device storage (IndexedDB).'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('journals')) db.createObjectStore('journals', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('folios')) {
        const folios = db.createObjectStore('folios', { keyPath: 'id' })
        folios.createIndex('journalId', 'journalId', { unique: false })
      }
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('activity')) {
        const activity = db.createObjectStore('activity', { keyPath: 'id' })
        activity.createIndex('at', 'at', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('The journal storage could not be opened.'))
    request.onblocked = () => reject(new Error('The journal storage is held open by another tab. Close other briizOS tabs and reload.'))
  })
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

function finish(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('A storage write failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('A storage write was cancelled.'))
  })
}

export async function readAll<T>(store: StoreName): Promise<T[]> {
  const db = await openJournalDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error(`Could not read ${store}.`))
  })
}

export async function readOne<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openJournalDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error ?? new Error(`Could not read from ${store}.`))
  })
}

/* Writes and deletes across several stores in one all-or-nothing step. */
export interface WriteBatch {
  put?: Partial<Record<StoreName, unknown[]>>
  remove?: Partial<Record<StoreName, string[]>>
}

export async function writeBatch(batch: WriteBatch) {
  const stores = new Set<StoreName>([
    ...(Object.keys(batch.put ?? {}) as StoreName[]),
    ...(Object.keys(batch.remove ?? {}) as StoreName[]),
  ])
  if (!stores.size) return
  const db = await openJournalDb()
  const transaction = db.transaction([...stores], 'readwrite')
  const done = finish(transaction)
  for (const [store, values] of Object.entries(batch.put ?? {}) as [StoreName, unknown[]][]) {
    const objectStore = transaction.objectStore(store)
    values.forEach((value) => objectStore.put(value))
  }
  for (const [store, keys] of Object.entries(batch.remove ?? {}) as [StoreName, string[]][]) {
    const objectStore = transaction.objectStore(store)
    keys.forEach((key) => objectStore.delete(key))
  }
  await done
}
