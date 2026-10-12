# briizOS desktop → mobile porting plan

October 12, 2026 · Planning document for porting **briizOS.Local** (desktop, repository `axgoodhart/briizos-local`, commit `91b0450`) onto **briizOS Mobile** (repository `axgoodhart/briizos-mobile`, commit `586ed08`).

## How to read this document

- **Evidence standard.** Every finding cites a repository-relative path and line, in the form `local:path:line` (briizos-local) or `mobile:path:line` (briizos-mobile). Findings come from reading source, configuration, manifests and documentation. No server, build, lint, test, or app launch was run, following both the task instructions and `local:AGENTS.md:117-118`.
- **Three kinds of statement are kept apart:**
  - **Existing**: what the code does today.
  - **Proposed**: work this plan recommends. It is always written as a recommendation or as a phase step.
  - **Undetermined**: something the repositories cannot settle. These are flagged with **⚠ Undetermined**, and each one has a decision or verification step attached.
- **Repository instructions.** `local:AGENTS.md` was read and applies to all desktop work. `local:CLAUDE.md` is a macOS Finder bookmark (binary alias data) that points to that AGENTS.md, so it adds no rules of its own. **The mobile repository has no AGENTS.md** (no file anywhere in its tree). This plan treats the desktop rules as the owner's standing preferences and recommends adopting them for mobile explicitly (decision **D12**), not silently.
- **Tension with AGENTS.md, stated once.** `local:AGENTS.md:33-35` says "There is no v1 … Requests need to be achieved in full." This task asks for a *smallest useful first release*. The plan reconciles the two like this: releases are an **ordering** of complete capabilities, not reduced-quality drafts. Every phase ships finished behavior with loading, empty, error, offline and saved states. No phase ships a placeholder Save/Download/privacy control. Capabilities that are not ready are **absent and listed as deferred**, not shown half-working.

## Summary of recommendations

1. **Keep the mobile app's existing stack.** That is React 19 + TypeScript + Vite, running in the phone's browser engine. Deliver it as an **installed Home Screen web app** hosted on Firebase Hosting in the same Firebase project both apps already use. Do not rewrite it in Swift, React Native or Flutter. A Capacitor wrapper stays available later for share-sheet, widget and native-notification work (decision **D1**).
2. **Do not port the desktop's runtime to the phone.** That runtime is Electron, SQLite, the LangGraph agent, the Swift capture helper, and file-system tools. Port the **data model, the workflows and the UI**. Mac-only execution reaches the phone through the remote-command pipeline the desktop already has but no client uses (`local:electron/cloud-gateway.js:199-254`).
3. **Make data agreement the foundation, not the last step.** Every mobile workflow worth having depends on seeing the same tasks, notes, events and journals as the Mac. Today mobile reads and writes legacy Firestore collections that the desktop no longer touches (details in §4.1). This plan therefore schedules synchronization in Phases 1–4, ahead of most UI work. That reverses the September 13 audit's "reconnect Firebase at the end" sequencing (`local:docs/local-mobile-feature-audit-2026-09-13.md:7`), and that audit records the reverse as an owner-confirmed assumption. So this is decision **D2**, with the consequences of each choice spelled out.
4. **Sync design:** the desktop SQLite database stays **authoritative**. Firestore becomes the **relay and the phone's offline replica**. The Mac publishes canonical per-record documents. The phone submits idempotent **mutation** documents, and the Mac applies them using its existing revision checks. This reuses the desktop's revision columns, soft deletes, idempotency keys, operation receipts, device identity and primary-device lease (§4).
5. **Share contracts, not components.** Create one versioned JSON sync contract in briizos-local (`shared/sync-contract/v1.json`), plus golden fixtures. Vendor a checksummed copy into mobile, with a check script. UI code and CSS stay separate per platform (§1.5).
6. **Smallest useful first release (Release 1)** (§5.2):
   - sign in;
   - live, offline-capable view and edit of desktop **tasks + steps, notes, events, and calendar placements**;
   - honest Mac freshness/pending status;
   - **"Ask my Mac"** remote runs with status;
   - phone chats that survive navigation;
   - an on-phone activity log.
   Journals follow in Release 2. Notefalls, canvases, settings mirrors and tablet layouts follow in Release 3.

---

# 1. Code translation overview

## 1.1 What the desktop application actually does (existing)

briizOS.Local is a macOS Electron 40 app (`local:package.json:5,39`) run from `npm run dev` (`local:package.json:7`). It has no packaging pipeline (`local:docs/shipping-debt.md:58-66`). It is a dense, multi-panel personal workspace with an in-process AI agent.

**Process layout (existing):**

| Layer | What it is | Evidence |
|---|---|---|
| Main process | Owns the SQLite database (`better-sqlite3`, WAL, migrations with checksums), secrets (Electron `safeStorage`), the LangGraph.js agent, the automation runner, the cloud gateway, the briizy screen-memory runtime, file-system/terminal tools, GitHub/Drive integrations | `local:electron/main.js:1109-1188`, `local:electron/local-data-service.js:212-292` |
| Preload bridge | `window.api` (≈250 methods), `window.briizy`. **This is the platform seam.** Renderer features talk only to it. | `local:electron/preload.js:132-513`, `local:electron/preload.js:26-120` |
| Renderer | React 18.3 app: tiled panels + floating windows + overlays, one CSS monolith with theme sections | `local:src/App.jsx:325`, `local:src/main.jsx:1-17`, `local:docs/theme-authoring.md:1-12` |
| Native helper | Swift capture/OCR helper for briizy "work memory" (ScreenCaptureKit), built at `postinstall` | `local:package.json:9-10`, `local:electron/briizy-helper/BriizyHelper.swift`, `local:electron/briizy/README.md:1-40` |

**User-facing capabilities (existing).** The dock launches these (`local:src/App.jsx:691-729`); keyboard shortcuts open them too (`local:src/App.jsx:1210-1229`).

| Capability | What the user does | Main source |
|---|---|---|
| **Chat (Interaction panel)** | Streamed agent chat with model picker, modes (Day/Chat/Research/Code/Report), files dragged in from Sources as context, tool-approval cards, searchable/taggable conversation browser | `local:src/components/InteractionPanel.jsx:26-33,273-292,935-964,1230-1270`, `local:src/hooks/useChat.js:1-24`, `local:src/components/ConversationBrowser.jsx` |
| **Agent + tools** | In-process LangGraph lead agent; tools for notes/tasks/events/placements/projects, files, bash, screen memory, online lookup; permission modes ask-always / ask-destructive / no-asking | `local:electron/agent/tools.js:288-1493`, `local:docs/ai-capabilities.md:39-64` |
| **Tasks** | Tasks with steps ("decks"), AI Deck Maker, Briizify day plan ("Priorifact"), "automate" a task (headless agent run) | `local:src/components/TasksPanel.jsx:26-139,435-497`, `local:src/hooks/useBriizify.js:1-12`, `local:src/hooks/useTaskAutomation.js:1-35` |
| **Calendar + placements** | Month grid, day timeline, quick-add events, schedule tasks as (recurring) placements, AI day planner | `local:src/components/overlays/CalendarModal.jsx:199-229`, `local:src/components/calendar/DayTimeline.jsx:57-95`, `local:electron/local-data/schema/008_calendar_placements.sql`, `local:src/lib/dayPlanner.js` |
| **Organizer** | Unified list of notes/events/timers/projects | `local:src/components/overlays/OrganizerModal.jsx:8-60`, `local:src/context/OrganizerContext.jsx` |
| **Notes widget** | Sticky notes in a drawer or torn off as floating, colored, resizable cards | `local:src/components/notes/NotesWidget.jsx`, `local:electron/local-data-service.js:1682-1812` |
| **Journals** | Shelf of journals with covers/page styles, folio types (notes rich text, todo, prompts, tracker, dashboard), templates, trash; **Execubriiz** AI journaling mode with a live board | `local:src/components/journals/*`, `local:docs/execubriiz.md`, `local:electron/execubriiz/*` |
| **Notefalls** | Timeline of posts (manual or briizy auto-capture sessions with screenshots), linked to journals | `local:src/components/notefalls/api.js:1-30`, `local:electron/local-data/schema/003_forest_recorder.sql:5-15` |
| **Canvases** | Saved HTML/URL canvases (AI-made or user-made) shown as tiles/floats/widgets | `local:electron/main.js:642-686`, `local:src/hooks/useCanvases.js` |
| **Sources** | Browse Mac/iCloud/USB/GitHub/Drive files, select files for chat, activity/log viewer | `local:src/components/SourcesPanel.jsx`, `local:electron/filesystem.js`, `local:electron/github.js`, `local:electron/gdrive.js` |
| **Media** | Local audio/video queue player | `local:src/components/MediaPanel.jsx`, schema `media_queue_items`/`media_state` |
| **Forest** | Project/file board with Spotlight-backed File Hunter, FileHawk watching, AI auto-tags | `local:src/components/forest/app.js`, `local:electron/forest-fs.js`, `local:electron/forest-ai.js`, `local:docs/interface-functionality-september-2026.md:61-83` |
| **briizy** | Desktop avatar overlay window, quick chat, screen-memory capture (Rewind/OCR), proposals, goals | `local:electron/briizy/*`, `local:electron/rewind/*`, `local:src/briizy/BriizyShell.jsx` |
| **briiZtorm** | Full-screen 3D project visualization (iframe app) | `local:src/components/overlays/BriiztormOverlay.jsx`, `local:public/apps/briiztorm/` |
| **Settings (Dashboard)** | Model, AI routing, briizy, Appearance, Integrations, Memory, Permissions, Health; account; primary-device control | `local:src/components/overlays/DashboardOverlay.jsx:390-440,1558-1565` |
| **Theme Studio / Chromap** | Live theme editing over the master stylesheet | `local:src/components/theme-studio/*`, `local:src/theme/*` |
| **Log Panel / AI visibility** | Every action logged to SQLite and shown; AI request/response audit timeline | `local:src/lib/logger.js:1-17`, `local:electron/logger.js`, `local:src/components/overlays/AIVisibilityModal.jsx`, schema `011_ai_turn_audit.sql` |
| **Account** | Firebase email/password login is required before the workspace is usable (overlay); the login hands an ID token to the cloud gateway | `local:src/components/LoginOverlay.jsx:79-97`, `local:src/context/AuthContext.jsx:78-116`, `local:src/App.jsx:1707,1733` |

**Desktop data storage (existing).** All structured state lives in `~/Library/Application Support/briizos/briizos.db` (`local:electron/main.js:1135-1140`). The schema has 16 migrations (`local:electron/local-data/schema/`); numbers 007 and 013 are absent from the sequence. Every user-data row carries `revision` and a soft-delete `deleted_at`. Writes go through one transaction helper that bumps a per-domain revision, enqueues continuity domains in `sync_outbox` and emits `changed` (`local:electron/local-data-service.js:1103-1143`). Updates require the caller's `expectedRevision`; a mismatch raises `REVISION_CONFLICT` (`local:electron/local-data-service.js:1145-1153`). IDs are `crypto.randomUUID()` (`local:electron/local-data-service.js:85-87`).

## 1.2 What the mobile application already has (existing)

Mobile is a Vite 7 + React 19 + TypeScript browser app (`mobile:package.json:6-12,63-65,82`). Kimi's generator produced it from a shadcn template: `mobile:info.md:1-12` and the `kimi-plugin-inspect-react` plugin (`mobile:vite.config.ts:4,9`). No native wrapper, PWA manifest, service worker or hosting configuration exists. **⚠ Undetermined:** where, or whether, it is deployed today.

