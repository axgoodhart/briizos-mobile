import { type FormEvent, useMemo, useState } from 'react';
import {
  Archive,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  ListTodo,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  type LucideIcon } from
'lucide-react';
import { confirmDestructiveAction } from '../lib/confirmDestructiveAction';
import { getMobileSyncService } from '../services/mobileSyncService';
import type { BriizCalendarEvent, BriizOSMobileState, BriizOrganizerItem, BriizTask } from '../types/briizos';

interface FilesViewProps {
  sync: BriizOSMobileState;
}

type SectionId = 'organizer' | 'events' | 'tasks' | 'timer';
type EditableSectionId = Exclude<SectionId, 'timer'>;

interface BrowserItem {
  id: string;
  name: string;
  subtitle: string;
  editableKind?: EditableSectionId;
}

interface BrowserSection {
  id: SectionId;
  name: string;
  icon: LucideIcon;
  children: BrowserItem[];
}

interface OrganizerFormState {
  title: string;
  body: string;
  tags: string;
  status: string;
  scheduledDate: string;
}

interface TaskFormState {
  title: string;
  status: string;
  priority: string;
  dueDate: string;
}

interface EventFormState {
  title: string;
  body: string;
  scheduledDate: string;
  time: string;
  status: string;
  allDay: boolean;
}

type EditorState =
{kind: 'organizer';mode: 'create' | 'edit';id: string;form: OrganizerFormState;} |
{kind: 'tasks';mode: 'create' | 'edit';id: string;form: TaskFormState;} |
{kind: 'events';mode: 'create' | 'edit';id: string;form: EventFormState;};

interface SaveOverrides {
  status?: string;
  completed?: boolean;
  completedAt?: number | null;
  scheduledDate?: string | null;
  dueDate?: string | null;
}

function formatTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function createItemId(kind: EditableSectionId) {
  const prefix = kind === 'organizer' ? 'note' : kind === 'tasks' ? 'task' : 'event';
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseTags(value: string): string[] {
  return value.
  split(',').
  map((tag) => tag.trim()).
  filter(Boolean);
}

function fallbackTitle(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function stripUndefined<T extends object>(value: T): T {
  const clean = { ...value } as Record<string, unknown>;
  Object.keys(clean).forEach((key) => {
    if (clean[key] === undefined) delete clean[key];
  });
  return clean as T;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function editorLabel(kind: EditableSectionId) {
  if (kind === 'organizer') return 'Note';
  if (kind === 'tasks') return 'Task';
  return 'Event';
}

function isEditorComplete(editor: EditorState) {
  if (editor.kind === 'tasks') return editor.form.status === 'completed';
  return editor.form.status === 'done';
}

export default function FilesView({ sync }: FilesViewProps) {
  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    organizer: true,
    events: false,
    tasks: false,
    timer: false
  });
  const [sortAsc, setSortAsc] = useState(true);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  const sections = useMemo<BrowserSection[]>(() => {
    const timerItem = sync.timer ? [{
      id: 'timer',
      name: `${sync.timer.mode} ${sync.timer.running ? 'running' : 'idle'}`,
      subtitle: sync.timer.mode === 'timer' ? formatTimer(sync.timer.remaining) : formatTimer(sync.timer.elapsed)
    }] : [];

    return [
    {
      id: 'organizer',
      name: 'Organizer',
      icon: FileText,
      children: sync.organizer.map((item) => ({
        id: item.id,
        name: item.title || 'Untitled item',
        subtitle: `${item.type || 'note'} / ${item.status}`,
        editableKind: 'organizer'
      }))
    },
    {
      id: 'events',
      name: 'Events',
      icon: Calendar,
      children: sync.events.map((event) => ({
        id: event.id,
        name: event.title || 'Untitled event',
        subtitle: event.scheduledDate || 'unscheduled',
        editableKind: 'events'
      }))
    },
    {
      id: 'tasks',
      name: 'Tasks',
      icon: ListTodo,
      children: sync.tasks.map((task) => ({
        id: task.id,
        name: task.title || 'Untitled task',
        subtitle: `${task.status}${task.dueDate ? ` / due ${task.dueDate}` : ''}`,
        editableKind: 'tasks'
      }))
    },
    {
      id: 'timer',
      name: 'Timer',
      icon: Clock,
      children: timerItem
    }];

  }, [sync.events, sync.organizer, sync.tasks, sync.timer]);

  const visibleSections = useMemo(() => sections.map((section) => ({
    ...section,
    children: section.children.
    filter((item) => `${item.name} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase())).
    sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
  })), [query, sections, sortAsc]);

  const hasSyncedItems = sections.some((section) => section.children.length > 0);
  const writesDisabled = !sync.uid || sync.status === 'signed-out';

  function createEditor(kind: EditableSectionId): EditorState {
    const id = createItemId(kind);

    if (kind === 'organizer') {
      return {
        kind,
        mode: 'create',
        id,
        form: { title: '', body: '', tags: '', status: 'todo', scheduledDate: '' }
      };
    }

    if (kind === 'tasks') {
      return {
        kind,
        mode: 'create',
        id,
        form: { title: '', status: 'pending', priority: 'medium', dueDate: '' }
      };
    }

    return {
      kind,
      mode: 'create',
      id,
      form: { title: '', body: '', scheduledDate: todayInputValue(), time: '', status: 'todo', allDay: true }
    };
  }

  function openCreate(kind: EditableSectionId) {
    if (writesDisabled) {
      setWriteError('Sign in from Menu before writing briizOS data.');
      return;
    }

    setWriteError(null);
    setEditor(createEditor(kind));
  }

  function openExisting(kind: EditableSectionId, id: string) {
    setWriteError(null);

    if (kind === 'organizer') {
      const item = sync.organizer.find((existing) => existing.id === id);
      if (!item) return;
      setEditor({
        kind,
        mode: 'edit',
        id,
        form: {
          title: item.title || '',
          body: item.body || '',
          tags: item.tags.join(', '),
          status: item.status || 'todo',
          scheduledDate: item.scheduledDate || ''
        }
      });
      return;
    }

    if (kind === 'tasks') {
      const task = sync.tasks.find((existing) => existing.id === id);
      if (!task) return;
      setEditor({
        kind,
        mode: 'edit',
        id,
        form: {
          title: task.title || '',
          status: task.status || (task.completed ? 'completed' : 'pending'),
          priority: task.priority || 'medium',
          dueDate: task.dueDate || ''
        }
      });
      return;
    }

    const event = sync.events.find((existing) => existing.id === id);
    if (!event) return;
    setEditor({
      kind,
      mode: 'edit',
      id,
      form: {
        title: event.title || '',
        body: event.body || '',
        scheduledDate: event.scheduledDate || todayInputValue(),
        time: event.time || '',
        status: event.status || 'todo',
        allDay: event.allDay !== false
      }
    });
  }

  function updateOrganizerForm(patch: Partial<OrganizerFormState>) {
    setEditor((current) => current?.kind === 'organizer' ?
    { ...current, form: { ...current.form, ...patch } } :
    current);
  }

  function updateTaskForm(patch: Partial<TaskFormState>) {
    setEditor((current) => current?.kind === 'tasks' ?
    { ...current, form: { ...current.form, ...patch } } :
    current);
  }

  function updateEventForm(patch: Partial<EventFormState>) {
    setEditor((current) => current?.kind === 'events' ?
    { ...current, form: { ...current.form, ...patch } } :
    current);
  }

  async function saveEditor(overrides: SaveOverrides = {}) {
    if (!editor) return false;
    if (writesDisabled) {
      setWriteError('Sign in from Menu before writing briizOS data.');
      return false;
    }

    setIsSaving(true);
    setWriteError(null);

    try {
      const service = getMobileSyncService();

      if (editor.kind === 'organizer') {
        const existing = sync.organizer.find((item) => item.id === editor.id);
        const status = overrides.status ?? editor.form.status;
        const completed = overrides.completed ?? status === 'done';
        const payload: Partial<BriizOrganizerItem> & {id: string;} = {
          ...(existing ?? {}),
          id: editor.id,
          type: existing?.type || 'note',
          title: fallbackTitle(editor.form.title, 'Untitled note'),
          body: editor.form.body.trim(),
          status,
          tags: parseTags(editor.form.tags),
          scheduledDate: overrides.scheduledDate ?? emptyToNull(editor.form.scheduledDate),
          completed,
          completedAt: overrides.completedAt !== undefined ?
          overrides.completedAt :
          completed ?
          existing?.completedAt ?? Date.now() :
          null,
          createdAt: existing?.createdAt ?? Date.now()
        };
        await service.saveOrganizerItem(stripUndefined(payload));
      }

      if (editor.kind === 'tasks') {
        const existing = sync.tasks.find((task) => task.id === editor.id);
        const status = overrides.status ?? editor.form.status;
        const completed = overrides.completed ?? status === 'completed';
        const payload: Partial<BriizTask> & {id: string;} = {
          ...(existing ?? {}),
          id: editor.id,
          type: 'task',
          title: fallbackTitle(editor.form.title, 'Untitled task'),
          status,
          completed,
          priority: emptyToNull(editor.form.priority),
          dueDate: overrides.dueDate ?? emptyToNull(editor.form.dueDate),
          completedAt: overrides.completedAt !== undefined ?
          overrides.completedAt :
          completed ?
          existing?.completedAt ?? Date.now() :
          null,
          createdAt: existing?.createdAt ?? Date.now()
        };
        await service.saveTask(stripUndefined(payload));
      }

      if (editor.kind === 'events') {
        const existing = sync.events.find((event) => event.id === editor.id);
        const status = overrides.status ?? editor.form.status;
        const completed = overrides.completed ?? status === 'done';
        const scheduledDate = overrides.scheduledDate ?? emptyToNull(editor.form.scheduledDate) ?? todayInputValue();
        const payload: Partial<BriizCalendarEvent> & {id: string;} = {
          ...(existing ?? {}),
          id: editor.id,
          type: 'event',
          title: fallbackTitle(editor.form.title, 'Untitled event'),
          body: editor.form.body.trim(),
          scheduledDate,
          time: editor.form.allDay ? null : emptyToNull(editor.form.time),
          status,
          completed,
          completedAt: overrides.completedAt !== undefined ?
          overrides.completedAt :
          completed ?
          existing?.completedAt ?? Date.now() :
          null,
          allDay: editor.form.allDay,
          createdAt: existing?.createdAt ?? Date.now()
        };
        await service.saveEvent(stripUndefined(payload));
      }

      setEditor(null);
      return true;
    } catch (error) {
      setWriteError(errorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEditor();
  }

  async function toggleComplete() {
    if (!editor) return;
    const nextCompleted = !isEditorComplete(editor);
    const status = editor.kind === 'tasks' ?
    nextCompleted ? 'completed' : 'pending' :
    nextCompleted ? 'done' : 'todo';

    await saveEditor({
      status,
      completed: nextCompleted,
      completedAt: nextCompleted ? Date.now() : null
    });
  }

  async function archiveEditor() {
    await saveEditor({ status: 'archived', completed: false, completedAt: null });
  }

  async function deleteEditor() {
    if (!editor || editor.mode !== 'edit') return;

    const confirmation = confirmDestructiveAction(`Delete this ${editorLabel(editor.kind).toLowerCase()} from synced briizOS data?`);
    if (!confirmation) return;

    setIsSaving(true);
    setWriteError(null);

    try {
      const service = getMobileSyncService();
      if (editor.kind === 'organizer') await service.deleteOrganizerItem(editor.id, confirmation);
      if (editor.kind === 'tasks') await service.deleteTask(editor.id, confirmation);
      if (editor.kind === 'events') await service.deleteEvent(editor.id, confirmation);
      setEditor(null);
    } catch (error) {
      setWriteError(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (editor) {
    const complete = isEditorComplete(editor);
    const title = `${editor.mode === 'create' ? 'New' : 'Edit'} ${editorLabel(editor.kind)}`;

    return (
      <form style-id="stylo-191" onSubmit={handleEditorSubmit} className="h-full flex flex-col bg-[#000]">
        <div style-id="stylo-192" className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#252540]">
          <button style-id="stylo-193"
          type="button"
          onClick={() => setEditor(null)}
          className="w-9 h-9 rounded-xl bg-[#20203a] flex items-center justify-center text-gray-300"
          aria-label="Back to files">
            
            <ChevronLeft style-id="stylo-194" size={18} />
          </button>
          <div style-id="stylo-195" className="min-w-0 flex-1">
            <p style-id="stylo-196" className="text-white text-sm font-medium truncate">{title}</p>
            <p style-id="stylo-197" className="text-gray-500 text-xs truncate">{editor.id}</p>
          </div>
          <button style-id="stylo-198"
          type="submit"
          disabled={isSaving || writesDisabled}
          className="flex items-center gap-2 rounded-xl bg-[#3a3a55] px-3 py-2 text-sm text-white disabled:opacity-45">
            
            <Save style-id="stylo-199" size={15} />
            Save
          </button>
        </div>

        {writeError &&
        <div style-id="stylo-200" className="mx-4 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {writeError}
          </div>
        }

        <div style-id="stylo-201" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {editor.kind === 'organizer' &&
          <>
              <label style-id="stylo-202" className="block space-y-1.5">
                <span style-id="stylo-203" className="text-xs text-gray-500">Title</span>
                <input style-id="stylo-204"
              value={editor.form.title}
              onChange={(event) => updateOrganizerForm({ title: event.target.value })}
              className="zo-input w-full px-3 py-2.5 text-sm outline-none"
              placeholder="Note title" />
              
              </label>
              <label style-id="stylo-205" className="block space-y-1.5">
                <span style-id="stylo-206" className="text-xs text-gray-500">Body</span>
                <textarea style-id="stylo-207"
              value={editor.form.body}
              onChange={(event) => updateOrganizerForm({ body: event.target.value })}
              className="zo-input min-h-[150px] w-full resize-none px-3 py-2.5 text-sm outline-none"
              placeholder="Write the note" />
              
              </label>
              <div style-id="stylo-208" className="grid grid-cols-2 gap-3">
                <label style-id="stylo-209" className="block space-y-1.5">
                  <span style-id="stylo-210" className="text-xs text-gray-500">Status</span>
                  <select style-id="stylo-211"
                value={editor.form.status}
                onChange={(event) => updateOrganizerForm({ status: event.target.value })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none">
                  
                    <option style-id="stylo-212" value="todo">Todo</option>
                    <option style-id="stylo-213" value="done">Done</option>
                    <option style-id="stylo-214" value="archived">Archived</option>
                  </select>
                </label>
                <label style-id="stylo-215" className="block space-y-1.5">
                  <span style-id="stylo-216" className="text-xs text-gray-500">Schedule</span>
                  <input style-id="stylo-217"
                type="date"
                value={editor.form.scheduledDate}
                onChange={(event) => updateOrganizerForm({ scheduledDate: event.target.value })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none" />
                
                </label>
              </div>
              <label style-id="stylo-218" className="block space-y-1.5">
                <span style-id="stylo-219" className="text-xs text-gray-500">Tags</span>
                <input style-id="stylo-220"
              value={editor.form.tags}
              onChange={(event) => updateOrganizerForm({ tags: event.target.value })}
              className="zo-input w-full px-3 py-2.5 text-sm outline-none"
              placeholder="comma, separated" />
              
              </label>
            </>
          }

          {editor.kind === 'tasks' &&
          <>
              <label style-id="stylo-221" className="block space-y-1.5">
                <span style-id="stylo-222" className="text-xs text-gray-500">Task</span>
                <input style-id="stylo-223"
              value={editor.form.title}
              onChange={(event) => updateTaskForm({ title: event.target.value })}
              className="zo-input w-full px-3 py-2.5 text-sm outline-none"
              placeholder="What needs doing?" />
              
              </label>
              <div style-id="stylo-224" className="grid grid-cols-2 gap-3">
                <label style-id="stylo-225" className="block space-y-1.5">
                  <span style-id="stylo-226" className="text-xs text-gray-500">Status</span>
                  <select style-id="stylo-227"
                value={editor.form.status}
                onChange={(event) => updateTaskForm({ status: event.target.value })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none">
                  
                    <option style-id="stylo-228" value="pending">Pending</option>
                    <option style-id="stylo-229" value="completed">Completed</option>
                    <option style-id="stylo-230" value="archived">Archived</option>
                  </select>
                </label>
                <label style-id="stylo-231" className="block space-y-1.5">
                  <span style-id="stylo-232" className="text-xs text-gray-500">Priority</span>
                  <select style-id="stylo-233"
                value={editor.form.priority}
                onChange={(event) => updateTaskForm({ priority: event.target.value })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none">
                  
                    <option style-id="stylo-234" value="low">Low</option>
                    <option style-id="stylo-235" value="medium">Medium</option>
                    <option style-id="stylo-236" value="high">High</option>
                  </select>
                </label>
              </div>
              <label style-id="stylo-237" className="block space-y-1.5">
                <span style-id="stylo-238" className="text-xs text-gray-500">Due</span>
                <input style-id="stylo-239"
              type="date"
              value={editor.form.dueDate}
              onChange={(event) => updateTaskForm({ dueDate: event.target.value })}
              className="zo-input w-full px-3 py-2.5 text-sm outline-none" />
              
              </label>
            </>
          }

          {editor.kind === 'events' &&
          <>
              <label style-id="stylo-240" className="block space-y-1.5">
                <span style-id="stylo-241" className="text-xs text-gray-500">Event</span>
                <input style-id="stylo-242"
              value={editor.form.title}
              onChange={(event) => updateEventForm({ title: event.target.value })}
              className="zo-input w-full px-3 py-2.5 text-sm outline-none"
              placeholder="Calendar event" />
              
              </label>
              <label style-id="stylo-243" className="block space-y-1.5">
                <span style-id="stylo-244" className="text-xs text-gray-500">Body</span>
                <textarea style-id="stylo-245"
              value={editor.form.body}
              onChange={(event) => updateEventForm({ body: event.target.value })}
              className="zo-input min-h-[90px] w-full resize-none px-3 py-2.5 text-sm outline-none"
              placeholder="Event notes" />
              
              </label>
              <div style-id="stylo-246" className="grid grid-cols-2 gap-3">
                <label style-id="stylo-247" className="block space-y-1.5">
                  <span style-id="stylo-248" className="text-xs text-gray-500">Date</span>
                  <input style-id="stylo-249"
                type="date"
                value={editor.form.scheduledDate}
                onChange={(event) => updateEventForm({ scheduledDate: event.target.value })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none"
                required />
                
                </label>
                <label style-id="stylo-250" className="block space-y-1.5">
                  <span style-id="stylo-251" className="text-xs text-gray-500">Time</span>
                  <input style-id="stylo-252"
                type="time"
                value={editor.form.time}
                onChange={(event) => updateEventForm({ time: event.target.value, allDay: false })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none"
                disabled={editor.form.allDay} />
                
                </label>
              </div>
              <div style-id="stylo-253" className="grid grid-cols-2 gap-3">
                <label style-id="stylo-254" className="block space-y-1.5">
                  <span style-id="stylo-255" className="text-xs text-gray-500">Status</span>
                  <select style-id="stylo-256"
                value={editor.form.status}
                onChange={(event) => updateEventForm({ status: event.target.value })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none">
                  
                    <option style-id="stylo-257" value="todo">Todo</option>
                    <option style-id="stylo-258" value="done">Done</option>
                    <option style-id="stylo-259" value="archived">Archived</option>
                  </select>
                </label>
                <label style-id="stylo-260" className="flex items-center gap-2 pt-7 text-sm text-gray-300">
                  <input style-id="stylo-261"
                type="checkbox"
                checked={editor.form.allDay}
                onChange={(event) => updateEventForm({ allDay: event.target.checked })}
                className="accent-cyan-300" />
                
                  All day
                </label>
              </div>
            </>
          }

          {editor.mode === 'edit' &&
          <div style-id="stylo-262" className="grid grid-cols-3 gap-2 pt-2">
              <button style-id="stylo-263"
            type="button"
            onClick={toggleComplete}
            disabled={isSaving}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#20203a] px-2 text-xs text-gray-200 disabled:opacity-45">
              
                {complete ? <X style-id="stylo-264" size={14} /> : <Check style-id="stylo-265" size={14} />}
                {complete ? 'Reopen' : 'Complete'}
              </button>
              <button style-id="stylo-266"
            type="button"
            onClick={archiveEditor}
            disabled={isSaving}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#20203a] px-2 text-xs text-gray-200 disabled:opacity-45">
              
                <Archive style-id="stylo-267" size={14} />
                Archive
              </button>
              <button style-id="stylo-268"
            type="button"
            onClick={deleteEditor}
            disabled={isSaving}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-500/15 px-2 text-xs text-red-200 disabled:opacity-45">
              
                <Trash2 style-id="stylo-269" size={14} />
                Delete
              </button>
            </div>
          }
        </div>
      </form>);

  }

  return (
    <div style-id="stylo-270" className="h-full flex flex-col">
      {/* Header */}
      <div style-id="stylo-271" className="flex items-center justify-between px-4 py-3">
        <h2 style-id="stylo-272" className="text-lg font-medium text-white italic">Files</h2>
        <button style-id="stylo-273"
        onClick={() => openCreate('organizer')}
        disabled={writesDisabled}
        className="zo-btn-icon disabled:opacity-40"
        title={writesDisabled ? 'Sign in from Menu before creating.' : 'New note'}>
          
          <Plus style-id="stylo-274" size={17} />
        </button>
      </div>

      {/* Toolbar */}
      <div style-id="stylo-275" className="flex items-center gap-2 px-4 py-2">
        <div style-id="stylo-276" className="flex-1 flex items-center gap-2 rounded-xl bg-[#1e1e35] border border-[#2a2a45] px-3 py-2">
          <Search style-id="stylo-277" size={15} className="text-gray-500" />
          <input style-id="stylo-278"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search synced data"
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
          
        </div>
        <button style-id="stylo-279"
        onClick={() => setSortAsc(!sortAsc)}
        className="zo-btn-icon"
        title={sortAsc ? 'Sort Z to A' : 'Sort A to Z'}>
          
          <ChevronDown style-id="stylo-280" size={16} className={`transition-transform ${sortAsc ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div style-id="stylo-281" className="grid grid-cols-3 gap-2 px-4 py-2">
        <button style-id="stylo-282"
        onClick={() => openCreate('organizer')}
        disabled={writesDisabled}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2a2a45] bg-[#1e1e35] px-2 py-2 text-xs text-gray-200 disabled:opacity-40">
          
          <FileText style-id="stylo-283" size={14} />
          Note
        </button>
        <button style-id="stylo-284"
        onClick={() => openCreate('tasks')}
        disabled={writesDisabled}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2a2a45] bg-[#1e1e35] px-2 py-2 text-xs text-gray-200 disabled:opacity-40">
          
          <ListTodo style-id="stylo-285" size={14} />
          Task
        </button>
        <button style-id="stylo-286"
        onClick={() => openCreate('events')}
        disabled={writesDisabled}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2a2a45] bg-[#1e1e35] px-2 py-2 text-xs text-gray-200 disabled:opacity-40">
          
          <Calendar style-id="stylo-287" size={14} />
          Event
        </button>
      </div>

      {writeError &&
      <div style-id="stylo-288" className="mx-4 mt-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {writeError}
        </div>
      }

      {/* File list */}
      <div style-id="stylo-289" className="flex-1 px-4 overflow-y-auto">
        {sync.status === 'signed-out' &&
        <div style-id="stylo-290" className="mt-10 text-center text-gray-500 text-sm">
            Sign in from Menu to load your Web data.
          </div>
        }
        {sync.status !== 'signed-out' && !hasSyncedItems &&
        <div style-id="stylo-291" className="mt-10 text-center text-gray-500 text-sm">
            No synced items yet.
          </div>
        }
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expanded[section.id];
          return (
            <div style-id="stylo-292" key={section.id}>
            <button style-id="stylo-293"
              onClick={() => setExpanded((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
              className="flex items-center gap-3 w-full py-3 text-left">
                
              <span style-id="stylo-294" className="text-gray-500">
                {isExpanded ? <ChevronDown style-id="stylo-295" size={14} /> : <ChevronRight style-id="stylo-296" size={14} />}
              </span>
              <Icon style-id="stylo-297" size={18} className="text-gray-400" />
              <span style-id="stylo-298" className="text-white text-sm">{section.name}</span>
              <span style-id="stylo-299" className="ml-auto text-xs text-gray-500">{section.children.length}</span>
            </button>
            {isExpanded &&
              <div style-id="stylo-300" className="ml-6 border-l-2 border-[#2a2a45] pl-3">
                {section.children.map((child) =>
                <button style-id="stylo-301"
                key={child.id}
                onClick={() => child.editableKind && openExisting(child.editableKind, child.id)}
                disabled={!child.editableKind}
                className="flex w-full items-center gap-3 py-2.5 min-w-0 text-left disabled:cursor-default">
                  
                    <FileText style-id="stylo-302" size={16} className="text-gray-500 shrink-0" />
                    <div style-id="stylo-303" className="min-w-0 flex-1">
                      <p style-id="stylo-304" className="text-white text-sm truncate">{child.name}</p>
                      <p style-id="stylo-305" className="text-gray-500 text-xs truncate">{child.subtitle}</p>
                    </div>
                    {child.editableKind && <ChevronRight style-id="stylo-306" size={14} className="text-gray-600" />}
                  </button>
                )}
                {!section.children.length &&
                <p style-id="stylo-307" className="py-2.5 text-xs text-gray-600">Empty</p>
                }
              </div>
              }
          </div>);
        })}
      </div>

      {/* Floating add button */}
      <div style-id="stylo-308" className="absolute bottom-20 right-4">
        <button style-id="stylo-309"
        onClick={() => openCreate('organizer')}
        disabled={writesDisabled}
        className="w-14 h-14 rounded-full bg-[#2a2a45] border border-[#3a3a55] flex items-center justify-center text-white shadow-lg disabled:opacity-40"
        title={writesDisabled ? 'Sign in from Menu before creating.' : 'New note'}>
          
          <Plus style-id="stylo-310" size={24} />
        </button>
      </div>
    </div>);

}