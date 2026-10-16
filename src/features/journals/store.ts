/* The journal shelf in memory, saved to the phone as every change happens.
   Screens read it through useJournals(); every change goes through the
   functions below so it is saved and written to the Activity log. */

import { useSyncExternalStore } from 'react'
import { readAll, readOne, writeBatch } from './db'
import type {
  ActivityEntry,
  ActivityLevel,
  Folio,
  FolioContent,
  FolioRecipe,
  Journal,
  JournalSettings,
  RichNode,
  StoredImage,
} from './types'
import { DEFAULT_COVER, DEFAULT_PAGE } from './assets'

export type StorageStatus = 'loading' | 'saved' | 'saving' | 'error'

export interface JournalsSnapshot {
  ready: boolean
  journals: Journal[]
  folios: Folio[]
  activity: ActivityEntry[]
  storage: { status: StorageStatus; message: string | null }
}

const ACTIVITY_LIMIT = 1000

export function makeId() {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

let snapshot: JournalsSnapshot = {
  ready: false,
  journals: [],
  folios: [],
  activity: [],
  storage: { status: 'loading', message: null },
}

const listeners = new Set<() => void>()
let pendingWrites = 0
let loadStarted = false

function emit(next: Partial<JournalsSnapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!loadStarted) void loadJournals()
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return snapshot
}

export function useJournals() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/* ── Activity log ───────────────────────────────────────────────────── */

export function logActivity(level: ActivityLevel, area: string, message: string, detail?: Record<string, unknown>) {
  const entry: ActivityEntry = { id: makeId(), at: Date.now(), level, area, message, ...(detail ? { detail } : {}) }
  const activity = [entry, ...snapshot.activity].slice(0, ACTIVITY_LIMIT)
  const dropped = [entry, ...snapshot.activity].slice(ACTIVITY_LIMIT).map((old) => old.id)
  emit({ activity })
  const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  consoleMethod(`[journals:${area}] ${message}`, detail ?? '')
  writeBatch({ put: { activity: [entry] }, remove: dropped.length ? { activity: dropped } : undefined }).catch(() => {
    /* The log itself could not be saved; the entry still shows for this visit. */
  })
}

/* ── Saving ─────────────────────────────────────────────────────────── */

function persist(label: string, batch: Parameters<typeof writeBatch>[0]) {
  pendingWrites += 1
  if (snapshot.storage.status !== 'error') emit({ storage: { status: 'saving', message: null } })
  writeBatch(batch)
    .then(() => {
      pendingWrites -= 1
      if (pendingWrites === 0) emit({ storage: { status: 'saved', message: null } })
    })
    .catch((error) => {
      pendingWrites -= 1
      const message = `“${label}” could not be saved on this phone: ${errorText(error)}`
      emit({ storage: { status: 'error', message } })
      logActivity('error', 'storage', message, {
        effect: 'The change is visible now but will be gone if the app is closed.',
        nextStep: 'Free some space on the phone, then make the change again. Settings → Back up journals keeps a copy.',
      })
    })
}

export async function loadJournals() {
  if (loadStarted) return
  loadStarted = true
  try {
    const [journals, folios, activity] = await Promise.all([
      readAll<Journal>('journals'),
      readAll<Folio>('folios'),
      readAll<ActivityEntry>('activity'),
    ])
    emit({
      ready: true,
      journals,
      folios,
      activity: activity.sort((a, b) => b.at - a.at).slice(0, ACTIVITY_LIMIT),
      storage: { status: 'saved', message: null },
    })
    logActivity('info', 'storage', `Opened the journal shelf on this phone: ${journals.filter((j) => !j.deletedAt).length} journals, ${folios.filter((f) => !f.deletedAt).length} pages.`)
    void requestDurableStorage()
  } catch (error) {
    const message = `The journal shelf could not be opened: ${errorText(error)}`
    emit({ ready: true, storage: { status: 'error', message } })
    logActivity('error', 'storage', message, {
      effect: 'Journals can be viewed for this visit only; nothing will be saved.',
      nextStep: 'Close other briizOS tabs and reload. Private browsing windows cannot keep journals.',
    })
  }
}