| Area | Status | Evidence |
|---|---|---|
| Shell | **Wired.** Single-view navigation with an 8-item bottom bar. A `tabs` array is maintained but never rendered. | `mobile:src/App.tsx:22-91`, `mobile:src/components/BottomNav.tsx:10-18` |
| Account | **Wired.** Firebase email/password sign-in/up/out ("Use the same login as Web"). | `mobile:src/components/AccountControls.tsx:19-118`, `mobile:src/services/mobileSyncService.ts:145-160` |
| Data sync | **Wired, to the wrong collections for desktop.** Live listeners on `users/{uid}/panels`, `tasks`, `events`, `organizer`, `app/minStack`, `app/timer`. These are the legacy Web/SyncContract paths, not the desktop's. | `mobile:src/services/mobileSyncService.ts:256-267,314-334` |
| Records editor ("Files") | **Wired.** Search/sort, create/edit/complete/archive/delete organizer items, tasks and events, with a destructive-action gate. | `mobile:src/views/FilesView.tsx:137-460`, `mobile:src/lib/confirmDestructiveAction.ts:1-4` |
| Chat | **Wired but fragile.** Direct browser calls to Gemini/OpenAI/Claude with keys in `localStorage`; a JSON-block tool protocol with confirmation queue. The transcript lives in component state, so it is lost on navigation. | `mobile:src/services/chatApi.ts:166-268`, `mobile:src/services/chatSettings.ts:104-177`, `mobile:src/views/ChatsView.tsx:104-108` |
| Mobile tools | **Wired** for the legacy collections: schedule summary, note search, conflicts, create note/task/event, complete task, move event. | `mobile:src/services/mobileToolRegistry.ts:23-97` |
| Journals | **Wired, device-only.** Library, templates, covers, notes/todo/prompts/tracker editors, sheets with accessible labels. The whole shelf is saved to `localStorage` on every change; delete is a hard delete. | `mobile:src/features/journals/journalStore.ts:208-250`, `mobile:src/views/JournalsView.tsx:877-960` |
| Home | **Placeholder.** Composer with hard-coded models; Send has no handler. | `mobile:src/views/HomeView.tsx:4-79` |
| Automations, Space, Skills | **Placeholder.** Local state only, static sample data, unwired buttons. | `mobile:src/views/AutomationsView.tsx:4-117`, `mobile:src/views/SpaceView.tsx:4-68`, `mobile:src/views/SkillsView.tsx:13-94` |
| Settings | **Unrouted placeholder.** Menu's "Settings" opens Chats. | `mobile:src/views/SettingsView.tsx:8-60`, `mobile:src/views/MenuView.tsx:85-97` |
| Status strip | **Wired**, but "Live" means "Firestore listeners attached". It says nothing about whether the Mac is reachable. | `mobile:src/components/SyncStatusStrip.tsx:8-15` |

**Defects visible in source (existing, not executed):**

- `mobile:src/components/BottomNav.tsx:2` and `mobile:src/views/MenuView.tsx:2` import `type { ViewId } from '.App'`. That module path does not exist. Vite's dev server strips type-only imports, so the dev server likely still runs. But `npm run build` runs `tsc -b` first (`mobile:package.json:8`), so that type-check step will fail on the bad path.
- `mobile:index.html:5` sets `width=device-width, initial-scale=1.0` without `viewport-fit=cover`. iOS therefore reports zero safe-area insets, and the existing `env(safe-area-inset-*)` rules (`mobile:src/App.css:2871,2984,3561`, `mobile:src/views/JournalsView.css:121,234,788`) have no effect.
- Firestore is created with `getFirestore` and no persistent cache (`mobile:src/services/firebaseClient.ts:27-29`). It uses only the memory cache, so data is not readable offline after a reload.
- Stray files:
  - `mobile:src/views/merger.py`: a Python PDF/CSV merger unrelated to the app.
  - `mobile:src/pages/Home.tsx`: the unused Vite counter template.
  - `mobile:src/components/AddressBar.tsx`: an empty file.
  - About 50 unused shadcn components under `mobile:src/components/ui/`.
- `mobile:src/services/chatSettings.ts:24-39` lists models that the desktop has retired or never offered (for example `gemini-2.0-flash-exp`, compared with `local:electron/built-in-models.js:36-44`).

## 1.3 Architecture mapping: how desktop code lands on mobile

The desktop's own architecture makes the port tractable. Renderer features reach the platform only through `window.api`, and their data hooks only re-query on `localData.onChanged` (for example `local:src/hooks/useTasks.js:13-30`). Mobile therefore needs a **platform adapter with the same intent-level methods** (list/create/update/archive with `expectedRevision`, plus `onChanged`). It does not need the desktop's view components.

```
Desktop (existing)                         Mobile (proposed)
──────────────────                         ─────────────────
React view ─► hook ─► window.api ─IPC─►    React view ─► hook ─► briizApi (adapter)
   LocalDataService (SQLite, authority)        ├─ reads: Firestore canonical records (offline cache)
        │ changed                              └─ writes: Firestore mutation docs (queued offline)
        ▼                                               │
   SyncPublisher / MutationApplier  ◄──── Firestore ────┘
   (new, inside CloudGateway)            (relay + replica)
```

The mobile adapter is the only module allowed to know Firestore paths. Views and hooks call `briizApi.tasks.update(id, expectedRevision, patch)` exactly as desktop hooks call `window.api.localData.tasks.update(...)` (`local:electron/preload.js:181-190`). Code written against these signatures stays recognizable in both repositories.

## 1.4 Capability and dependency mapping

Legend: **Direct** = transfers as-is · **Adapt** = transfers after adaptation or behind the platform adapter · **Replace** = rewrite for mobile · **Blocked/⚠** = cannot be ported as-is, or depends on an undetermined fact.

### Application logic and data

| Concern | Desktop implementation | Mobile today | Transfer | Notes |
|---|---|---|---|---|
| Task/step model, statuses, priorities | `local:electron/local-data-service.js:13-17,1155-1545`, schema `local:…/001_initial.sql:73-102` | `BriizTask` with string `dueDate`, `priority:'medium'`, `status:'archived'` (`mobile:src/types/briizos.ts:12-25`, `mobile:src/views/FilesView.tsx:529`) | **Adapt** | Desktop rejects `archived` (not in `TASK_STATUSES`). Its default priority is `normal`, and it stores `due_at` as ms. The contract (§1.5) fixes these values. Mobile "archive" becomes a soft delete. |
| Organizer items (note/project/event/timer) | `local:electron/local-data-service.js:1545-1680`, schema `:40-58` | Separate `organizer` and `events` collections, with an `allDay` flag (`mobile:src/types/briizos.ts:27-72`) | **Adapt** | Desktop events are organizer rows `type:'event'` with absolute ms start/end. Desktop has **no all-day concept** (quick-add defaults to 9:00, `local:src/components/overlays/CalendarModal.jsx:201-213`). The contract adds one (migration 017). |
| Legacy-shape mapping | `OrganizerContext.mapItem` converts SQLite rows to the legacy Web shape (`scheduledDate`, `start` minutes) (`local:src/context/OrganizerContext.jsx:16-37`) | Mobile views consume that same legacy shape | **Direct** (logic) | Port `mapItem` as a pure function into the mobile adapter, so FilesView/tools keep their field names during transition. |
| Calendar placements (scheduled task sessions, recurrence, per-occurrence completion) | `local:electron/local-data-service.js:1309-1490,4200-4264`, schema 008 | None | **Adapt** | Recurrence expansion (`_placementOccursOnDate`) is pure date math. Port it into a shared-fixture-tested mobile function. |
| Sticky notes (note + panel geometry) | `local:electron/local-data-service.js:1682-1812` | `panels` collection with `ui.web/local` geometry (`mobile:src/services/syncAdapters.ts:230-322`) | **Replace** geometry, **Direct** content | Geometry is desktop-only. Mobile syncs note content and color (`style_json.color`) only. |
| Journals + folios | `local:electron/local-data-service.js:1890-2087`; notes folios store **TipTap JSON in `content.doc`** (`local:src/components/journals/richtext.jsx:14-21`) | `localStorage` shelf; notes folios store plain `content.body` (`mobile:src/views/JournalsView.tsx:507-518`) | **Adapt** | Mobile must read and write `content.doc` with the same TipTap major version. Otherwise it would silently drop desktop formatting. Mobile timestamps are ISO strings; desktop uses ms. |
| Journal templates/covers/pages | `local:src/components/journals/templates.js:27-320` (blank, health-goal, idea-incubator, finances, new-skill, meandering, execubriiz) | `mobile:src/features/journals/journalStore.ts:1-206` (blank, idea-incubator, daily-pages, project-log) | **Direct** (move to shared JSON) | The two sets overlap and diverge, which is duplication with conflicts. Merge them into `shared/journal-templates.v1.json`. |
| Execubriiz board, AI workers | `local:electron/execubriiz/*`, schema 016 | None | **Blocked** for AI work (runs only while the Mac app runs, `local:docs/execubriiz.md:42-43`) · **Adapt** for entry capture | Phone can submit entries later; the Mac processes them (Phase 9). |
| Threads/messages | `local:electron/local-data-service.js:2552-3010`, schema `:295-320`, tags 015 | Component state (`mobile:src/views/ChatsView.tsx:104-108`) | **Adapt** | Persist mobile transcripts locally (IndexedDB) first, then sync as threads (Phase 6). |
| Remote commands/runs | `acceptCommand` idempotency (`local:electron/local-data-service.js:3726-3758`), runs/events (`:3760-3844`), gateway poll/publish (`local:electron/cloud-gateway.js:199-254`), runner (`local:electron/automation-runner.js:136-241`) | None | **Direct** (contract already exists) | Mobile writes `users/{uid}/briizosLocalCommands/{id}` with `schemaVersion:1, kind:'execute_task', targetDeviceId, idempotencyKey, instruction, contextText, requestedAt, expiresAt`, then reads `briizosLocalRuns/{runId}`. |
| Device identity / primary Mac | `device_identity`, heartbeat + 3-minute lease (`local:electron/cloud-gateway.js:162-197`) | None | **Direct** | Mobile reads `briizosLocalDevices/*` and `briizosLocalControl/primaryDevice` for Mac status. |
| Continuity snapshots | Chunked whole-domain JSON for tasks/organizer/retainedText, restore only into an empty DB (`local:electron/cloud-gateway.js:262-345`, `local:electron/local-data-service.js:4006-4068`) | None | **Keep on desktop** | Snapshots remain the desktop's disaster-recovery path. They are not suitable for phone editing: whole-domain, no per-record identity on the wire, restore-only-when-empty. |
| Shared text projection/mirrors | Publishes local items to `sharedText/briizos.local/items`; stores other apps' items read-only (`local:electron/cloud-gateway.js:304-310`, `local:electron/local-data-service.js:4081-4133`) | None | **Superseded** for mobile by §4. Keep for Web. | |
| Legacy Firestore helpers | `local:src/lib/firestore.js` (2,270 lines), `syncAdapters.js`, `briizSyncCore.js`. **Dead code:** `firestore.js:35` imports `db` from `firebase.js`, which never exports it (`local:src/lib/firebase.js:113`), and its only importer `useAgentWorkers` is unused. | Ported copies: `mobile:src/services/briizSyncCore.ts`, `syncAdapters.ts` | **Retire both** | Duplicated implementations of a contract neither app should use for desktop data. Mobile keeps its copy only for the one-time legacy import (Phase 4). |
| Model catalog | `local:electron/built-in-models.js:1-44`, `model_profiles` table | `mobile:src/services/chatSettings.ts:24-39` | **Direct** (shared JSON) | One list, so the phone stops offering retired IDs. |
| Agent (LangGraph, tools, memory, skills) | `local:electron/agent/*` with Node-only dependencies (`better-sqlite3` checkpointer, fs, bash) | Simple direct-provider loop | **Blocked** on phone · **Adapt** via "Ask my Mac" | The agent's tools execute through the desktop renderer's tool registry (`local:electron/main.js:822-835`). It cannot run headless on a phone. |

### UI and state management

