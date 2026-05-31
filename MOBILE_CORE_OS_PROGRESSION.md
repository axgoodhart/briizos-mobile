


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


<continuity comment>
# DELETE THIS CONTINUITY COMMENT AFTER THE NEXT WORK PERFORMED ON THE APP. For context, stage two was just completed. Its final interaction was

Me: I would like to remove the panel nomenclature entirely from this version. We will deal with adding new state tracking parameters to organizer objects later
7:27 AM



Worked for 5m 18s
Codex: Done. I removed the old nomenclature from the mobile-facing version.

What a user experiences now:

The app still keeps the same phone-shell look.
Files shows only user-facing synced objects: Organizer, Events, Tasks, and Timer.
Menu data counts no longer expose hidden Web window-state records.
The sync strip no longer reports hidden backing entries.
The progression doc no longer describes user-visible “panel” work.
Code cleanup:

Renamed mobile route components from src/panels/*Panel.tsx to src/views/*View.tsx.
Renamed app navigation concepts from PanelId / activePanel to ViewId / activeView.
Renamed internal mobile type names to BriizWindowState for Web compatibility state.
Updated evidence paths in MOBILE_CORE_OS_PROGRESSION.md.
The only remaining old collection name is in the hidden sync layer where mobile must read Web’s existing Firebase path. I did not add new organizer state tracking parameters yet. I did not run checks or start a server.
</continuity comment>


## Stage 3 - Organizer, Notes, And Calendar
- Replace mock note/file/calendar flows with real create, edit, complete, archive/delete, and schedule actions.
- Preserve the phone shell while using mobile-first list/detail screens instead of Web's floating desktop windows.
- Keep Firestore writes on canonical fields from `SyncContract.md`.

## Stage 4 - AI Chat And Tool Registry
- Port Web's direct client-side API key pattern and chat settings.
- Rebuild the chat widget as React state, then connect read-only and write tools through confirmation UI.
- Leave Cloud Function API-key proxying for a later stage.

## Stage 5 - Timer, Automations, And Settings
- Port the timer runtime and app/timer sync.
- Turn Automations into saved scheduled prompts/tasks/events.
- Add mobile settings for provider/model/API keys, sync visibility, and basic app preferences.

## Stage 6 - Polish And Parity Audit
- Compare mobile behavior against the approved Core OS scope.
- Confirm cross-client create/update/delete propagation with `briizOS.Web`.
- Defer non-core Web extras unless they become necessary: visual filters, archive UI, Google Calendar sync, decorative backgrounds, and full external content embedding.
