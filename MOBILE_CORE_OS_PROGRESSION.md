


# briizOS Mobile Core OS Progression

## Stage 1 - Sync Foundation
- ~~Add Firebase client setup using the same project as `briizOS.Web`.~~
  - Evidence: `src/services/firebaseClient.ts`
  - Evidence: `package.json`
- ~~Add canonical TypeScript types for organizer items, calendar events, tasks, timer state, chat settings, sync state, and Web window-state backing records.~~
  - Evidence: `src/types/briizos.ts`
- ~~Add SyncContract-compatible adapters for reads/writes.~~
  - Evidence: `src/services/syncAdapters.ts`
  - Evidence: `../SyncContract.md`
- ~~Add a mobile sync service with auth-state awareness, Firestore listeners, and write helpers.~~
  - Evidence: `src/services/mobileSyncService.ts`
  - Evidence: `src/hooks/useBriizOSSync.ts`
- ~~Wire the app shell to display sync status and live collection counts.~~
  - Evidence: `src/components/SyncStatusStrip.tsx`
  - Evidence: `src/App.tsx`

## Stage 2 - Account And Data Browser
- ~~Add mobile login/logout/account controls.~~
  - Evidence: `src/components/AccountControls.tsx`
  - Evidence: `src/services/mobileSyncService.ts`
  - Evidence: `src/views/MenuView.tsx`
- ~~Replace the static Files/Menu surfaces with live organizer, event, task, and timer summaries.~~
  - Evidence: `src/views/FilesView.tsx`
  - Evidence: `src/views/MenuView.tsx`
  - Evidence: `src/App.tsx`
- ~~Keep every destructive action behind a confirmation.~~
  - Evidence: `src/services/mobileSyncService.ts`
  - Evidence: `src/lib/confirmDestructiveAction.ts`
  - Evidence: `src/views/FilesView.tsx`


## Stage 3 - Organizer, Notes, And Calendar
- ~~Replace mock note/file/calendar flows with real create, edit, complete, archive/delete, and schedule actions.~~
  - Evidence: `src/views/FilesView.tsx`
  - Evidence: `src/services/mobileSyncService.ts`
- ~~Preserve the phone shell while using mobile-first list/detail screens instead of Web's floating desktop windows.~~
  - Evidence: `src/views/FilesView.tsx`
  - Evidence: `src/App.tsx`
- ~~Keep Firestore writes on canonical fields from `SyncContract.md`.~~
  - Evidence: `src/services/syncAdapters.ts`
  - Evidence: `src/views/FilesView.tsx`
  - Evidence: `../SyncContract.md`

## Stage 4 - AI Chat And Tool Registry
- ~~Port Web's direct client-side API key pattern and chat settings.~~
  - Evidence: `src/services/chatSettings.ts`
  - Evidence: `src/services/chatApi.ts`
  - Evidence: `../briizOS.Web/public/modules/chat-module/chat-settings.js`
  - Evidence: `../briizOS.Web/public/modules/chat-module/chat-api.js`
- ~~Rebuild the chat widget as React state, then connect read-only and write tools through confirmation UI.~~
  - Evidence: `src/views/ChatsView.tsx`
  - Evidence: `src/services/mobileToolRegistry.ts`
  - Evidence: `src/App.tsx`
- ~~Leave Cloud Function API-key proxying for a later stage.~~
  - Evidence: `src/services/chatApi.ts`

## Stage 5 - Timer, Automations, And Settings
- Port the timer runtime and app/timer sync.
- Turn Automations into saved scheduled prompts/tasks/events.
- Add mobile settings for provider/model/API keys, sync visibility, and basic app preferences.

## Stage 6 - Polish And Parity Audit
- Compare mobile behavior against the approved Core OS scope.
- Confirm cross-client create/update/delete propagation with `briizOS.Web`.
- Defer non-core Web extras unless they become necessary: visual filters, archive UI, Google Calendar sync, decorative backgrounds, and full external content embedding.
