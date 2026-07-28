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
      <form onSubmit={handleEditorSubmit} className="stack-3">
        <div className="row-spread-4">
          <button
            type="button"
            onClick={() => setEditor(null)}
            className="card-row-center-6"
            aria-label="Back to files">
            
            <ChevronLeft size={18} />
          </button>
          <div className="div-size">
            <p className="small">{title}</p>
            <p className="small-2">{editor.id}</p>
          </div>
          <button
            type="submit"
            disabled={isSaving || writesDisabled}
            className="card-row-small-7">
            
            <Save size={15} />
            Save
          </button>
        </div>

        {writeError &&
        <div className="card-small-4">
            {writeError}
          </div>
        }

        <div className="scroll-2">
          {editor.kind === 'organizer' &&
          <>
              <label className="label-styled">
                <span className="small-5">Title</span>
                <input
                value={editor.form.title}
                onChange={(event) => updateOrganizerForm({ title: event.target.value })}
                className="zo-input small-16"
                placeholder="Note title" />
              
              </label>
              <label className="label-styled">
                <span className="small-5">Body</span>
                <textarea
                value={editor.form.body}
                onChange={(event) => updateOrganizerForm({ body: event.target.value })}
                className="zo-input small-22"
                placeholder="Write the note" />
              
              </label>
              <div className="two-col-grid">
                <label className="label-styled">
                  <span className="small-5">Status</span>
                  <select
                  value={editor.form.status}
                  onChange={(event) => updateOrganizerForm({ status: event.target.value })}
                  className="zo-input small-16">
                  
                    <option value="todo">Todo</option>
                    <option value="done">Done</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="label-styled">
                  <span className="small-5">Schedule</span>
                  <input
                  type="date"
                  value={editor.form.scheduledDate}
                  onChange={(event) => updateOrganizerForm({ scheduledDate: event.target.value })}
                  className="zo-input small-16" />
                
                </label>
              </div>
              <label className="label-styled">
                <span className="small-5">Tags</span>
                <input
                value={editor.form.tags}
                onChange={(event) => updateOrganizerForm({ tags: event.target.value })}
                className="zo-input small-16"
                placeholder="comma, separated" />
              
              </label>
            </>
          }

          {editor.kind === 'tasks' &&
          <>
              <label className="label-styled">
                <span className="small-5">Task</span>
                <input
                value={editor.form.title}
                onChange={(event) => updateTaskForm({ title: event.target.value })}
                className="zo-input small-16"
                placeholder="What needs doing?" />
              
              </label>
              <div className="two-col-grid">
                <label className="label-styled">
                  <span className="small-5">Status</span>
                  <select
                  value={editor.form.status}
                  onChange={(event) => updateTaskForm({ status: event.target.value })}
                  className="zo-input small-16">
                  
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="label-styled">
                  <span className="small-5">Priority</span>
                  <select
                  value={editor.form.priority}
                  onChange={(event) => updateTaskForm({ priority: event.target.value })}
                  className="zo-input small-16">
                  
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
              <label className="label-styled">
                <span className="small-5">Due</span>
                <input
                type="date"
                value={editor.form.dueDate}
                onChange={(event) => updateTaskForm({ dueDate: event.target.value })}
                className="zo-input small-16" />
              
              </label>
            </>
          }

          {editor.kind === 'events' &&
          <>
              <label className="label-styled">
                <span className="small-5">Event</span>
                <input
                value={editor.form.title}
                onChange={(event) => updateEventForm({ title: event.target.value })}
                className="zo-input small-16"
                placeholder="Calendar event" />
              
              </label>
              <label className="label-styled">
                <span className="small-5">Body</span>
                <textarea
                value={editor.form.body}
                onChange={(event) => updateEventForm({ body: event.target.value })}
                className="zo-input small-23"
                placeholder="Event notes" />
              
              </label>
              <div className="two-col-grid">
                <label className="label-styled">
                  <span className="small-5">Date</span>
                  <input
                  type="date"
                  value={editor.form.scheduledDate}
                  onChange={(event) => updateEventForm({ scheduledDate: event.target.value })}
                  className="zo-input small-16"
                  required />
                
                </label>
                <label className="label-styled">
                  <span className="small-5">Time</span>
                  <input
                  type="time"
                  value={editor.form.time}
                  onChange={(event) => updateEventForm({ time: event.target.value, allDay: false })}
                  className="zo-input small-16"
                  disabled={editor.form.allDay} />
                
                </label>
              </div>
              <div className="two-col-grid">
                <label className="label-styled">
                  <span className="small-5">Status</span>
                  <select
                  value={editor.form.status}
                  onChange={(event) => updateEventForm({ status: event.target.value })}
                  className="zo-input small-16">
                  
                    <option value="todo">Todo</option>
                    <option value="done">Done</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="row-small-7">
                  <input
                  type="checkbox"
                  checked={editor.form.allDay}
                  onChange={(event) => updateEventForm({ allDay: event.target.checked })}
                  className="input-tone-2" />
                
                  All day
                </label>
              </div>
            </>
          }

          {editor.mode === 'edit' &&
          <div className="three-col-grid-2">
              <button
              type="button"
              onClick={toggleComplete}
              disabled={isSaving}
              className="card-row-center-small-4">
              
                {complete ? <X size={14} /> : <Check size={14} />}
                {complete ? 'Reopen' : 'Complete'}
              </button>
              <button
              type="button"
              onClick={archiveEditor}
              disabled={isSaving}
              className="card-row-center-small-4">
              
                <Archive size={14} />
                Archive
              </button>
              <button
              type="button"
              onClick={deleteEditor}
              disabled={isSaving}
              className="card-row-center-small-5">
              
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          }
        </div>
      </form>);

  }

  return (
    <div className="stack-5">
      {/* Header */}
      <div className="row-spread-5">
        <h2 className="h2-tone-2">Files</h2>
        <button
          onClick={() => openCreate('organizer')}
          disabled={writesDisabled}
          className="zo-btn-icon button-styled"
          title={writesDisabled ? 'Sign in from Menu before creating.' : 'New note'}>
          
          <Plus size={17} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="row-14">
        <div className="card-row">
          <Search size={15} className="chevrondown-tone" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search synced data"
            className="small-24" />
          
        </div>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="zo-btn-icon"
          title={sortAsc ? 'Sort Z to A' : 'Sort A to Z'}>
          
          <ChevronDown size={16} className={`chevrondown-styled ${sortAsc ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="three-col-grid-3">
        <button
          onClick={() => openCreate('organizer')}
          disabled={writesDisabled}
          className="card-row-center-small-6">
          
          <FileText size={14} />
          Note
        </button>
        <button
          onClick={() => openCreate('tasks')}
          disabled={writesDisabled}
          className="card-row-center-small-6">
          
          <ListTodo size={14} />
          Task
        </button>
        <button
          onClick={() => openCreate('events')}
          disabled={writesDisabled}
          className="card-row-center-small-6">
          
          <Calendar size={14} />
          Event
        </button>
      </div>

      {writeError &&
      <div className="card-small-5">
          {writeError}
        </div>
      }

      {/* File list */}
      <div className="scroll-4">
        {sync.status === 'signed-out' &&
        <div className="small-25">
            Sign in from Menu to load your Web data.
          </div>
        }
        {sync.status !== 'signed-out' && !hasSyncedItems &&
        <div className="small-25">
            No synced items yet.
          </div>
        }
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expanded[section.id];
          return (
            <div key={section.id}>
            <button
                onClick={() => setExpanded((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                className="row-15">
                
              <span className="chevrondown-tone">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <Icon size={18} className="icon-tone" />
              <span className="small-20">{section.name}</span>
              <span className="small-26">{section.children.length}</span>
            </button>
            {isExpanded &&
              <div className="div-spacing-4">
                {section.children.map((child) =>
                <button
                  key={child.id}
                  onClick={() => child.editableKind && openExisting(child.editableKind, child.id)}
                  disabled={!child.editableKind}
                  className="row-16">
                  
                    <FileText size={16} className="filetext-tone" />
                    <div className="div-size">
                      <p className="small-27">{child.name}</p>
                      <p className="small-2">{child.subtitle}</p>
                    </div>
                    {child.editableKind && <ChevronRight size={14} className="chevronright-tone" />}
                  </button>
                )}
                {!section.children.length &&
                <p className="small-28">Empty</p>
                }
              </div>
              }
          </div>);
        })}
      </div>

      {/* Floating add button */}
      <div className="floating-2">
        <button
          onClick={() => openCreate('organizer')}
          disabled={writesDisabled}
          className="card-row-center-7"
          title={writesDisabled ? 'Sign in from Menu before creating.' : 'New note'}>
          
          <Plus size={24} />
        </button>
      </div>
    </div>);

}