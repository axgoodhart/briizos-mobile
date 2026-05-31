import { useMemo, useState } from 'react'
import { Calendar, ChevronDown, ChevronRight, Clock, FileText, ListTodo, Plus, SlidersHorizontal, Search, Trash2, type LucideIcon } from 'lucide-react'
import type { BriizOSMobileState } from '../types/briizos'

interface FilesViewProps {
  sync: BriizOSMobileState
}

type SectionId = 'organizer' | 'events' | 'tasks' | 'timer'

interface BrowserItem {
  id: string
  name: string
  subtitle: string
}

interface BrowserSection {
  id: SectionId
  name: string
  icon: LucideIcon
  children: BrowserItem[]
}

function formatTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function FilesView({ sync }: FilesViewProps) {
  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    organizer: true,
    events: false,
    tasks: false,
    timer: false,
  })
  const [sortAsc, setSortAsc] = useState(true)
  const [query, setQuery] = useState('')

  const sections = useMemo<BrowserSection[]>(() => {
    const timerItem = sync.timer ? [{
      id: 'timer',
      name: `${sync.timer.mode} ${sync.timer.running ? 'running' : 'idle'}`,
      subtitle: sync.timer.mode === 'timer' ? formatTimer(sync.timer.remaining) : formatTimer(sync.timer.elapsed),
    }] : []

    return [
      {
        id: 'organizer',
        name: 'Organizer',
        icon: FileText,
        children: sync.organizer.map(item => ({
          id: item.id,
          name: item.title || 'Untitled item',
          subtitle: `${item.type} / ${item.status}`,
        })),
      },
      {
        id: 'events',
        name: 'Events',
        icon: Calendar,
        children: sync.events.map(event => ({
          id: event.id,
          name: event.title || 'Untitled event',
          subtitle: event.scheduledDate || 'unscheduled',
        })),
      },
      {
        id: 'tasks',
        name: 'Tasks',
        icon: ListTodo,
        children: sync.tasks.map(task => ({
          id: task.id,
          name: task.title || 'Untitled task',
          subtitle: `${task.status}${task.dueDate ? ` / due ${task.dueDate}` : ''}`,
        })),
      },
      {
        id: 'timer',
        name: 'Timer',
        icon: Clock,
        children: timerItem,
      },
    ]
  }, [sync.events, sync.organizer, sync.tasks, sync.timer])

  const visibleSections = sections.map(section => ({
    ...section,
    children: section.children
      .filter(item => `${item.name} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)),
  }))

  const hasSyncedItems = sections.some(section => section.children.length > 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-medium text-white italic">Files</h2>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">×</button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl bg-[#1e1e35] border border-[#2a2a45] px-3 py-2">
          <Search size={15} className="text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search synced data"
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="zo-btn-icon"><SlidersHorizontal size={16} /></button>
          <button className="zo-btn-icon opacity-40 cursor-not-allowed" disabled title="Delete actions unlock in the detail stage and must confirm first."><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Sort */}
      <button
        onClick={() => setSortAsc(!sortAsc)}
        className="flex items-center gap-1 px-4 py-2 text-gray-400 text-sm"
      >
        Name <ChevronDown size={14} className={`transition-transform ${sortAsc ? 'rotate-180' : ''}`} />
      </button>

      {/* File list */}
      <div className="flex-1 px-4 overflow-y-auto">
        {sync.status === 'signed-out' && (
          <div className="mt-10 text-center text-gray-500 text-sm">
            Sign in from Menu to load your Web data.
          </div>
        )}
        {sync.status !== 'signed-out' && !hasSyncedItems && (
          <div className="mt-10 text-center text-gray-500 text-sm">
            No synced items yet.
          </div>
        )}
        {visibleSections.map(section => {
          const Icon = section.icon
          const isExpanded = expanded[section.id]
          return (
          <div key={section.id}>
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
              className="flex items-center gap-3 w-full py-3 text-left"
            >
              <span className="text-gray-500">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <Icon size={18} className="text-gray-400" />
              <span className="text-white text-sm">{section.name}</span>
              <span className="ml-auto text-xs text-gray-500">{section.children.length}</span>
            </button>
            {isExpanded && (
              <div className="ml-6 border-l-2 border-[#2a2a45] pl-3">
                {section.children.map(child => (
                  <div key={child.id} className="flex items-center gap-3 py-2.5 min-w-0">
                    <FileText size={16} className="text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{child.name}</p>
                      <p className="text-gray-500 text-xs truncate">{child.subtitle}</p>
                    </div>
                  </div>
                ))}
                {!section.children.length && (
                  <p className="py-2.5 text-xs text-gray-600">Empty</p>
                )}
              </div>
            )}
          </div>
        )})}
      </div>

      {/* Floating add button */}
      <div className="absolute bottom-20 right-4">
        <button className="w-14 h-14 rounded-full bg-[#2a2a45] border border-[#3a3a55] flex items-center justify-center text-white shadow-lg opacity-45 cursor-not-allowed" disabled title="Creation starts in the organizer stage.">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}