async function requestDurableStorage() {
  if (!navigator.storage?.persist) return
  try {
    const already = await navigator.storage.persisted?.()
    if (already) return
    const granted = await navigator.storage.persist()
    logActivity(granted ? 'info' : 'warn', 'storage', granted
      ? 'This browser agreed to keep journal storage even when the phone is low on space.'
      : 'This browser did not promise to keep journal storage when space runs low. Adding briizOS to the Home Screen and making regular backups (Settings) protects your journals.')
  } catch {
    /* Not offered by this browser. */
  }
}

/* ── Journals ───────────────────────────────────────────────────────── */

function folioFromRecipe(journalId: string, recipe: FolioRecipe, position: number, at: number): Folio {
  return {
    id: makeId(),
    journalId,
    type: recipe.type,
    title: recipe.title,
    content: { ...clone(recipe.content), groupStart: true },
    position,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
    revision: 1,
  }
}

export function journalFolios(journalId: string, folios = snapshot.folios) {
  return folios
    .filter((folio) => folio.journalId === journalId && !folio.deletedAt)
    .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
}

export function createJournal(input: {
  title: string
  tags: string[]
  cover?: string
  page?: string
  folios: FolioRecipe[]
  source?: string
}) {
  const at = Date.now()
  const journal: Journal = {
    id: makeId(),
    title: input.title.trim() || 'Untitled journal',
    tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))],
    cover: input.cover || DEFAULT_COVER,
    page: input.page || DEFAULT_PAGE,
    settings: {},
    mode: 'journal',
    position: snapshot.journals.length,
    createdAt: at,
    updatedAt: at,
    openedAt: at,
    deletedAt: null,
    revision: 1,
  }
  const recipes = input.folios.length ? input.folios : [{ type: 'notes' as const, title: 'Notes', content: { body: '' } }]
  const folios = recipes.map((recipe, index) => folioFromRecipe(journal.id, recipe, index, at + index))
  emit({ journals: [...snapshot.journals, journal], folios: [...snapshot.folios, ...folios] })
  persist(`new journal ${journal.title}`, { put: { journals: [journal], folios } })
  logActivity('info', 'journal', `Created the journal “${journal.title}” with ${folios.length} page${folios.length === 1 ? '' : 's'}.`, {
    source: input.source ?? 'template',
    cover: journal.cover,
    pageStyle: journal.page,
    tags: journal.tags,
  })
  return journal
}

type JournalPatch = Partial<Pick<Journal, 'title' | 'tags' | 'cover' | 'page'>> & { settings?: JournalSettings }

export function updateJournal(journalId: string, patch: JournalPatch, describe?: string) {
  const current = snapshot.journals.find((journal) => journal.id === journalId)
  if (!current) return
  const next: Journal = {
    ...current,
    ...patch,
    settings: patch.settings ? { ...current.settings, ...patch.settings } : current.settings,
    updatedAt: Date.now(),
    revision: current.revision + 1,
  }
  emit({ journals: snapshot.journals.map((journal) => (journal.id === journalId ? next : journal)) })
  persist(`changes to ${next.title}`, { put: { journals: [next] } })
  logActivity('info', 'journal', describe ?? `Updated “${next.title}”.`, { changed: Object.keys(patch) })
}

export function markJournalOpened(journalId: string) {
  const current = snapshot.journals.find((journal) => journal.id === journalId)
  if (!current) return
  const next = { ...current, openedAt: Date.now() }
  emit({ journals: snapshot.journals.map((journal) => (journal.id === journalId ? next : journal)) })
  persist(`opening ${next.title}`, { put: { journals: [next] } })
}

export function trashJournal(journalId: string) {
  const current = snapshot.journals.find((journal) => journal.id === journalId)
  if (!current) return
  const next = { ...current, deletedAt: Date.now(), updatedAt: Date.now(), revision: current.revision + 1 }
  emit({ journals: snapshot.journals.map((journal) => (journal.id === journalId ? next : journal)) })
  persist(`moving ${current.title} to Trash`, { put: { journals: [next] } })
  logActivity('info', 'trash', `Moved the journal “${current.title}” to Trash. Its pages can be restored with it from Settings → Trash.`)
}

export function restoreJournal(journalId: string) {
  const current = snapshot.journals.find((journal) => journal.id === journalId)
  if (!current) return
  const next = { ...current, deletedAt: null, updatedAt: Date.now(), revision: current.revision + 1 }
  emit({ journals: snapshot.journals.map((journal) => (journal.id === journalId ? next : journal)) })
  persist(`restoring ${current.title}`, { put: { journals: [next] } })
  logActivity('info', 'trash', `Restored the journal “${current.title}” from Trash.`)
}