| Concern | Desktop | Mobile | Transfer |
|---|---|---|---|
| View components | React 18.3 JSX, react-dnd, react-resizable-panels, a Preact-style Forest island, TipTap core | React 19.2 TSX, Radix/shadcn primitives, lucide icons | **Replace.** Desktop components assume pointer, hover, panels and a 1500×700 window (`local:electron/main.js:210-227`). |
| State | Per-feature hooks that re-query after `localData.onChanged` (`local:src/hooks/useTasks.js:24-30`), context providers (`local:src/App.jsx:1733-1741`) | One sync service singleton pushing whole state (`mobile:src/hooks/useBriizOSSync.ts`) | **Adapt.** Mirror the desktop pattern: per-domain hooks over the adapter's `onChanged`. |
| Styling | One CSS monolith with `:root[data-theme]` sections (`local:AGENTS.md:24-26`, `local:docs/theme-authoring.md`) | `mobile:src/App.css` (4,617 lines, generated by a style-extraction tool; see `mobile:extract-mappings.json`), Tailwind, inline gradients in TSX (`mobile:src/components/BottomNav.tsx:37-41`) | **Adapt** (decision **D9**). Keep mobile's monolith; move inline appearance values into it, per the desktop rule. |
| Icons | SF Symbols glyph characters via SF Pro fonts (`local:src/AppCombined.css:1243`, `local:src/components/ConversationBrowser.jsx:5-10`) | lucide SVG | ⚠ **Decision D8.** Apple licenses SF Symbols as system-provided images for Apple platforms, and the SF fonts for Apple-platform use ([Apple HIG/forum discussion](https://developer.apple.com/forums/thread/757407), [SF font license discussion](https://developer.apple.com/forums/thread/733267)). Whether the private-use glyphs render in iOS Safari from the system font is **unverified**. |
| Logging (Hard Rule 1) | `local:src/lib/logger.js` → SQLite + Log Panel | None | **Adapt.** Port the logger's entry shape and category map; persist to IndexedDB; add an Activity view (Phase 0). |

### Persistence, files, networking, auth, integrations, build

| Concern | Desktop | Mobile | Transfer |
|---|---|---|---|
| Structured storage | SQLite via better-sqlite3 12 (native module rebuilt for Electron, `local:package.json:9`) | Firestore memory cache + `localStorage` | **Replace.** Firestore `persistentLocalCache` (IndexedDB) for synced records; IndexedDB for device-only data (drafts, transcripts, logs). Firestore documents persistent web caching for Chrome, Safari and Firefox ([Firebase offline docs](https://firebase.google.com/docs/firestore/manage-data/enable-offline)). |
| Secrets | `safeStorage`-encrypted `secrets` table (`local:electron/local-data-service.js:4302-4343`) | Plain `localStorage` keys (`mobile:src/services/chatSettings.ts:152-177`) | **Adapt** (decision **D7**). Never sync Mac secrets to the phone. Phone keys stay device-local, with a visible "stored on this phone" label. |
| File access | Full Mac file system, iCloud, USB, Spotlight (`local:electron/filesystem.js`, `local:electron/forest-fs.js`) | Browser file input only | **Blocked** for Mac paths. Phone gets its own camera/photo/file picker for new attachments (Phase 9); Mac files are reachable only through "Ask my Mac". |
| Attachments | `external_files.path` (absolute Mac paths), `post_attachments` (schema `:173-262`) | None | **Blocked/⚠.** Paths are meaningless on the phone. Binary transfer needs Cloud Storage, which needs the Blaze plan for new default buckets ([Firebase storage FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)). Decision **D10**. |
| Networking: AI | Main process via LangChain providers + Codex CLI (`local:package.json:16-20`, `local:electron/codex-provider.js`) | Browser `fetch` to provider APIs (`mobile:src/services/chatApi.ts:166-239`; Claude uses `anthropic-dangerous-direct-browser-access`, `:224`) | **Keep mobile's path** for phone-only chat. Mac capabilities go through remote runs. |
| Networking: sync | Firestore REST with the user's ID token, 15 s polling (`local:electron/cloud-gateway.js:3-8,124-160`) | Firebase JS SDK listeners | **Direct** on both sides; extend. |
| Auth | Firebase email/password; config from `VITE_FIREBASE_*` env (`local:src/lib/firebase.js:16-23`); the ID token goes to main on every refresh (`local:src/context/AuthContext.jsx:79-95`); the gateway refuses silent rebinding to a different uid (`local:electron/cloud-gateway.js:77-90`) | Firebase email/password, hard-coded project `briizos` (`mobile:src/services/firebaseClient.ts:11-19`) | **Direct**, ⚠ **D4**: the desktop project ID lives in a git-ignored `.env` (`local:.gitignore:5`). The desktop CSP references `dex--briizos.us-central1.hosted.app` and `*.web.app` (`local:electron/main.js:203-204`), which suggests the same project, but this is unconfirmed. |
| System integrations | macOS dock presence, context menu, webviews, Screen Recording/Accessibility via the helper, geolocation via a Google key (`local:electron/main.js:22-38,216-252`) | None | **Replace** with phone equivalents only where §3 justifies them. |
| Build tooling | Vite 6 + `@vitejs/plugin-react` 4, Electron run via `concurrently` (`local:package.json:7,64-71`), `.nvmrc` = Node 24 | Vite 7 + plugin-react 5, `tsc -b`, ESLint 9 (`mobile:package.json:7-10,63-82`); generator notes say Node 20 (`mobile:info.md:1`) | **Independent.** Pin mobile to Node 24 to match the desktop `.nvmrc`. Capacitor 8 (if chosen) needs Node ≥ 22 and Xcode ≥ 26 ([Capacitor support policy](https://capacitorjs.com/docs/main/reference/support-policy)). |

### Dependency compatibility at the version level

| Dependency | Desktop | Mobile | Impact on the port |
|---|---|---|---|
| React | `^18.3.1` | `^19.2.0` | Desktop components are not drop-in on mobile (`react-dnd@16` and the desktop `react-three` stack target React 18). Shared code must be **framework-free**. |
| Firebase JS SDK | `^12.8.0` | `^12.14.0` | Same major. Align both to the same minor when touching auth/Firestore, so behavior differences are not version noise. |
| zod | `^4.4.3` | `^4.3.5` | Same major. Mobile can validate incoming records with zod generated from the contract. The desktop main process uses its own `validation.js`, which stays. |
| TipTap | `@tiptap/core` etc. `^2.14.0` (no React bindings) | none | Add the **same 2.x line** to mobile for journal rich text. Framework-agnostic core works inside React 19 with a thin wrapper. Do not take TipTap 3 on one side only. |
| better-sqlite3, sqlite-vec, Electron, `@huggingface/transformers`, face-api.js, LangChain/LangGraph | desktop only | — | Node/Electron or heavy native/model dependencies. **Not ported.** |
| Tailwind 3 / shadcn / Radix | — | mobile only | Fine to keep. Remove unused UI kit files during Phase 0 hygiene (decision **D12** covers the style rules). |

## 1.5 Shared code, types and schemas: boundaries and maintenance

**Principle:** share **data contracts and pure rules**, not UI. The two apps run different React majors and different module systems: the desktop main process is CommonJS (`local:electron/main.js:1-70`), mobile is ESM TypeScript. A shared *code* package would need a build step neither repository has.

**What to share (proposed):**

| Artifact | Canonical location | Why |
|---|---|---|
| `sync-contract/v1.json`: domains, field names/types/enums, required fields, limits, record-ID rule, tombstone rules, mutation ops | `briizos-local/shared/sync-contract/v1.json` | Desktop is the data authority. Main can `require()` JSON. **Precedent:** `local:electron/local-data-service.js:11` already requires `../src/theme/themeContract.json`. |
| `sync-contract/fixtures/*.json`: canonical record ↔ UI-shape pairs, mutation → expected result, recurrence expansion cases | same folder | Golden examples keep the two hand-written codecs honest. |
| `journal-templates.v1.json`, `journal-assets.v1.json` (cover/page keys) | `briizos-local/shared/` | Resolves the duplicated, divergent template sets. |
| `model-catalog.v1.json` (generated from `built-in-models.js`) | `briizos-local/shared/` | One model list. |
| `log-entry.v1.json` (fields + category map from `local:src/lib/logger.js:24-60`) | `briizos-local/shared/` | Logs read the same on both. |

**How it stays aligned across two repositories (proposed):**

1. Mobile keeps a **vendored copy** under `src/shared/`, with `src/shared/SOURCE.json` = `{ sourceRepo, sourceCommit, files: { name: sha256 } }`.
2. Mobile script `scripts/shared-contract.mjs pull` copies from the sibling checkout `../briizOS.local/shared`. The two repos sit side by side in `/Users/alex/Documents/Cufolio/briizOS/`, per the paths in `local:docs/local-mobile-feature-audit-2026-09-13.md:140-164`. `check` mode recomputes hashes and fails on drift. This mirrors the desktop's existing `tools:catalog:check` pattern (`local:package.json:21-22`).
3. Mobile generates `src/shared/sync-contract.d.ts` and zod schemas from the JSON with a small script. Hand-written types are not allowed for synced records.
4. Contract changes land **in briizos-local first**, carry a `contractVersion` bump when breaking, and are pulled into mobile in the same work session. A git submodule is rejected: two independent histories exist, and submodule state is easy for a non-developer owner to get wrong. A published npm package is rejected: there is no registry, and it would add a release step for personal use.

**Duplication and conflicts to resolve:** legacy `briizSyncCore`/`syncAdapters` on both sides; two template sets; two model lists; mobile tool names vs desktop agent tool names (`mobile:src/services/mobileToolRegistry.ts:23-97` vs `local:electron/agent/tools.js:288-674`). When mobile tools are rebound to v1 records (Phase 5), rename them to the desktop vocabulary (`briizos_create_task`, …) so logs and prompts read the same.

---

# 2. GUI and UX overview

## 2.1 Desktop interaction patterns that need reconsideration (existing)

| Pattern | Where the desktop uses it | Mobile treatment (proposed) |
|---|---|---|
| Multiple simultaneous panels/floats, resizing, tiling | `local:src/components/layout/TileLayout.jsx`, `local:src/hooks/useFloatWindows.js`, `local:src/components/shell/FloatWindow.jsx` | One primary view at a time with stack navigation; bottom sheets for secondary work. Panel geometry is never synced (§4). |
| Keyboard shortcuts (⌘⇧ + letter, Esc stack) | `local:src/App.jsx:1210-1274`, ⌘↩ finish entry (`local:docs/execubriiz.md:13-14`) | Tab bar + Home quick actions on phone. On iPad with a hardware keyboard, map the same ⌘⇧ letters and Esc (Phase 8). |
| Hover reveal | Header dock and briizy reveal on hover (`local:src/App.jsx:1426`), note drawer card expansion on hover (`local:docs/interface-functionality-september-2026.md:51-54`) | Always-visible controls or an explicit "…" disclosure. Nothing depends on hover. |
| Right-click menus | Canvas cards (`local:src/components/canvases/CanvasCard.jsx`), the Electron context menu (`local:electron/main.js:239-252`) | Long-press action sheet **plus** a visible "…" button (long-press alone is undiscoverable and inaccessible). |
| Drag and drop | Files from Sources into chat (`local:src/components/InteractionPanel.jsx:273-292`), notes tear-off, journal/notefalls media drops, Forest, Priorifact chips | Attachment button and pickers; an explicit "Reorder" mode with handles for task steps and journal pages, plus "Move up/down" items in the action sheet. |
| Wheel paging, double-/triple-click | Journal page wheel navigation, Forest triple-click tray, double-click rename (`local:docs/interface-functionality-september-2026.md:78-81,98-100`) | Horizontal swipe + page rail (mobile already has a rail, `mobile:src/views/JournalsView.tsx:816-835`); rename via the item's sheet. |
| Precise pointer placement | Day timeline lanes/minutes (`local:src/components/calendar/DayTimeline.jsx:1-60`), Execubriiz board section reorder | Tap an empty slot → time sheet with 15-minute steps; long-press-and-drag to move, snapping to 15 minutes. |
| Desktop file selection | `showOpenDialog`, `webUtils.getPathForFile` (`local:electron/preload.js:462-464`) | `<input type="file" accept capture>` for phone files; Mac files only via "Ask my Mac". |
| Dense panels | The whole product (`local:AGENTS.md:27`) | Keep **visual** density (rows, type sizes, spacing) and enlarge only the **hit area**, using padding/pseudo-elements to ≥ 44×44 pt. This keeps density as a defining trait without making touch targets too small. |

## 2.2 Navigation and screen structure (proposed)

The current eight-item bottom bar (`mobile:src/components/BottomNav.tsx:10-18`) gives each item roughly 47 pt on a 375 pt-wide phone. That squeezes labels and targets, and two of the eight destinations are placeholders. **Replace it with five tabs.** Keep the existing view files where their content survives.

| Tab | Contains | Built from |
|---|---|---|
| **Home** | Mac status chip · composer (sends into Chats) · Today: events, placements, due/overdue tasks, current Briizify activity (Phase 7) · quick capture (note, task, event; later photo/voice) · recent conversations | Rewrite `HomeView.tsx` (placeholder today) |
| **Plan** | Segmented control **Tasks · Day · Month** · task detail with steps · run history for automated tasks | New `PlanView`; reuses FilesView's task/event editors |
| **Chats** | Conversation list (phone + Mac threads) · conversation · composer · "Run on Mac" toggle · approvals | Refactor `ChatsView.tsx`; its Settings tab moves to Settings |
| **Journals** | Library · reader/editor · templates · trash | `JournalsView.tsx` (keep its accessible sheet patterns) |
| **Menu** | Notes (organizer) · Notefalls · Canvases · Runs on Mac · Skills · Recently deleted & conflicts · Activity log · Settings (Account, Models & keys, Sync, Appearance) | `MenuView.tsx`; `FilesView` becomes **Notes & Records**; `AutomationsView` becomes **Runs on Mac**; `SettingsView` is finally routed |

Navigation rules:

- Each tab keeps its own back stack and scroll position.
- A conversation, note or task opened from Home pushes onto Home's stack.
- The status strip (`mobile:src/components/SyncStatusStrip.tsx`) becomes a slim header chip with two facts: **Mac** (online / last seen *n* min ago / never) and **This phone** (synced / *n* changes waiting / offline). Tapping it opens Settings → Sync.

**Tablet (≥ 768 pt width, matching the existing breakpoint in `mobile:src/hooks/use-mobile.ts:3`):**

- A left sidebar replaces the tab bar.
- Plan, Chats, Notes and Runs use a **list–detail split**.
- Journals in landscape show a **two-page spread**, matching desktop's spread mode.
- Day view shows the timeline beside the task list, so a task can be dragged onto a time.

The tablet layout is Phase 8, after phone parity.

## 2.3 Workflow-by-workflow treatment

Each workflow below lists: desktop today → mobile interaction → what stays primary vs secondary → small-screen fit → states.

### Chat with briizOS

- **Desktop today:**
  - Interaction panel with modes, model picker, conversation browser, file context dropped in from Sources, and inline approval cards.
  - Streaming via the in-process agent (`local:src/hooks/useChat.js:1-24`, `local:src/components/InteractionPanel.jsx:935-964,1230-1270`).
- **Mobile:**
  - A full-screen conversation, with the composer pinned above the keyboard (the `visualViewport` resize keeps it visible).
  - The top bar shows the conversation title and an "executes on" pill: **Phone** (direct provider, existing `chatApi.ts`) or **Mac** (remote run, Phase 5).
  - Mode chips (Day/Chat/Research/Code/Report) scroll horizontally above the composer when "Mac" is selected, because modes map to desktop skills (`local:src/hooks/useChat.js:46-54`).
- **Primary:** send, stop, choose Phone/Mac, attach. **Secondary (sheet):** model, mode, custom instructions, tool permissions, rename, tags, delete.
- **Approvals:** phone-side tool calls keep mobile's confirm/cancel cards (`mobile:src/views/ChatsView.tsx:295-325`), restyled as a bottom-anchored card above the composer. Mac-side approvals (`waiting_for_user` runs) show "Approve on your Mac". Approving remotely is a later decision (D7 note): the desktop deliberately pauses rather than executing unconfirmed (`local:src/hooks/useTaskAutomation.js:20-26`).
- **States:**
  - Loading history: cached list renders first.
  - Empty: three starters drawn from real data (for example "Plan today: 4 tasks, 2 events").
  - Provider error: inline, with Retry and "Change model".
  - Missing key: a link to Settings → Models & keys.
  - **Interrupted:** if the app is backgrounded or killed mid-request, the user message is already persisted (IndexedDB), and the assistant turn is marked "Interrupted — retry". Drafts autosave per conversation.

### Tasks and steps

- **Desktop today:** Tasks panel with expandable cards, step progress badge, add step, AI Deck Maker, Briizify, and "automate" (`local:src/components/TasksPanel.jsx:26-139,276-300,435-497`).
- **Mobile (Plan → Tasks):** a dense list grouped by Overdue / Today / Upcoming / No date.
  - The row shows a checkbox, title, step progress "3/7", priority glyph, due date, and a pending-sync dot when relevant.
  - Swipe right = complete (with undo snackbar); swipe left = "…" sheet. A visible "…" button always exists as well.
  - Tap opens Task detail: title, description, steps (checkboxes; "Reorder" mode), due date picker, priority, linked placements, run history.
- **Primary:** complete, add task (sticky bottom field), open. **Secondary:** delete, reschedule, convert to placement, "Run on Mac" (automate), Deck Maker (sends a Mac run whose result becomes steps).
- **States:**
  - Empty list shows "No tasks on your Mac yet" vs. "No tasks match" for filters.
  - Pending: rows created offline show "Waiting for Mac".
  - Conflict: a banner on the task links to the conflict center.
  - A `REVISION_CONFLICT` result reloads the record and re-applies the edit only when it touches different fields (§4.5).

### Calendar (events and placements)

- **Desktop today:** month grid + day detail, quick-add with natural-language time parsing (`local:src/lib/calendarQuickAdd.js`), task placements with recurrence and per-occurrence completion, AI day planner.
- **Mobile:**
  - **Day:** a vertical timeline with all-day row, events and placements, and a "now" line. Tap an empty slot opens a new event sheet prefilled with that time. Long-press and drag moves an item in 15-minute snaps. Left/right swipe changes the day.
  - **Month:** a compact grid with dots. Tap a day opens that day.
  - Quick-add uses the same parser (port `calendarQuickAdd.js` as pure logic with fixtures).
- **Recurring placement edits:** the sheet asks "This occurrence / All future". The data layer supports only completion per occurrence today (`local:electron/local-data-service.js:1464-1490`). "This occurrence" changes are limited to completion until a desktop exception model exists; this is stated in the UI, not faked.
- **States:** an offline-created event shows a pending dot. Overlapping items render as side-by-side lanes using desktop's lane algorithm (`local:src/components/calendar/DayTimeline.jsx:28-55`).

### Notes and organizer records

- **Desktop today:** sticky notes drawer/floats with colors; Organizer modal listing notes/events/timers/projects with tags.
- **Mobile (Menu → Notes & Records):** keep FilesView's search, sort and editor (`mobile:src/views/FilesView.tsx:137-460`). Rename it from "Files" so it no longer suggests a Mac file browser, a confusion the audit noted (`local:docs/local-mobile-feature-audit-2026-09-13.md:31`).
  - Filter chips: Notes · Events · Projects · Timers.
  - Note editor: title, body (plain text, same as desktop sticky note `body`), color row (the six desktop colors, visible, not hover), tags.
  - Projects show their child tasks read-only (`tasks.project_id`).
- **Delete:** replace `window.confirm` (`mobile:src/lib/confirmDestructiveAction.ts:2`) with the in-app sheet pattern already used for journal deletion (`mobile:src/views/JournalsView.tsx:420-433`). Deleted notes go to Recently deleted (restorable 30 days).

### Journals

- **Desktop today:** shelf, covers/pages, folio types, TipTap rich text with a docked toolbar rail, Pages/Scroll modes, wheel paging, trash; Execubriiz composer and board (`local:docs/interface-functionality-september-2026.md:85-94`, `local:docs/execubriiz.md:7-37`).
- **Mobile:** keep the current library/reader/sheets design (the most mobile-native code in the repository).
  - Change the notes editor from `<textarea>` to a TipTap editor that reads and writes `content.doc`.
  - The toolbar becomes a **keyboard accessory bar**: B / I / U, heading, list, quote, link; font/size in an overflow sheet.
  - Pages: horizontal swipe + the existing rail. Scroll mode: one continuous column.
  - Dashboard folios render read-only (as today, `mobile:src/views/JournalsView.tsx:682-697`).
- **Execubriiz journals** open read-only on the phone (entries + board) in Release 2. Entry capture follows in Phase 9.
- **States:** "Saved" / "Waiting for Mac" / "Couldn't save on this phone" (the existing `storageState` concept, `mobile:src/views/JournalsView.tsx:882-888`, extended).

### Ask my Mac (remote runs) and automations

- **Desktop today:** a task can be automated; remote commands are polled from Firestore and executed with permission ceilings; runs publish status (`local:electron/automation-runner.js:136-241`, `local:electron/cloud-gateway.js:199-254`).
- **Mobile (Menu → Runs on Mac, plus entry points in Chats and Task detail):**
  - Compose an instruction, optionally attach context (the current note/task text), and choose which Mac (the primary device by default).
  - Submit. The run card then shows Accepted → Queued → Running → Completed / Failed / Waiting for you / Expired, with result summary and timestamps.
  - When the Mac is offline, the card says "Will start when your Mac is online (expires in 24 h)", using the existing `expiresAt` handling (`local:electron/cloud-gateway.js:210-219`).
- The placeholder "New Automation" schedule editor (`mobile:src/views/AutomationsView.tsx`) is **removed**. No durable scheduled-prompt trigger exists on the desktop (`local:docs/local-mobile-feature-audit-2026-09-13.md:34`), so a schedule editor would present a fake capability. It returns when the desktop gains scheduled automations.

### Notefalls (Release 3)

- **Desktop today:** a timeline of manual and auto-captured posts.
- **Mobile:** a reverse-chronological feed grouped by day; a compose sheet for text posts with tags and optional journal link.
- Screenshot/media items show a "On your Mac" placeholder tile until decision D10 enables binary transfer.
- briizy capture controls are **not** shown on the phone, because capture is Mac-only.

### Canvases (Release 3)

- **Mobile:** a list of canvases. Opening one shows the HTML in a sandboxed `iframe` (`sandbox="allow-scripts"`, no same-origin), full screen, with Back and "Open on Mac".
- URL canvases open in the system browser. Editing is not offered on the phone.

### Settings, account, activity (Release 1 subset)

- **Settings:** Account · Sync (Mac status, pending changes, last publish, contract version, "Resend pending changes", legacy import) · Models & keys (phone-only keys, clearly labeled) · Appearance (theme subset, Phase 8) · About.
- **Activity:** a filterable log of every network request, sync write/apply/ack, AI call and error, written in the same plain-language style as the desktop Log Panel example (`local:AGENTS.md:51-61`).

## 2.4 Cross-cutting mobile requirements

- **Touch targets:** ≥ 44×44 pt hit areas everywhere (several mobile rules already use 44 px: `mobile:src/App.css:2908-2909,4519-4528`).
- **On-screen keyboard:** composer and note editors stay visible using `visualViewport`. Forms scroll the focused field into view. Return inserts a newline; a separate Send button sends. On iPad with a hardware keyboard, ⌘↩ sends/finishes.
- **Safe areas:** add `viewport-fit=cover` (`mobile:index.html:5`) so existing inset rules work; audit the tab bar and sheets against the home indicator.
- **Orientation:** phone is portrait-first, and landscape must not break layouts. Tablet supports both, with spread mode in landscape.
- **Accessibility:**
  - Every icon-only button gets an `aria-label`, using JournalsView as the model.
  - Visible focus.
  - Respect `prefers-reduced-motion` (already present, `mobile:src/App.css:4553`).
  - Text sizes in `rem`, so browser text-size settings apply.
  - Status is never conveyed by color alone (pending/conflict dots get text or icon shape plus an accessible label).
- **Lifecycle interruptions:**
  - On `visibilitychange` → hidden: flush drafts to IndexedDB and stop timers.
  - On visible: refresh Mac status and show "Updated just now" when listeners deliver.
  - In-flight phone AI requests are not resumable, so mark them interrupted.
  - Firestore pending writes are durable in the persistent cache. ⚠ Firebase's offline page does not state explicitly that pending writes survive a reload. **Verify on device in Phase 4**; until then, mobile also keeps its own IndexedDB outbox copy of each mutation and re-submits by `mutationId` (idempotent, §4.8).

---

# 3. New opportunities overview

Each opportunity extends something already visible in the desktop. They are **enhancements, not part of the initial port**, unless marked otherwise.

| Rank | Opportunity | Existing direction it extends | User benefit | Proposed interaction | Platform needs | Limitations | When |
|---|---|---|---|---|---|---|---|
| 1 | **Ask my Mac** | Remote command/run pipeline already built but with no client (`local:electron/cloud-gateway.js:199-254`, `local:electron/automation-runner.js:136-241`); devices/primary lease (`:162-197`) | Use the full desktop agent (files, GitHub, Codex, skills) from anywhere | Compose → run card with live status (§2.3) | Firestore only | Mac must be on and signed in; approvals happen on the Mac; progress is coarse (`progress_total` 1) | **Initial port (R1)**. It preserves the agent capability through adaptation. |
| 2 | **Quick capture** (text note/task/event from Home; later Notefalls post) | Notes widget, Organizer, Notefalls manual posts (`local:src/components/notefalls/api.js:12-30`) | Catch thoughts away from the desk; they appear on the Mac | Home capture row; one field + type chips; saves offline | Firestore offline cache | Text only until D10 | Text: **R1**. Notefalls post: R3. |
| 3 | **Run and reminder notifications** | Run status publishing; the documented reminders/alarms direction (`local:docs/omi-desktop-capability-map.md:289-317`) | Know when a Mac run finishes or needs approval; reminders for placements | System notification → opens the run/task | Web Push on an installed Home Screen web app (iOS/iPadOS 16.4+, user-gesture permission, manifest `display: standalone`) ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)); a sender: the **Mac** sends Web Push directly (VAPID, `web-push` npm in main) so no Cloud Functions are needed | Notifications only while the Mac runs; iOS requires Home Screen install | Phase 9 |
| 4 | **Photo capture into Notefalls/journals** | Notefalls media attachments, journal image attach (`local:electron/main.js:1002-1046`) | Photograph whiteboards, receipts, pages into the timeline | Camera button in Notefalls compose; thumbnail upload | `<input capture>` (works in browser); Cloud Storage bucket (Blaze for new buckets, see §1.4) or an alternative Mac-pull transfer | Storage cost/plan decision D10; desktop must download to `external_files` | Phase 9 |
| 5 | **Voice input** | Voice/PTT is a stated gap (`local:docs/omi-desktop-capability-map.md:95-123,452`) | Dictate chats, captures, journal entries while walking | Hold-to-talk mic on the composer; transcript inserted for review before send | ⚠ Web Speech API support on iOS Safari is unverified (MDN's table did not load during research, [MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)). Robust alternative: record with `MediaRecorder` and transcribe through the user's OpenAI/Gemini key | Microphone permission; audio sent to the chosen provider | Phase 9 |
| 6 | **Today plan glance** | Briizify Priorifact plan stored in `settings.briizify_plan` (`local:src/hooks/useBriizify.js:6-9`); day planner | See the current planned activity and what's next | Home "Now" card; tap opens the plan read-only | Settings mirror of `briizify_plan` (non-secret) | Editing stays on the Mac | Phase 7 |
| 7 | **Share from other apps** | Sources → chat context; capture direction | Send a link/text from Safari or other apps into a note or chat | Android: Web Share Target. iPhone: an iOS Shortcut opening `https://<app>/capture?text=…` | ⚠ Web Share Target support on iOS Safari is unverified and historically absent ([MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target)); a true share-sheet entry needs a Capacitor share extension (D1) | Shortcut setup is manual | Phase 9 |
| 8 | **Execubriiz entries from the phone** | Execubriiz entry pipeline and worker queue (`local:docs/execubriiz.md:7-49`) | Journal on the go; the Mac curates the board later | Entry composer in an Execubriiz journal; "will be analyzed when your Mac is on" | Mutation op for `exec_entries` | Live companion impossible offline/Mac-off; private-content rules must hold (`local:docs/execubriiz.md:63-68`) | Phase 9 |
| 9 | Widgets / Live Activities | Status strip, today agenda | Glanceable agenda | Home-screen widget | Native (Capacitor + Swift WidgetKit) | Needs the D1 native route and an Apple Developer account | Later, only if D1 = native |

**Recommended set:** 1 and 2 (text) in the initial port, then 3, 5 and 6. Items 4, 7, 8 and 9 wait on explicit decisions (D10, D1).

**Not recommended:** location features. The only location use is header weather (`local:electron/main.js:22-38,689-726`), and nothing in either repository points to location-based workflows.

---

# 4. Data sharing and agreement

## 4.1 How each repository stores and identifies data today (existing)

| | Desktop (briizos-local) | Mobile (briizos-mobile) |
|---|---|---|
| **User data** | SQLite tables: `tasks`, `task_steps`, `organizer_items`, `placements`, `journals`, `folios`, `notefall_posts`, `canvases`, `threads`/`messages`, `memory_*`, `forest_*`, `exec_*`, `rewind_*`, `briizy_*` (schema `001`–`016`) | Firestore `users/{uid}/{tasks,events,organizer,panels}` + `app/{timer,minStack}` (`mobile:src/services/mobileSyncService.ts:256-334`); journals in `localStorage['briizos.mobile.journals.v1']` (`mobile:src/features/journals/journalStore.ts:208`) |
| **Settings** | `settings` (whitelisted keys, `local:electron/local-data-service.js:20-45`), `model_profiles`, `app_meta` | `localStorage['briizos.chatSettings.v1']` (`mobile:src/services/chatSettings.ts:22`) |
| **Secrets** | `secrets` (safeStorage-encrypted) | `localStorage` provider keys |
| **Derived / cache** | `conversation_summaries`, `checkpoints*`, `ai_turn_audit_events`, `logs`, rewind OCR, `domain_revisions`, `sync_*` | Firestore memory cache |
| **Layout (platform-specific)** | `workspace_panels`, `workspace_state`, `forest_view_state`, `media_state` | `panels.ui.web/local` geometry (legacy) |
| **Repository source files (not user data)** | `agent/skills/**` (skill instructions), `src/themes/*.css`, `public/assets/**` | `src/assets/wallpaper/*` |
| **Identity** | UUID v4 per row; per-row `revision`; `deleted_at` tombstones; device UUID (`local:electron/local-data-service.js:294-302`) | Client strings like `task-<ms>-<rand>` (`mobile:src/views/FilesView.tsx:92-95`); `journal-<uuid>` (`mobile:src/features/journals/journalStore.ts:210-213`); no revisions; hard deletes |
| **What reaches Firestore** | Continuity snapshots, shared-text projection, devices/runs (`local:electron/cloud-gateway.js`). The privacy invariant **I9** keeps screen-memory data out (`local:electron/local-data-service.js:4334-4338`). | Direct `setDoc(merge)`/`deleteDoc` on legacy paths |

**Consequence:** today the phone and the Mac **do not share any user records**. The phone's "Live" label refers to legacy Web collections.

## 4.2 Options evaluated

| Option | Description | Fit with current apps | Infrastructure | Verdict |
|---|---|---|---|---|
| **A. Firestore relay, desktop authoritative** | Mac publishes canonical per-record docs; phone writes idempotent mutations; Mac applies with revision checks and publishes results | Reuses desktop revisions, `REVISION_CONFLICT`, `acceptCommand`-style idempotency, operation receipts, device lease, REST gateway, Firebase auth on both apps | The existing Firebase project (Auth + Firestore). Free quota: 50k reads, 20k writes, 20k deletes/day, 1 GiB ([quotas](https://firebase.google.com/docs/firestore/quotas)) | **Recommended** |
| B. Firestore peer replication | Both apps write canonical docs; Mac pulls and merges into SQLite | Needs a pull/merge engine in the Mac for every domain *and* client-side merge on the phone; conflicts race on two writers | Same | Rejected: duplicates authority, contradicts the desktop's single-authority design (`local:electron/local-data-service.js:4083` `INVALID_AUTHORITY`) |
| C. Direct phone ↔ Mac over LAN/Tailscale | Mac runs a local HTTP API; phone syncs when reachable | No away-from-desk use unless a tunnel/VPN account is added; Mac must be awake | New local server; Tailscale or port forwarding | Rejected: fails "use away from a desk", adds a security surface |
| D. File export via iCloud Drive | Mac writes JSON; phone imports | A browser app cannot read iCloud Drive silently | None | Rejected: manual, no live updates |
| E. Self-hosted sync server / CRDT (CouchDB, Automerge) | Replace storage with a sync engine | Rewrites both persistence layers | A new server | Rejected: disproportionate for one user |

Option A trades away one thing. **Phone edits become canonical only when the Mac next runs.** The phone still shows them immediately, marked "Waiting for your Mac". They are durable in Firestore and never lost. The single-writer design is what makes conflicts, deletes and migrations tractable.

## 4.3 The recommended arrangement (proposed)

**Authority.** Desktop SQLite remains the system of record for all synced domains. Firestore holds (a) a published replica of each synced record and (b) a queue of phone mutations. Only the **primary Mac** (existing lease, `local:electron/cloud-gateway.js:162-185`) publishes and applies.

**Synced domains in contract v1:**

- `tasks`, `taskSteps`, `organizer` (note/project/event/timer), `placements` (Release 1)
- `journals`, `folios`, `threads`, `messages` (Release 2)
- `notefallPosts` (text fields), `canvases` (metadata + HTML up to 900 KB), `settingsMirror` (non-secret keys: `selected_model`, `briizify_plan`, `ui_theme`), `modelProfiles` (no keys) (Release 3)

**Never synced:** secrets, rewind/briizy data (I9), checkpoints, AI audit, logs, layout/geometry, forest file paths, media queue.

**Firestore layout (new, versioned):**

```
users/{uid}/syncV1Control/contract        { contractVersion: 1, minClientContract: 1, publisherDeviceId, updatedAt }
users/{uid}/syncV1/{domain}               { domain, contractVersion, publishedThrough, itemCount, updatedAt }
users/{uid}/syncV1/{domain}/items/{id}    { id, domain, contractVersion, rev, data:{…canonical fields…},
                                            deletedAt|null, updatedAt (desktop ms), publishedAt (server),
                                            lastMutationId|null }
users/{uid}/syncV1Mutations/{mutationId}  { mutationId, contractVersion, clientDeviceId, clientApp:'mobile',
                                            domain, op, recordId, baseRev|null, patch:{…}, baseValues:{…},
                                            clientCreatedAt, status:'pending'|'applied'|'merged'|'conflicted'|'rejected',
                                            resultRev?, conflictId?, message?, appliedAt? }
users/{uid}/syncV1Conflicts/{conflictId}  { domain, recordId, field, localValue, remoteValue, resolution,
                                            createdAt, resolvedAt? }
users/{uid}/briizosLocalDevices/*, briizosLocalControl/primaryDevice, briizosLocalCommands/*, briizosLocalRuns/*   (existing)
```

`op` ∈ `create | patch | archive | restore | reorder`. `recordId` for `create` is a **client-generated UUID v4** (`crypto.randomUUID()`). It passes the desktop identifier rule `^[A-Za-z0-9][A-Za-z0-9._:-]*$`, max 128 (`local:electron/local-data/validation.js:38-45`).

**Desktop changes (proposed):**

- Migration `017_sync_v1.sql`:
  - `sync_record_cursor` per domain (or reuse `sync_state.cursor`, which exists and is unused: `local:electron/local-data/schema/001_initial.sql:32-38`);
  - `sync_conflicts` table;
  - `organizer_items.all_day INTEGER NOT NULL DEFAULT 0`;
  - `organizer_items.source_key TEXT` with a unique partial index, like `tasks.source_key` (`local:…/008_calendar_placements.sql:2-4`).
- `LocalDataService`:
  - `createWithClientId(domain, id, fields)`, `restoreRow(domain, id, expectedRevision)`, `listChangedSince(domain, updatedAtCursor, limit)`;
  - `applyRemoteMutation(mutation)`, wrapping everything in one transaction with an `operation_receipts` row keyed by `mutationId` (`local:electron/local-data-service.js:3846-3868`).
- `CloudGateway`: add `SyncPublisher` and `MutationApplier`, both started only when `primary`, both logging every step to the Log Panel per `local:AGENTS.md:41-63`.

**Mobile changes (proposed):**

- Replace `mobileSyncService.ts` with `src/services/sync/` (client, records store, outbox overlay, Mac status).
- Initialize Firestore with `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.
- Listen to `syncV1/{domain}/items` (for large domains, query `updatedAt > cursor` after the first load).
- Render **canonical ⊕ pending mutations**.

## 4.4 When synchronization happens, and how freshness is shown

- **Mac → Firestore:**
  - Publishing is debounced 2 s after a `changed` event for a synced domain (the event already exists: `local:electron/local-data-service.js:1132-1136`).
  - It also runs on login (`setSession`) and every 15 s poll as a catch-up.
  - The publisher reads `listChangedSince(domain, cursor)` (rows with `updated_at ≥ cursor`, overlapping by 1 s to tolerate equal timestamps) and skips records whose Firestore `rev` already equals the row revision.
- **Firestore → phone:** live listeners while the app is in the foreground; cache-first render on launch.
- **Phone → Firestore:** immediately, or queued offline by the SDK.
- **Firestore → Mac:** the existing 15 s poll, extended to query `syncV1Mutations where status == 'pending'` ordered by `clientCreatedAt`.
- **Freshness on the phone:**
  - "Mac online" if `briizosLocalDevices/{primary}.lastSeenAt` is within 3 minutes (the lease length, `local:electron/cloud-gateway.js:5`); otherwise "Mac last seen 2 h ago".
  - Per domain: "Published 14 s ago" from `syncV1/{domain}.updatedAt`.
  - Per record: a pending dot while a mutation exists for it.
- **Freshness on the Mac:** Settings → Health gets a Sync card with last publish, pending phone changes, conflicts and failures. The same events go to the Log Panel.

## 4.5 Concurrent edits and conflict resolution

Single user, so true conflicts are rare. They come from offline phone edits racing Mac edits. **Rules applied by `applyRemoteMutation`:**

1. **Duplicate check:** if `operation_receipts` has `op_id = mutationId`, re-ack with the stored result and stop.
2. **Fast path:** if `baseRev == current revision`, apply the patch via the normal update path (which re-validates) and ack `applied`.
3. **Field-level merge:** if `baseRev < current`, compare each patched field's `baseValues[field]` with the current value.
   - Equal → the Mac didn't touch that field → apply it.
   - Unequal → conflict on that field.
4. **Conflict policy (decision D11, default shown):**
   - **Scalar fields** (status, priority, due/start times, completion, title, color, tags): the edit with the later `clientCreatedAt` vs the row's `updated_at` wins; the loser is recorded in `sync_conflicts` with an **Undo** action.
   - **Long text** (note `body`, task `description`, folio `content`): never overwrite. Keep the Mac's text and create a **conflict copy**: a sibling note/folio titled "… (phone version, 12 Oct 14:02)". Ack `conflicted` with `conflictId`.
5. **Delete vs edit:** an `archive` mutation whose base is stale does **not** delete. It is recorded as a conflict, "Changed on your Mac after you deleted it on your phone — Delete anyway / Keep".
6. **Edit on a deleted record:** ack `rejected` with "This was deleted on your Mac — Restore and apply?" The restore uses the `restore` op.

Both apps show conflicts in **Recently deleted & conflicts** (mobile Menu; desktop Settings → Health → Sync). Each entry offers keep mine / keep other / keep both.

## 4.6 Deletion propagation and restoration

- Desktop already soft-deletes everywhere (`deleted_at`, `local:electron/local-data-service.js:4289-4300`) and cascades where meaningful: task → placements (`:1291-1306`), journal → folios with `archive_batch` (`:2007-2018`).
- The publisher publishes **tombstones**: `deletedAt` set, `data` kept for 30 days so the phone can offer Restore. After 90 days the Mac deletes the Firestore doc; SQLite keeps its soft-deleted row (existing behavior).
- Phone delete = an `archive` mutation, shown immediately as removed with an "Undo" snackbar (7 s) and listed in Recently deleted.
- Restore = a `restore` mutation, or Mac UI. Desktop needs a `restoreRow` service method (new). Journal restore re-activates folios with the same `archive_batch`.

## 4.7 Schema compatibility, migrations and differing app versions

- Every record, mutation and the control doc carry `contractVersion`.
- **Additive changes** (new optional fields) stay within v1. The phone sends **patches only**, so unknown fields are never erased. The desktop update path only touches listed columns (`local:electron/local-data-service.js:4266-4287`).
- **Breaking changes** create `syncV2/...` beside v1. The Mac publishes both until `minClientContract` is raised.
- If a mobile client's contract < `minClientContract`, mobile goes **read-only** with "Update briizOS Mobile" (the service worker fetches the new build on next launch).
- The desktop's own SQLite migrations remain checksum-protected (`local:electron/local-data-service.js:258-292`). New columns are always additive with defaults.

## 4.8 Failed or interrupted synchronization, retries and duplicate prevention

- **Mac publish failure:**
  - Record-level failures keep the cursor unadvanced and retry with exponential backoff (30 s → 15 min cap). The existing outbox uses a fixed 30 s (`local:electron/local-data-service.js:3986-4004`); extend it.
  - Every failure logs a plain-language Log Panel entry: what failed, what still works, next step.
- **Phone write failure:** the Firestore SDK retries automatically. Mobile mirrors each mutation in its own IndexedDB outbox. On launch it re-submits any whose Firestore doc is missing (same `mutationId`, so the write is idempotent).
- **Duplicates:**
  - `mutationId` (UUID) is the Firestore doc ID and the `operation_receipts` key.
  - Creates use client record IDs, so a repeated create finds the existing row and re-acks.
  - Remote commands keep their `idempotencyKey` (`local:electron/local-data-service.js:3734-3741`).
- **Interrupted backfill:** per-domain cursor; restart resumes. The manifest's `publishedThrough` shows progress.
- **Stuck pending:** mutations pending > 7 days show a warning on the phone with "Copy text" for long fields.

## 4.9 Attachments, relationships and file references

- **Relationships** are IDs inside `data`: `taskSteps.taskId`, `placements.refId`, `tasks.projectId`, `folios.journalId`, `messages.threadId`, `notefallPosts.journalId`. Mobile resolves them client-side; dangling references render as "Item not available on this phone".
- **File references** (`external_files.path`, post attachments, journal images) are published as **opaque descriptors** `{ fileId, displayName, kind, size }`, never as paths. The phone shows "On your Mac" tiles.
- **Binary transfer** (phone photos → Mac, Mac images → phone) waits for decision D10:
  - (a) Cloud Storage in the same project (needs Blaze for a new default bucket). The mobile config already names `briizos.firebasestorage.app` (`mobile:src/services/firebaseClient.ts:15`); that naming format is used for buckets provisioned on or after Oct 30, 2024. ⚠ Whether the bucket exists, and the project's plan, are undetermined.
  - (b) Firestore-chunked thumbnails only, for ≤ 300 KB images, as a no-plan-change fallback.

## 4.10 Backup, recovery and initial transfer

**Backup (proposed):** a daily SQLite online backup on the Mac (`better-sqlite3` `db.backup()`) into `userData/backups/briizos-YYYYMMDD.db`, keeping 14, logged. The existing continuity snapshots and recovery offer remain (`local:src/context/AuthContext.jsx:96-103`). The v1 replica in Firestore is a second recovery source for synced domains (a "Rebuild from cloud replica" action on an empty DB, in Phase 7).

**Initial transfer, in order:**

1. **Desktop backfill:** the publisher walks every synced domain from cursor 0 and writes items in batches of 400 (Firestore batch limit 500). The phone shows "Your Mac is publishing… 1,240 / 3,100".
2. **Mobile local journals** (`localStorage`):
   - After sign-in, mobile offers "Move 3 journals from this phone to your Mac". It submits `create` mutations with the **original IDs** (`journal-<uuid>`, `folio-<uuid>` are valid identifiers), converts ISO timestamps to ms, and maps `content.body` into a TipTap `doc` paragraph list.
   - The `localStorage` copy is kept until all acks arrive, then renamed `…v1.migrated`.
   - **Do this early.** On iOS, Safari's 7-day storage cap does not apply to Home Screen web apps, but it does apply to a site used in the Safari tab ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)). Phase 0 adds an export-to-file button as a safety net.
3. **Legacy Firestore records** (`users/{uid}/tasks|events|organizer|panels`, written by Web/old mobile): decision **D6**.
   - Default: a one-time **desktop** import ("Import earlier Web/Mobile records").
   - It reads them via the legacy adapters and creates desktop rows with `source_key = 'legacy:{collection}:{id}'`, so re-running is idempotent (unique index).
   - It never deletes the legacy collections, because briizOS.Web may still use them (⚠ undetermined).

## 4.11 Walk-through examples

**Edit on desktop appears on mobile.**

1. On the Mac, Alex renames task *Draft brief* → *Draft client brief*.
2. `tasks.update` commits rev 4→5 and emits `changed{domains:['tasks']}`.
3. Two seconds later the publisher finds the row (`updated_at ≥ cursor`) and PATCHes `syncV1/tasks/items/{id}` with `rev:5`.
4. It logs "Published 1 task change to your phone".
5. The phone, if open, receives the snapshot within about a second and updates the row. If the phone is closed, the next launch renders the cached rev 4, then rev 5 arrives. The header reads "Mac online · updated just now".

**Offline mobile edit returns to desktop.**

1. On a train, Alex checks off a step (task step rev 2).
2. Mobile writes `syncV1Mutations/{m1}` `{op:'patch', domain:'taskSteps', baseRev:2, patch:{status:'completed'}, baseValues:{status:'pending'}}`. Firestore queues it offline, and the IndexedDB outbox stores a copy.
3. The row shows checked with a pending dot. The header reads "Offline · 1 change waiting".
4. Back online, the SDK sends m1. Within 15 s the Mac gateway reads it, finds no receipt, sees rev 2 = base, and applies it (rev 3).
5. The Mac records the receipt, sets the mutation `applied, resultRev:3`, and publishes the step (rev 3, `lastMutationId:m1`).
6. The phone drops the overlay because canonical rev 3 ≥ the pending mutation.

**Conflicting edits.**

1. The phone, offline, edits note *Trip ideas* body (base rev 7).
2. Meanwhile, on the Mac, Alex also edits the body (rev 8).
3. When the phone's mutation arrives, `baseValues.body ≠ current body`, so the long-text rule applies.
4. The Mac keeps its text and creates *Trip ideas (phone version, 12 Oct 14:02)* with the phone's body.
5. The mutation is acked `conflicted`, and a conflict entry appears on both apps.
6. The phone shows a banner on the original note: "Your phone edit was saved as a separate copy."

**A deletion.**

1. On the phone, Alex deletes event *Dentist*. Mobile submits `archive` (base rev 3).
2. The row disappears, with Undo for 7 s, and moves to Recently deleted.
3. The Mac applies it: `deleted_at` is set, rev 4.
4. The publisher writes a tombstone; the Mac calendar no longer shows the event.
5. Twenty days later, Alex taps Restore on the phone. The `restore` mutation applies, rev 5, and the event returns on both.
6. If the Mac had edited the event after rev 3, the delete would have become a conflict prompt instead.

## 4.12 Infrastructure and services required

- **Required (existing):** the Firebase project the apps already use, with Authentication (email/password) and Firestore. The same account, no new service.
- **Required (new configuration, same project):** Firestore security rules restricting `users/{uid}/**` to `request.auth.uid == uid`, and Firebase Hosting for the mobile web app.
  - ⚠ Neither repository contains `firestore.rules` or `firebase.json`. The current rules (possibly written for briizOS.Web) must be retrieved from the Firebase console before any change (decision **D5**).
- **Optional, later:** Cloud Storage (Blaze plan) for binaries (D10); an Apple Developer Program membership only if D1 chooses a native wrapper.
- **Quota check (estimate, not measured):**
  - Mac polling, one mutation query per 15 s, is about 5,800 reads/day minimum.
  - Publishing 200 changes/day is 200 writes.
  - A phone cold start with 3,000 records is about 3,000 reads; cached resumes are cheaper.
  - This fits the free 50k reads / 20k writes per day. The Mac's Health card should show daily counts so the owner can see it.

## 4.13 Keeping source code aligned vs. keeping user data aligned

These are different problems with different tools:

- **Source-code agreement** (developer-time): the vendored `shared/` contract, fixtures and checksums (§1.5).
  - Drift is caught by `scripts/shared-contract.mjs check` before mobile work is committed, and by the contract version gate at runtime.
  - Owner: whoever changes the desktop data model updates `shared/sync-contract/v1.json` in the same change.
- **User-data agreement** (run-time): records, mutations, revisions, receipts and conflicts (§4.3–4.10).
  - Drift is caught by revision checks and visible conflict records.
  - Owner: the Mac's publisher/applier.

A mismatch in the first causes rejected mutations (`rejected: CONTRACT_MISMATCH`). It never causes silent data loss, because the Mac validates every patch against its own column validators.

---

# 5. Steps for the port

## 5.1 Ordering logic

Data agreement (Phases 1–4) precedes most mobile UI, because every preserved workflow reads and writes desktop records. Phase 0 removes defects that would otherwise contaminate later verification. Each phase lists outcome, per-repository changes, files, prerequisites/decisions, completion criteria with **future** verification (the owner or a later agent performs it; nothing was run for this plan), and risks with rollback.

## 5.2 Releases

- **Release 1 (end of Phase 5), the smallest useful release:**
  - sign in on the phone;
  - see and edit the Mac's tasks/steps, notes, events and placements, online or offline;
  - see whether the Mac is online and what is pending;
  - send "Ask my Mac" runs and watch them finish;
  - chat from the phone without losing conversations;
  - read an activity log.
  Installed as a Home Screen app.
- **Release 2 (end of Phase 6):** journals synced with rich text; existing phone journals moved to the Mac; Mac conversation history readable on the phone; phone conversations visible on the Mac.
- **Release 3 (end of Phases 7–8):** Notefalls text posts, canvases preview, settings/model mirrors, Skills registry (read-only), conflict/recently-deleted center, tablet layouts, theme parity, gesture refinements.
- **Enhancements (Phase 9):** notifications, voice, photo capture, share/Shortcuts capture, Execubriiz entries, optional Capacitor wrapper.

---

### Phase 0 — Repository preparation and protection

- **User-visible outcome:**
  - The mobile build passes type-checking again.
  - The app shows an Activity log.
  - Safe areas work on iPhone.
  - Phone journals can be exported to a file.
- **briizos-mobile:**
  1. Fix `import type { ViewId } from '.App'` → `'../App'` in `src/components/BottomNav.tsx:2` and `src/views/MenuView.tsx:2`. **Hygiene (Hard Rule 3):** move `ViewId` into `src/types/navigation.ts` and import it via the `@/` alias (`mobile:tsconfig.app.json:11-16`), so relative-path typos cannot recur.
  2. `index.html`: `viewport-fit=cover`; add `<meta name="theme-color">`.
  3. Port the logger: `src/lib/logger.ts` with the desktop entry shape and categories (`local:src/lib/logger.js:1-60`), an IndexedDB sink (keep 5,000 entries), and `src/views/ActivityView.tsx` reachable from Menu. Instrument the existing Firestore writes in `mobileSyncService.ts` and the provider calls in `chatApi.ts`.
  4. Journals: add "Export journals (.json)" to the library header menu (uses the existing `loadMobileJournals`).
  5. With owner confirmation (**D12**), remove `src/views/merger.py`, `src/pages/Home.tsx`, `src/components/AddressBar.tsx`, `kimi-plugin-inspect-react`; set `package.json` `name` to `briizos-mobile`; add `.nvmrc` = 24; add `AGENTS.md` adopting the desktop rules that apply to mobile.
- **briizos-local:** none.
- **Prerequisites/decisions:** D12 (adopt AGENTS.md rules for mobile; approve deletions).
- **Completion criteria / future verification:**
  - `npm run build` succeeds.
  - On an iPhone, the tab bar clears the home indicator.
  - Every chat send and record save appears in Activity with a plain-language message.
  - An export file opens and contains all journals.
- **Risks / rollback:** low; all changes are local to mobile. Revert by commit.

### Phase 1 — Shared sync contract v1

- **User-visible outcome:** none directly. This is the agreement both apps build on.
- **briizos-local:**
  1. Create `shared/sync-contract/v1.json`. For each Release 1 domain (`tasks`, `taskSteps`, `organizer`, `placements`), list fields with camelCase names mapped to SQLite columns (e.g. `dueAt ↔ due_at`), types, enums (copy `TASK_STATUSES`, `TASK_PRIORITIES`, `ORGANIZER_TYPES` from `local:electron/local-data-service.js:13-18`), required fields, max lengths (copy from the service validators), relationships, `textFields` (for the long-text conflict rule), and allowed mutation ops.
  2. `shared/sync-contract/fixtures/`: row → published doc; doc → mobile UI shape (`mapItem` equivalence, `local:src/context/OrganizerContext.jsx:16-37`); 10 placement recurrence cases; mutation cases (fast path, field merge, text conflict, stale delete, duplicate).
  3. Migration `electron/local-data/schema/017_sync_v1.sql`: `sync_conflicts`; `organizer_items.all_day`, `organizer_items.source_key` (+ unique partial index); `sync_state` rows for v1 domains. Update `prisma/schema.prisma` to match (the reference model, `local:prisma/schema.prisma:1`).
  4. Make `electron/local-data-service.js` read enums from the contract JSON (`require('../shared/sync-contract/v1.json')`), so the contract cannot drift from validation.
- **briizos-mobile:**
  1. `scripts/shared-contract.mjs` (pull/check) and `src/shared/SOURCE.json`.
  2. A generator for `src/shared/sync-contract.d.ts` + zod schemas.
- **Prerequisites/decisions:** D3 (authority model; default Option A), D11 (conflict policy).
- **Completion criteria / future verification:**
  - The desktop app starts and migration 017 is recorded in `schema_migrations`.
  - Desktop validation rejects the same invalid values as before.
  - `shared-contract check` passes in mobile.
- **Risks / rollback:** a migration error blocks desktop startup (migrations run in transactions and are checksum-guarded, `local:electron/local-data-service.js:283-290`). Take a manual copy of `briizos.db` before the first run. 017 is additive; rollback means restoring the copy.

### Phase 2 — Desktop publisher, backfill, rules, sync health

- **User-visible outcome:** the Mac publishes its Release 1 records to the cloud replica and shows sync health in Settings → Health.
- **briizos-local:**
  1. `electron/sync/publisher.js` (new): `start/stop`, the `changed` listener with 2 s debounce, `listChangedSince` per domain, batch PATCH via the gateway's `request/put` (`local:electron/cloud-gateway.js:132-147`), tombstones, manifest docs, cursor persistence, exponential backoff, and Log Panel entries for every batch and failure.
  2. `LocalDataService.listChangedSince(domain, cursor, limit)` for tasks, task_steps, organizer_items, placements (include soft-deleted rows).
  3. Wire it into `CloudGateway` (start when `primary`, stop on `clearSession`), plus IPC `cloud:sync-status` and a Health card in `src/components/overlays/DashboardOverlay.jsx` (Settings tabs at `:1558-1565`) showing last publish, counts, failures and daily Firestore op counts.
  4. `firebase/firestore.rules` + `firebase.json` (rules section only) committed in briizos-local, written **after** retrieving the console's current rules (D5).
- **briizos-mobile:** none.
- **Prerequisites/decisions:** D4 (confirm the desktop `.env` `VITE_FIREBASE_PROJECT_ID` is `briizos` and the same account), D5.
- **Completion criteria / future verification:**
  - With the Mac signed in, `syncV1/tasks/items` count equals non-deleted + tombstoned tasks.
  - Renaming a task updates its doc within about 3 s.
  - Disconnecting the network produces a logged failure and a later successful retry.
- **Risks / rollback:**
  - Quota burn from a bug loop: cap publishes per minute and log when capped.
  - Rules mistakes could lock out Web: deploy rules only after D5.
  - Rollback: disable the publisher with a setting flag (`app_meta sync_v1_enabled`); the published docs are inert.

### Phase 3 — Desktop mutation applier

- **User-visible outcome:** changes submitted from any client are applied on the Mac with visible results and conflicts.
- **briizos-local:**
  1. `electron/sync/applier.js` (new): poll `syncV1Mutations` (status `pending`) in the existing 15 s poll (`local:electron/cloud-gateway.js:199-233`), apply each via `LocalDataService.applyRemoteMutation`, write the ack fields, log.
  2. `applyRemoteMutation`: receipt check → per-op handling → field merge rules (§4.5) → `sync_conflicts` row and conflict copy for text → receipt write, all in one transaction. New helpers `createWithClientId`, `restoreRow`.
  3. Conflict list + resolve actions in the Health card (keep mine/other/both).
- **briizos-mobile:** none (fixtures drive the tests).
- **Prerequisites:** Phase 2.
- **Completion criteria / future verification:** hand-written mutation docs (using fixture JSON) produce the fixture outcomes. Re-sending the same `mutationId` produces no second change.
- **Risks / rollback:**
  - Wrong merge corrupts a field: every applied mutation's previous values are stored in the receipt `result_json`, so an "Undo remote change" action restores them.
  - Kill switch: the same `sync_v1_enabled` flag.

### Phase 4 — Mobile sync client, navigation shell, Mac status

- **User-visible outcome:**
  - The phone shows the Mac's real tasks, notes, events and placements, offline-capable.
  - The new five-tab navigation.
  - An honest Mac/phone status chip.
- **briizos-mobile:**
  1. `src/services/firebaseClient.ts`: `initializeFirestore` with `persistentLocalCache`.
  2. `src/services/sync/`:
     - `client.ts` (listeners per domain, cursor after first load);
     - `mutations.ts` (create mutation docs + IndexedDB outbox mirror, re-submit on launch);
     - `overlay.ts` (canonical ⊕ pending, drop when `rev ≥ resultRev` or `lastMutationId` matches);
     - `macStatus.ts` (devices + primary lease);
     - `briizApi.ts`: the adapter with desktop-shaped methods (§1.3).
  3. Per-domain hooks `useTasks`, `useTaskSteps`, `useOrganizer`, `usePlacements` over `briizApi.onChanged`.
  4. Replace `BottomNav` items with Home/Plan/Chats/Journals/Menu; route `SettingsView`; per-tab stacks in `App.tsx` (remove the unused `tabs` state).
  5. The header status chip replaces `SyncStatusStrip` semantics.
  6. Keep `mobileSyncService.ts` only behind Settings → Sync → "Earlier Web records (read-only)" for D6; remove its write paths.
  7. After verifying pending-write durability on device, decide whether the IndexedDB outbox mirror stays (keep by default).
- **briizos-local:** (D6 default) Settings → Health → "Import earlier Web/Mobile records" using the legacy adapters, writing `source_key = legacy:…`.
- **Prerequisites:** Phases 1–3.
- **Completion criteria / future verification:**
  - Airplane mode after first load still shows all records.
  - Creating a task offline shows "Waiting for Mac" and becomes canonical after reconnect with the Mac running.
  - The Mac chip reads "last seen" correctly when the Mac app quits.
  - The legacy import run twice creates no duplicates.
- **Risks / rollback:** Firestore cache growth on the phone (cap listeners to non-deleted records plus 30 days of tombstones). Rollback: a feature flag keeps the old Files view reachable for one release.

### Phase 5 — Release 1 workflows and installable app

- **User-visible outcome:** Release 1 (§5.2).
- **briizos-mobile:**
  1. **Plan tab:** `src/views/plan/PlanView.tsx` (Tasks · Day · Month), `TaskDetail.tsx` (steps with reorder mode), `DayTimeline.tsx` (port the lane algorithm from `local:src/components/calendar/DayTimeline.jsx:28-95` as pure TS with fixtures), `MonthGrid.tsx`, `EventSheet.tsx` (all-day toggle maps to `allDay`), `calendarQuickAdd.ts` (port of `local:src/lib/calendarQuickAdd.js`).
  2. **Notes & Records:** refactor `FilesView.tsx` to use `briizApi`, the in-app delete sheet, and color row; rename it.
  3. **Home:** rewrite `HomeView.tsx`: status chip, composer → Chats, Today list, capture row (note/task/event).
  4. **Ask my Mac:**
     - `src/services/remoteRuns.ts` writes `briizosLocalCommands/{uuid}` with exactly the fields the gateway checks (`local:electron/cloud-gateway.js:206-225`: `schemaVersion:1`, `kind:'execute_task'`, `targetDeviceId`, `idempotencyKey`, `instruction`, `contextText`, `requestedAt`, `expiresAt`) and listens to `briizosLocalRuns`.
     - Add `src/views/RunsView.tsx` (replaces `AutomationsView.tsx`) and entry points in Chats ("Run on Mac") and Task detail.
  5. **Chats:**
     - Persist conversations to IndexedDB (`src/services/chatStore.ts`); keep the conversation across navigation.
     - Move the Settings tab into Settings → Models & keys.
     - Use the shared model catalog.
     - Rebind tools to `briizApi` with desktop tool names.
  6. **PWA:** `public/manifest.webmanifest` (`display: standalone`, icons), service worker (precache build, update prompt), Firebase Hosting config `firebase.json` (hosting section) in mobile; an install instructions screen.
- **briizos-local:**
  1. Remote runs: show phone-originated runs in Tasks/Activity with source "Phone" (the data exists, `commands.source = 'remote'`).
  2. `CloudGateway.poll` processes up to 100 commands per poll (`:204`); leave it as is, but log ignored commands with reasons.
- **Prerequisites/decisions:** D1 (delivery), D7 (phone keys), D8/D9 (visual), D13 (hosting).
- **Completion criteria / future verification:** each workflow in §2.3 for Release 1 works end to end on an iPhone Home Screen install, including offline create → Mac apply, a remote run reaching Completed, a run expiring while the Mac is off, and a chat surviving app switch.
- **Risks / rollback:** hosting misconfiguration (keep the previous deploy; Firebase Hosting supports rollback to prior releases). Remote runs execute with the Mac's task permission ceiling (`local:electron/automation-runner.js:52-71`); keep the default `ask-always` so phone requests cannot run destructive tools unattended.

### Phase 6 — Journals and conversations (Release 2)

- **User-visible outcome:**
  - Desktop journals on the phone with rich text.
  - Phone journals moved to the Mac.
  - Shared conversation history.
- **briizos-local:**
  1. Contract v1 adds `journals`, `folios`, `threads`, `messages` (fields, `textFields: folios.content, messages.contentText`).
  2. Publisher support; journals currently write the `forest` domain revision (`local:electron/local-data-service.js:1955,1988`). Change-detection uses `updated_at`, so no domain rename is needed.
  3. Templates/covers/pages move to `shared/journal-templates.v1.json`; `src/components/journals/templates.js` reads it.
  4. Execubriiz journals published as journal metadata + entries read-only; respect privacy: **Private** entries are never published.
  5. Threads: publish the last 200 threads and their messages (text only); phone-created threads arrive via `create` mutations with `kind: 'mobile-chat'`.
- **briizos-mobile:**
  1. Journal store moves to `briizApi` (journals/folios). Add `@tiptap/core` and the same extensions/versions as desktop (`local:package.json:27-34`); `src/features/journals/RichTextEditor.tsx` with a keyboard accessory bar.
  2. Migration flow for `localStorage` journals (§4.10 step 2).
  3. Chats list merges phone (IndexedDB, synced) and Mac threads; Mac threads open read-only with "Continue on Mac" or "Continue here (phone model)".
- **Prerequisites:** Phase 5.
- **Completion criteria / future verification:**
  - A desktop journal with bold/headings/lists round-trips unchanged after a phone edit of a different paragraph.
  - Concurrent folio edits create a conflict copy.
  - Migrated phone journals appear on the Mac with the original IDs.
- **Risks / rollback:** TipTap schema mismatch (missing extension) could strip marks. Mitigation: register all desktop extensions (`local:src/components/journals/richtext.jsx:4-11` + custom FontSize); folio patches carry the whole `content` but are rejected by the Mac if the doc fails `document.js` validation. Rollback: the phone opens journals read-only via a flag.

### Phase 7 — Remaining Release 3 capabilities

- **User-visible outcome:**
  - Notefalls (text) on the phone.
  - Canvases preview.
  - Settings/model mirrors and the Today plan card.
  - Skills (read-only) and Memory (read-only).
  - The conflict/recently-deleted center.
- **briizos-local:**
  1. Contract adds `notefallPosts` (text fields, attachment descriptors), `canvases` (metadata; HTML ≤ 900 KB, else "Open on Mac"), `settingsMirror` (`selected_model`, `briizify_plan`, `ui_theme` only), `modelProfiles` (no secrets), `skills` (name, description, enabled; from the skill discovery in `local:electron/agent/system-prompt.js`, noting that `skills-get-list` returns config entries only, `local:electron/main.js:811-814`), `memorySections` (read-only).
  2. "Rebuild from cloud replica" recovery for empty DBs.
- **briizos-mobile:** `NotefallsView`, `CanvasesView` (sandboxed iframe), `SkillsView` rewritten over real data (the static samples are removed), a Today plan card, `ConflictsView`, a Memory read-only page.
- **Completion criteria / future verification:**
  - A Notefalls post written on the phone appears on the Mac timeline.
  - A canvas renders without access to the app origin.
  - The skills list matches the Mac's enabled set.
- **Risks:** canvas HTML is untrusted (AI-generated); the iframe sandbox without `allow-same-origin` is mandatory.

### Phase 8 — Mobile interaction refinements and tablet

- **User-visible outcome:**
  - Polished gestures.
  - Tablet split layouts.
  - iPad keyboard shortcuts.
  - Theme parity.
  - An accessibility pass.
- **briizos-mobile:**
  - Swipe actions with undo; long-press drag in Day view; reorder modes; `visualViewport` composer handling.
  - Sidebar + list–detail at ≥ 768 pt; journal spreads in landscape.
  - ⌘⇧ shortcuts on iPad mirroring `local:src/App.jsx:1210-1229`.
  - Theme subset driven by the mirrored `ui_theme`.
  - Move inline appearance values (e.g. `mobile:src/components/BottomNav.tsx:37-41`) into `App.css`.
  - Icon system per D8.
- **Prerequisites:** owner mockups for phone and tablet screens (D9). Per `local:AGENTS.md:31-32`, the mockups are canonical.
- **Completion criteria / future verification:**
  - A VoiceOver walk-through of each tab.
  - 44 pt hit areas.
  - Reduced-motion respected.
  - Layouts compared against the mockups.

### Phase 9 — Enhancements (each gated by its decision)

1. **Notifications:**
   - Mobile stores a Web Push subscription in `users/{uid}/pushSubscriptions/{deviceId}`.
   - The Mac sends via VAPID when runs change to `completed`/`failed`/`waiting_for_user` and when placements are due. This needs the `web-push` npm dependency in briizos-local.
   - The VAPID private key is held in desktop `secrets`.
2. **Voice:** a `MediaRecorder` → provider transcription service; mic button in composers.
3. **Photo capture:** D10 storage path; mobile camera input; desktop downloader creating `external_files` rows under `userData/attachments/`.
4. **Share/Shortcuts capture:** a `/capture` route + an iOS Shortcut recipe; Android `share_target`.
5. **Execubriiz entries from the phone:** a mutation op for `exec_entries`; Mac workers pick them up.
6. **Capacitor 8 wrapper** (only if D1 changes): iOS 15+ minimum; use `initializeAuth(app, { persistence: indexedDBLocalPersistence })` on native, because `getAuth()` is reported to hang in Capacitor WebViews ([community report](https://forum.ionicframework.com/t/firebase-auth-in-sdk-9-does-not-work-on-ios-sim-or-devices/215362), [Capgo guide](https://capgo.app/docs/plugins/social-login/firebase/introduction/)).

## 5.3 Capability traceability

| Desktop capability | Phase / disposition | Reason if deferred |
|---|---|---|
| Account login | P4 (already on mobile; sign-in status unified) | — |
| Tasks + steps | P5 | — |
| Deck Maker, task automation | P5 via Ask my Mac | Runs on the Mac agent |
| Briizify plan | P7 (read-only glance) | Planning runs headless agent turns on the Mac (`local:src/hooks/useBriizify.js:1-12`) |
| Calendar events, placements, quick-add | P5 | Per-occurrence edits beyond completion wait for a desktop exception model |
| AI day planner | P5 via Ask my Mac (Day mode) | Mac agent |
| Organizer / sticky notes | P5 (content, color) | Geometry is desktop-only |
| Chat (phone provider) | P5 | — |
| Chat with Mac agent, modes, approvals | P5 (runs), P6 (history) | Approvals stay on the Mac (permission design) |
| Conversation browser, tags | P6 (search by title/tags) | — |
| Journals (standard) | P6 | — |
| Execubriiz | P6 read-only, P9 entry capture | AI workers are Mac-only |
| Notefalls | P7 text, P9 photos | Binary transfer needs D10 |
| Canvases | P7 preview | Editing needs the desktop flow |
| Settings: model/routing | P5 phone keys; P7 mirror of Mac selection | Mac secrets never leave the Mac |
| Memory | P7 read-only | Editing affects the agent prompt on the Mac |
| Skills | P7 read-only | Skill files live on the Mac |
| Log Panel | P0 phone activity log; Mac logs stay on the Mac | Mac logs are large and include developer AI audit |
| Sources (files, GitHub, Drive) | **Deferred** → Ask my Mac | Mac file system and desktop-held tokens |
| Media player | **Deferred** | Plays local Mac files; a remote control is possible later if wanted |
| Forest | **Deferred** | Spotlight, file paths and FileHawk are Mac-only (`local:electron/forest-fs.js`) |
| briizy avatar, capture, Rewind, proposals, goals | **Deferred** | Native macOS capture; the privacy invariant I9 forbids syncing |
| briiZtorm 3D | **Deferred** | Heavy WebGL app with no evident mobile workflow |
| Theme Studio / Chromap | **Deferred** (P8 consumes the selected theme only) | Desktop stylesheet editor |
| Dock, tiling, floats, shell modes | **Not ported by design** | Replaced by mobile navigation |
| AI visibility / audit | **Deferred** | Developer records; size and privacy |
| Codex subscription | Via Ask my Mac | Codex CLI runs on the Mac (`local:docs/shipping-debt.md:16-30`) |
| Phantom section | **Deferred** | Hard-coded Mac path `/Users/alex/Documents/Cufolio/phantom` (`local:src/components/PhantomSection.jsx:6`) |
| Header weather | **Not ported** | No workflow need |

## 5.4 Unresolved decisions

| ID | Decision | Recommended default | Work that depends on it |
|---|---|---|---|
| D1 | Phone platform and delivery | iPhone, installed Home Screen web app (works on Android Chrome too); Capacitor later only if share sheet/widgets are required | P5 packaging, P9 items 4/6/9 |
| D2 | Sync before UI (this plan) vs Firebase-last (Sept 13 audit) | Sync first (P1–P4). With Firebase-last, mobile would keep showing legacy Web data, and every mobile view would be rewired twice | Whole sequence |
| D3 | Authority model | Desktop authoritative, Firestore relay (Option A) | P1–P4 |
| D4 | Confirm desktop `.env` uses Firebase project `briizos` and the same account | Yes, the same project | P2 |
| D5 | Firestore rules ownership; is briizOS.Web still active? | Retrieve current rules first; keep Web paths readable; commit rules in briizos-local | P2, P4 legacy import |
| D6 | Import legacy Web/Mobile Firestore records | Import once on the Mac, idempotent, never delete originals | P4 |
| D7 | Provider API keys on the phone | Keep, device-local, clearly labeled; remote approvals not allowed | P5 Chats, Settings |
| D8 | Icons on mobile (SF Symbols vs current lucide) | Verify SF glyph rendering on iPhone; use SF Symbols if it works and the target is Apple-only; otherwise keep lucide | P8 |
| D9 | Mobile mockups | The owner supplies Home/Plan/Chats mockups before P8 polish; P5 uses the current mobile visual language | P5 visuals, P8 |
| D10 | Binary attachments (Cloud Storage/Blaze or thumbnails-in-Firestore) | Defer; then Cloud Storage if the project is already on Blaze | P7 Notefalls media, P9 photos |
| D11 | Conflict policy | Scalars: later edit wins with Undo; text: keep both | P3 |
| D12 | Adopt desktop AGENTS.md rules for mobile; approve removing stray files | Adopt (logging, two-layer fixes, style monolith, density, no build/test runs by agents) | P0 and every later phase |
| D13 | Hosting | Firebase Hosting in the same project | P5 |

## 5.5 First concrete implementation task

**Create the v1 sync contract for the Release 1 domains in briizos-local** (Phase 1, steps 1–2). It is unblocked by D4/D5 and makes everything after it mechanical.

1. Create `briizos-local/shared/sync-contract/v1.json` with this top-level shape:
   ```json
   {
     "contractVersion": 1,
     "idPattern": "^[A-Za-z0-9][A-Za-z0-9._:-]*$",
     "idMaxLength": 128,
     "mutationOps": ["create", "patch", "archive", "restore", "reorder"],
     "domains": {
       "tasks":      { "table": "tasks",          "fields": { … }, "textFields": ["description"], "relations": { "projectId": "organizer" } },
       "taskSteps":  { "table": "task_steps",     "fields": { … }, "textFields": [],              "relations": { "taskId": "tasks" } },
       "organizer":  { "table": "organizer_items","fields": { … }, "textFields": ["body"],        "relations": { "parentId": "organizer" } },
       "placements": { "table": "placements",     "fields": { … }, "textFields": [],              "relations": { "refId": "tasks" } }
     }
   }
   ```
   - Each field entry is `{ "column": "due_at", "type": "integer|string|boolean|json", "nullable": true, "max": 500, "enum": [...] }`, copied from the validators in `electron/local-data-service.js`:
     - tasks: `1241-1289`;
     - task steps: `1506-1540`;
     - organizer: `1578-1668`;
     - placements: `1417-1490`.
   - Add `organizer.allDay` (column `all_day`, boolean) and `organizer.sourceKey` as **contract-only fields marked `"since": 1, "requiresMigration": "017"`**, so the migration in the next task has a specification.
2. Add `shared/sync-contract/fixtures/tasks.json` with three cases: a row as returned by `listTasks`, the published Firestore doc for it, and the mobile UI shape.
3. Add `shared/README.md` stating the rules from §1.5: the canonical location, "change here first", and the mobile `pull/check` script.
4. Per `local:AGENTS.md:12-15`, report to the owner what changed (nothing visible yet), which files were added, and how to look at them. Do not run checks.

---

*Sources consulted for platform facts:*
- [Firestore offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Firestore quotas](https://firebase.google.com/docs/firestore/quotas)
- [Cloud Storage plan changes FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [WebKit: Web Push for Home Screen web apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [WebKit: storage cap and Home Screen apps](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [MDN: Web Share Target](https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target)
- [MDN: SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Capacitor support policy](https://capacitorjs.com/docs/main/reference/support-policy)
- [Ionic forum: Firebase Auth in Capacitor iOS](https://forum.ionicframework.com/t/firebase-auth-in-sdk-9-does-not-work-on-ios-sim-or-devices/215362)
- [Capgo: Firebase in Capacitor](https://capgo.app/docs/plugins/social-login/firebase/introduction/)
- [Apple Developer Forums: SF Symbol license](https://developer.apple.com/forums/thread/757407)
- [Apple Developer Forums: SF fonts in web apps](https://developer.apple.com/forums/thread/733267)