/* ── Pages ──────────────────────────────────────────────────────────── */

export function addFolio(journalId: string, recipe: FolioRecipe, options: { afterId?: string } = {}) {
  const journal = snapshot.journals.find((candidate) => candidate.id === journalId)
  if (!journal) return null
  const at = Date.now()
  const pages = journalFolios(journalId)
  const afterIndex = options.afterId ? pages.findIndex((page) => page.id === options.afterId) : -1
  const insertAt = afterIndex >= 0 ? afterIndex + 1 : pages.length
  const folio = folioFromRecipe(journalId, recipe, insertAt, at)
  const reordered = [...pages.slice(0, insertAt), folio, ...pages.slice(insertAt)]
  const changed = reordered
    .map((page, index) => ({ page, index }))
    .filter(({ page, index }) => page.id === folio.id || page.position !== index)
    .map(({ page, index }) => (page.id === folio.id ? page : { ...page, position: index, revision: page.revision + 1 }))
  const byId = new Map(changed.map((page) => [page.id, page]))
  const touchedJournal = { ...journal, updatedAt: at, revision: journal.revision + 1 }
  emit({
    folios: [...snapshot.folios.map((page) => byId.get(page.id) ?? page), folio],
    journals: snapshot.journals.map((candidate) => (candidate.id === journalId ? touchedJournal : candidate)),
  })
  persist(`new page in ${journal.title}`, { put: { folios: changed, journals: [touchedJournal] } })
  logActivity('info', 'page', `Added the page “${folio.title}” to “${journal.title}”.`, { type: folio.type, position: insertAt + 1 })
  return folio
}

export function updateFolio(folioId: string, patch: { title?: string; content?: FolioContent }, options: { quiet?: boolean } = {}) {
  const current = snapshot.folios.find((folio) => folio.id === folioId)
  if (!current) return
  // Always later than creation, so a page written in straight away still counts as written in.
  const at = Math.max(Date.now(), current.createdAt + 1)
  const next: Folio = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.content !== undefined ? { content: patch.content } : {}),
    updatedAt: at,
    revision: current.revision + 1,
  }
  const journal = snapshot.journals.find((candidate) => candidate.id === current.journalId)
  const touchedJournal = journal ? { ...journal, updatedAt: at } : null
  emit({
    folios: snapshot.folios.map((folio) => (folio.id === folioId ? next : folio)),
    ...(touchedJournal ? { journals: snapshot.journals.map((candidate) => (candidate.id === touchedJournal.id ? touchedJournal : candidate)) } : {}),
  })
  persist(`page ${next.title}`, { put: { folios: [next], ...(touchedJournal ? { journals: [touchedJournal] } : {}) } })
  if (!options.quiet) {
    logActivity('info', 'page', patch.title !== undefined && patch.title !== current.title
      ? `Renamed the page “${current.title}” to “${next.title}”.`
      : `Saved changes to the page “${next.title}”.`)
  }
}

export function moveFolio(folioId: string, direction: -1 | 1) {
  const current = snapshot.folios.find((folio) => folio.id === folioId)
  if (!current) return
  const pages = journalFolios(current.journalId)
  const index = pages.findIndex((page) => page.id === folioId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= pages.length) return
  const reordered = [...pages]
  reordered.splice(index, 1)
  reordered.splice(target, 0, current)
  const changed = reordered
    .map((page, position) => ({ page, position }))
    .filter(({ page, position }) => page.position !== position)
    .map(({ page, position }) => ({ ...page, position, revision: page.revision + 1 }))
  const byId = new Map(changed.map((page) => [page.id, page]))
  emit({ folios: snapshot.folios.map((page) => byId.get(page.id) ?? page) })
  persist(`moving ${current.title}`, { put: { folios: changed } })
  logActivity('info', 'page', `Moved the page “${current.title}” ${direction < 0 ? 'earlier' : 'later'} (now page ${target + 1}).`)
}

export function trashFolio(folioId: string) {
  const current = snapshot.folios.find((folio) => folio.id === folioId)
  if (!current) return
  const next = { ...current, deletedAt: Date.now(), revision: current.revision + 1 }
  emit({ folios: snapshot.folios.map((folio) => (folio.id === folioId ? next : folio)) })
  persist(`moving ${current.title} to Trash`, { put: { folios: [next] } })
  logActivity('info', 'trash', `Moved the page “${current.title}” to Trash.`)
}

export function restoreFolio(folioId: string) {
  const current = snapshot.folios.find((folio) => folio.id === folioId)
  if (!current) return
  const siblings = journalFolios(current.journalId)
  const next = { ...current, deletedAt: null, position: siblings.length, revision: current.revision + 1 }
  emit({ folios: snapshot.folios.map((folio) => (folio.id === folioId ? next : folio)) })
  persist(`restoring ${current.title}`, { put: { folios: [next] } })
  logActivity('info', 'trash', `Restored the page “${current.title}” to the end of its journal.`)
}

/* ── Permanent deletion ─────────────────────────────────────────────── */

function imageIdsIn(node: RichNode | undefined, out: Set<string>) {
  if (!node) return
  const src = node.attrs?.src
  if (node.type === 'journalImage' && typeof src === 'string' && src.startsWith(IMAGE_PREFIX)) {
    out.add(src.slice(IMAGE_PREFIX.length))
  }
  node.content?.forEach((child) => imageIdsIn(child, out))
}

function imagesUsedBy(folios: Folio[]) {
  const ids = new Set<string>()
  folios.forEach((folio) => imageIdsIn(folio.content.doc, ids))
  return ids
}

function forget(journalIds: string[], folioIds: string[], label: string) {
  const journalSet = new Set(journalIds)
  const folioSet = new Set(folioIds)
  const removedFolios = snapshot.folios.filter((folio) => folioSet.has(folio.id) || journalSet.has(folio.journalId))
  const keptFolios = snapshot.folios.filter((folio) => !folioSet.has(folio.id) && !journalSet.has(folio.journalId))
  const stillUsed = imagesUsedBy(keptFolios)
  const orphanImages = [...imagesUsedBy(removedFolios)].filter((id) => !stillUsed.has(id))
  orphanImages.forEach(releaseImageUrl)
  emit({
    journals: snapshot.journals.filter((journal) => !journalSet.has(journal.id)),
    folios: keptFolios,
  })
  persist(label, {
    remove: {
      journals: journalIds,
      folios: removedFolios.map((folio) => folio.id),
      images: orphanImages,
    },
  })
  return { pages: removedFolios.length, photos: orphanImages.length }
}

export function deleteJournalForever(journalId: string) {
  const journal = snapshot.journals.find((candidate) => candidate.id === journalId)
  if (!journal) return
  const removed = forget([journalId], [], `deleting ${journal.title}`)
  logActivity('warn', 'trash', `Permanently deleted the journal “${journal.title}” (${removed.pages} pages, ${removed.photos} photos). This cannot be undone.`)
}

export function deleteFolioForever(folioId: string) {
  const folio = snapshot.folios.find((candidate) => candidate.id === folioId)
  if (!folio) return
  const removed = forget([], [folioId], `deleting ${folio.title}`)
  logActivity('warn', 'trash', `Permanently deleted the page “${folio.title}” (${removed.photos} photos). This cannot be undone.`)
}

export function emptyTrash() {
  const journalIds = snapshot.journals.filter((journal) => journal.deletedAt).map((journal) => journal.id)
  const folioIds = snapshot.folios.filter((folio) => folio.deletedAt).map((folio) => folio.id)
  if (!journalIds.length && !folioIds.length) return
  const removed = forget(journalIds, folioIds, 'emptying Trash')
  logActivity('warn', 'trash', `Emptied Trash: ${journalIds.length} journals and ${removed.pages} pages permanently deleted.`)
}

/* ── Photos ─────────────────────────────────────────────────────────── */

export const IMAGE_PREFIX = 'bzimg:'
const imageUrls = new Map<string, string>()

export async function saveImage(image: Omit<StoredImage, 'id' | 'createdAt'>) {
  const stored: StoredImage = { ...image, id: makeId(), createdAt: Date.now() }
  await writeBatch({ put: { images: [stored] } })
  imageUrls.set(stored.id, URL.createObjectURL(stored.blob))
  logActivity('info', 'photo', `Saved a ${image.width}×${image.height} photo on this phone (${Math.round(image.blob.size / 1024)} KB).`)
  return `${IMAGE_PREFIX}${stored.id}`
}

export async function resolveImageSrc(src: string | null | undefined) {
  if (!src) return null
  if (!src.startsWith(IMAGE_PREFIX)) return /^(https?:|data:|blob:)/.test(src) ? src : null
  const id = src.slice(IMAGE_PREFIX.length)
  const cached = imageUrls.get(id)
  if (cached) return cached
  try {
    const stored = await readOne<StoredImage>('images', id)
    if (!stored) return null
    const url = URL.createObjectURL(stored.blob)
    imageUrls.set(id, url)
    return url
  } catch (error) {
    logActivity('error', 'photo', `A photo could not be loaded from this phone: ${errorText(error)}`)
    return null
  }
}

/* A photo that was taken but never placed on a page (the capture sheet was
   cancelled) is removed again so it doesn't take up space. */
export function discardImage(src: string) {
  if (!src.startsWith(IMAGE_PREFIX)) return
  const id = src.slice(IMAGE_PREFIX.length)
  releaseImageUrl(id)
  writeBatch({ remove: { images: [id] } }).catch(() => {})
  logActivity('info', 'photo', 'Removed a photo that was not added to any page.')
}

function releaseImageUrl(id: string) {
  const url = imageUrls.get(id)
  if (url) URL.revokeObjectURL(url)
  imageUrls.delete(id)
}

/* ── Backup ─────────────────────────────────────────────────────────── */

interface BackupFile {
  app: 'briizos-mobile-journals'
  version: 1
  exportedAt: number
  journals: Journal[]
  folios: Folio[]
  images: { id: string; type: string; width: number; height: number; createdAt: number; dataUrl: string }[]
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('A photo could not be read.'))
    reader.readAsDataURL(blob)
  })
}

export async function exportBackup() {
  const images = await readAll<StoredImage>('images')
  const backup: BackupFile = {
    app: 'briizos-mobile-journals',
    version: 1,
    exportedAt: Date.now(),
    journals: snapshot.journals,
    folios: snapshot.folios,
    images: await Promise.all(images.map(async (image) => ({
      id: image.id,
      type: image.type,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      dataUrl: await blobToDataUrl(image.blob),
    }))),
  }
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  logActivity('info', 'backup', `Made a backup file: ${backup.journals.length} journals, ${backup.folios.length} pages, ${backup.images.length} photos (${Math.round(blob.size / 1024)} KB).`)
  return blob
}

export async function importBackup(file: File) {
  const parsed = JSON.parse(await file.text()) as Partial<BackupFile>
  if (parsed.app !== 'briizos-mobile-journals' || !Array.isArray(parsed.journals) || !Array.isArray(parsed.folios)) {
    throw new Error('This file is not a briizOS journals backup.')
  }
  const newer = <T extends { id: string; updatedAt: number }>(incoming: T[], existing: T[]) => {
    const byId = new Map(existing.map((item) => [item.id, item]))
    return incoming.filter((item) => {
      const current = byId.get(item.id)
      return !current || item.updatedAt > current.updatedAt
    })
  }
  const journals = newer(parsed.journals, snapshot.journals)
  const folios = newer(parsed.folios, snapshot.folios)
  const images: StoredImage[] = []
  for (const image of parsed.images ?? []) {
    const existing = await readOne<StoredImage>('images', image.id)
    if (existing) continue
    const blob = await (await fetch(image.dataUrl)).blob()
    images.push({ id: image.id, blob, type: image.type, width: image.width, height: image.height, createdAt: image.createdAt })
  }
  await writeBatch({ put: { journals, folios, images } })
  const journalIds = new Set(journals.map((journal) => journal.id))
  const folioIds = new Set(folios.map((folio) => folio.id))
  emit({
    journals: [...snapshot.journals.filter((journal) => !journalIds.has(journal.id)), ...journals],
    folios: [...snapshot.folios.filter((folio) => !folioIds.has(folio.id)), ...folios],
  })
  logActivity('info', 'backup', `Restored from a backup: ${journals.length} journals, ${folios.length} pages and ${images.length} photos were added or replaced by newer copies. Anything already newer on this phone was kept.`)
  return { journals: journals.length, folios: folios.length, images: images.length }
}

export function clearActivity() {
  const ids = snapshot.activity.map((entry) => entry.id)
  emit({ activity: [] })
  writeBatch({ remove: { activity: ids } }).catch(() => {})
}
