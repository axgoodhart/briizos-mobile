import { useState } from 'react'
import { ChevronDown, Clock, SlidersHorizontal, Sun, Calendar, ChevronLeft, PenLine, BellOff, Zap, ArrowUp, Sparkles } from 'lucide-react'

export default function AutomationsView() {
  const [schedule, setSchedule] = useState('Daily')
  const [time] = useState('2:00 AM')
  const [automationPrompt, setAutomationPrompt] = useState('')
  const [persona] = useState('Zo')

  const schedules = ['Once', 'Custom', 'Daily', 'Weekly', 'Monthly']

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#252540]">
        <button className="flex items-center gap-2 text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-white font-medium">New Automation</h2>
          <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
            <PenLine size={14} />
          </button>
        </div>
        <button className="px-4 py-1.5 rounded-full bg-[#4a4a6a] text-white text-sm">
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Schedule description */}
        <div className="relative">
          <input
            type="text"
            placeholder="Describe a schedule..."
            className="w-full bg-[#1e1e35] border border-[#2a2a45] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
          />
          <button className="absolute right-3 top-3 text-gray-500">
            <span className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center text-xs">i</span>
          </button>
        </div>

        {/* Schedule buttons */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {schedules.map(s => (
            <button
              key={s}
              onClick={() => setSchedule(s)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                schedule === s
                  ? 'bg-[#2a2a45] text-white border border-[#3a3a55]'
                  : 'text-gray-500 border border-[#2a2a45]'
              }`}
            >
              {s === 'Once' && <Clock size={14} />}
              {s === 'Custom' && <SlidersHorizontal size={14} />}
              {s === 'Daily' && <Sun size={14} />}
              {(s === 'Weekly' || s === 'Monthly') && <Calendar size={14} />}
              {s}
            </button>
          ))}
        </div>

        {/* Time selector */}
        <button className="w-full flex items-center justify-between bg-[#1e1e35] border border-[#2a2a45] rounded-xl px-4 py-3 text-white">
          <span>{time}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {/* Prompt to notify */}
        <div className="flex items-start gap-3">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e35] border border-[#2a2a45] text-gray-400 text-sm whitespace-nowrap">
            <BellOff size={14} /> Prompt to notify
          </button>
          <p className="text-gray-500 text-sm">
            In your prompt, you can ask Zo to text or email you under certain conditions.
          </p>
        </div>

        {/* Persona selector */}
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e35] border border-[#2a2a45] text-white text-sm">
          <Zap size={14} className="text-purple-400" />
          {persona}
          <ChevronDown size={14} className="text-gray-500 ml-2" />
        </button>

        {/* Main prompt input */}
        <div className="bg-[#1e1e35] border border-[#2a2a45] rounded-2xl p-4">
          <textarea
            value={automationPrompt}
            onChange={(e) => setAutomationPrompt(e.target.value)}
            placeholder="What can I do for you?"
            className="w-full bg-transparent text-white placeholder-gray-500 text-base resize-none outline-none min-h-[80px]"
          />
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-lg bg-[#2a2a45] flex items-center justify-center">
              <Zap size={14} className="text-purple-400" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a45] text-sm text-gray-300">
              <Sparkles size={12} />
              GPT-5.4 mini
              <ChevronDown size={12} />
            </button>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2a2a45] text-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-300">Free</span>
            </div>
            <div className="flex-1" />
            <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <ArrowUp size={14} />
            </button>
          </div>
        </div>

        <p className="text-gray-500 text-sm">Run the prompt to preview behavior before saving.</p>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Terminal } from 'lucide-react'

interface Command {
  prompt: string
  branch?: string
  dir?: string
  command: string
  output?: string
  error?: boolean
}

const terminalData: Command[] = [
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'cwd', output: 'zsh: command not found: cwd', error: true },
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'pwd', output: '/home/workspace' },
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'mkdir recollections' },
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'cd recollections' },
  { prompt: 'recollections', branch: 'master', dir: 'recollections', command: 'nano boost.txt' }
]

export default function ChatsView() {
  const [activeView, setActiveView] = useState<'chats' | 'terminal'>('terminal')

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* View toggle */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#252540]">
        <button
          onClick={() => setActiveView('chats')}
          className={`text-sm px-3 py-1 rounded-lg transition-all ${activeView === 'chats' ? 'bg-[#252540] text-white' : 'text-gray-500'}`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveView('terminal')}
          className={`text-sm px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${activeView === 'terminal' ? 'bg-[#252540] text-white' : 'text-gray-500'}`}
        >
          <Terminal size={14} /> Terminal
        </button>
      </div>

      {activeView === 'terminal' ? (
        <div className="flex-1 p-4 overflow-y-auto terminal-text text-sm">
          {terminalData.map((cmd, i) => (
            <div key={i} className="mb-1">
              <div className="flex items-center gap-2">
                <span className="text-teal-400">→</span>
                <span className="text-cyan-400">{cmd.prompt}</span>
                <span className="text-gray-500">git:</span>
                <span className="text-orange-400">({cmd.branch})</span>
                <span className="text-gray-400">{cmd.command}</span>
                {i === terminalData.length - 1 && (
                  <span className="w-2 h-4 bg-purple-400 animate-pulse ml-1" />
                )}
              </div>
              {cmd.output && (
                <div className={`ml-6 ${cmd.error ? 'text-red-400' : 'text-gray-300'}`}>
                  {cmd.output}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500 mt-20">
            <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-sm">No active chats</p>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FileText, Image, Plus, SlidersHorizontal, Search, Trash2 } from 'lucide-react'

interface FileItem {
  id: string
  name: string
  type: 'folder' | 'image' | 'svg' | 'doc'
  expanded?: boolean
  children?: FileItem[]
}

const fileData: FileItem[] = [
  {
    id: '1',
    name: 'Articles',
    type: 'folder',
    expanded: false,
    children: []
  },
  {
    id: '2',
    name: 'Images',
    type: 'folder',
    expanded: true,
    children: [
      { id: '2a', name: 'bountiful.jpg', type: 'image' },
      { id: '2b', name: 'pegasus.svg', type: 'svg' }
    ]
  },
  { id: '3', name: 'Getting Started', type: 'doc' }
]

export default function FilesView() {
  const [files, setFiles] = useState(fileData)
  const [sortAsc, setSortAsc] = useState(true)

  const toggleFolder = (id: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) return { ...f, expanded: !f.expanded }
      return f
    }))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder size={18} className="text-gray-400" />
      case 'image': return <Image size={18} className="text-teal-400" />
      case 'svg': return <Image size={18} className="text-gray-400" />
      case 'doc': return <FileText size={18} className="text-gray-400" />
      default: return <FileText size={18} className="text-gray-400" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-medium text-white italic">Files</h2>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">×</button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="zo-btn-icon">
          <span className="text-lg">?</span>
        </button>
        <div className="flex items-center gap-2">
          <button className="zo-btn-icon"><SlidersHorizontal size={16} /></button>
          <button className="zo-btn-icon"><Search size={16} /></button>
          <button className="zo-btn-icon"><Trash2 size={16} /></button>
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
        {files.map(file => (
          <div key={file.id}>
            <button
              onClick={() => file.type === 'folder' && toggleFolder(file.id)}
              className="flex items-center gap-3 w-full py-3 text-left"
            >
              {file.type === 'folder' && (
                <span className="text-gray-500">
                  {file.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
              {getIcon(file.type)}
              <span className="text-white text-sm">{file.name}</span>
            </button>
            {file.type === 'folder' && file.expanded && file.children && (
              <div className="ml-6 border-l-2 border-[#2a2a45] pl-3">
                {file.children.map(child => (
                  <div key={child.id} className="flex items-center gap-3 py-2.5">
                    {getIcon(child.type)}
                    <span className="text-white text-sm">{child.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating add button */}
      <div className="absolute bottom-20 right-4">
        <button className="w-14 h-14 rounded-full bg-[#2a2a45] border border-[#3a3a55] flex items-center justify-center text-white shadow-lg">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { ChevronDown, Plus, ArrowUp, Sparkles, Globe, Mail, Zap } from 'lucide-react'

export default function HomeView() {
  const [inputText, setInputText] = useState('')
  const [selectedModel, setSelectedModel] = useState('GPT-5.4 mini')
  const [showModelMenu, setShowModelMenu] = useState(false)

  const models = ['GPT-5.4 mini', 'GPT-5.4', 'Claude 3.5', 'Claude 3.7']

  return (
    <div className="h-full flex flex-col relative">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        {/* Chat input card */}
        <div className="w-full bg-[#1e1e35] border border-[#2a2a45] rounded-2xl p-4 mb-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="What can I do for you?"
            className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none outline-none min-h-[80px]"
          />
          <div className="flex items-center gap-2 mt-2">
            {/* Zo icon */}
            <div className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center">
              <Zap size={16} className="text-purple-400" />
            </div>
            {/* Model selector */}
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a2a45] text-sm text-gray-300"
            >
              <Sparkles size={14} />
              {selectedModel}
              <ChevronDown size={14} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a2a45] text-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-300">Free</span>
            </div>
            <div className="flex-1" />
            <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <Plus size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <ArrowUp size={16} />
            </button>
          </div>

          {showModelMenu && (
            <div className="absolute mt-2 bg-[#252540] border border-[#3a3a55] rounded-xl shadow-xl z-50 overflow-hidden">
              {models.map(m => (
                <button
                  key={m}
                  onClick={() => { setSelectedModel(m); setShowModelMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a45] hover:text-white"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="w-full">
          <h3 className="text-white font-medium mb-1">History</h3>
          <p className="text-gray-500 text-sm">Job Search: update profile landing</p>
        </div>
      </div>

      {/* Footer links */}
      <div className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-4 text-gray-500 text-sm mb-1">
          <span className="flex items-center gap-1"><Globe size={14} /> briizoscomputer</span>
          <span className="flex items-center gap-1"><GridIcon size={14} /> briizosspace</span>
        </div>
        <span className="flex items-center justify-center gap-1 text-gray-500 text-sm">
          <Mail size={14} /> briizos.computer
        </span>
      </div>
    </div>
  )
}

function GridIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
import type { ViewId } from '../App'
import { Home, FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Settings, ChevronRight } from 'lucide-react'

interface MenuViewProps {
  onNavigate: (view: ViewId) => void
}

const menuItems: { id: ViewId; label: string; icon: React.ElementType; subtitle?: string }[] = [
  { id: 'home', label: 'Home', icon: Home, subtitle: 'Chat with Zo' },
  { id: 'files', label: 'Files', icon: FolderOpen, subtitle: 'Manage files' },
  { id: 'chats', label: 'Chats', icon: MessageCircle, subtitle: 'Conversations' },
  { id: 'automations', label: 'Automations', icon: Clock, subtitle: 'Scheduled tasks' },
  { id: 'space', label: 'Space', icon: Grid3X3, subtitle: 'Published pages' },
  { id: 'skills', label: 'Skills', icon: Wand2, subtitle: 'Installed & Hub' },
]

export default function MenuView({ onNavigate }: MenuViewProps) {
  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      <div className="px-4 py-4">
        <h2 className="text-white text-lg font-medium mb-1">Menu</h2>
        <p className="text-gray-500 text-sm">Navigate your Zo Computer</p>
      </div>

      <div className="flex-1 px-4 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#1e1e35] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center">
                <Icon size={18} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{item.label}</p>
                <p className="text-gray-500 text-xs">{item.subtitle}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          )
        })}

        <button
          onClick={() => onNavigate('chats')}
          className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#1e1e35] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center">
            <Settings size={18} className="text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Settings</p>
            <p className="text-gray-500 text-xs">UX, Advanced, Account</p>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-gray-600 text-xs">Zo Computer v1.0</p>
        <p className="text-gray-700 text-xs">briizoscomputer</p>
      </div>
    </div>
  )
}
import { useState } from 'react'
import {
  ChevronLeft, Sun, Moon, Monitor, Check,
  MessageCircle, Puzzle, Paintbrush, Grid3X3, User,
  Plus
} from 'lucide-react'

export default function SettingsView() {
  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'integrations' | 'ux' | 'advanced' | 'account'>('ux')

  const subTabs = [
    { id: 'channels' as const, label: 'Channels', icon: MessageCircle },
    { id: 'integrations' as const, label: 'Integrations', icon: Puzzle },
    { id: 'ux' as const, label: 'UX', icon: Paintbrush },
    { id: 'advanced' as const, label: 'Advanced', icon: Grid3X3 },
    { id: 'account' as const, label: 'Account', icon: User },
  ]

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#252540]">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-gray-400 px-3 py-1.5 rounded-lg border border-[#2a2a45]">
            <ChevronLeft size={14} /> Back
          </button>
        </div>
        <button className="px-4 py-1.5 rounded-full bg-[#6b6b9e] text-white text-sm">
          Save
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto border-b border-[#252540]">
        {subTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs min-w-[60px] transition-all ${
                activeSubTab === tab.id
                  ? 'bg-[#2a2a45] text-white'
                  : 'text-gray-500'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'ux' && <UXSettings />}
        {activeSubTab === 'integrations' && <IntegrationsSettings />}
        {activeSubTab === 'advanced' && <AdvancedSettings />}
        {activeSubTab === 'account' && <AccountSettings />}
        {activeSubTab === 'channels' && <ChannelsSettings />}
      </div>
    </div>
  )
}

function UXSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [activeTheme] = useState('Intermezzo')

  const themes = [
    { name: 'Root Zone', color: '#5eead4', active: false },
    { name: 'Comfort Zone', color: '#a78bfa', active: false },
    { name: 'Garbanzo', color: '#fb923c', active: false },
    { name: 'Intermezzo', color: '#818cf8', active: true },
    { name: 'Why Zo Serious', color: '#f8fafc', active: false },
    { name: 'Protozoa', color: '#4ade80', active: false },
  ]

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="zo-card p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-medium">Theme</span>
          <div className="flex items-center bg-[#1e1e35] rounded-xl p-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-lg ${theme === 'light' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
            >
              <Sun size={16} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
            >
              <Moon size={16} />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-2 rounded-lg ${theme === 'system' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
            >
              <Monitor size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          {themes.slice(0, 3).map(t => (
            <div key={t.name} className="w-6 h-6 rounded-full" style={{ backgroundColor: t.color }} />
          ))}
        </div>
      </div>

      <div className="zo-card p-4 space-y-1">
        {themes.map(t => (
          <div key={t.name} className={`flex items-center gap-3 py-3 ${t.name === activeTheme ? 'bg-[#252540] -mx-4 px-4 rounded-xl' : ''}`}>
            <div className="relative">
              <div className="w-8 h-5 rounded-full" style={{ backgroundColor: t.color }} />
              <div className="absolute -right-1 top-0 w-3 h-3 rounded-full bg-[#3a3a55] border-2 border-[#22223a]" />
            </div>
            <span className="text-white flex-1">{t.name}</span>
            {t.name === activeTheme && <Check size={16} className="text-white" />}
          </div>
        ))}
      </div>

      <div className="zo-card p-4">
        <h3 className="text-white font-medium mb-1">Keybindings</h3>
      </div>
    </div>
  )
}

function IntegrationsSettings() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
          <span className="text-lg">🏞</span>
        </button>
        <button className="px-3 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
          Eager but Exact
        </button>
        <span className="text-gray-500 text-xs uppercase tracking-wider">Model</span>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
          <SparkleIcon size={14} /> Default
          <ChevronDownIcon />
        </button>
      </div>

      <div className="zo-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Permissions</h3>
            <span className="text-gray-500 text-sm">Full access</span>
          </div>
          <ChevronRightIcon />
        </div>
        <p className="text-gray-500 text-sm mt-1">33 scopes enabled</p>
      </div>

      <div className="zo-card p-5">
        <p className="text-gray-300 leading-relaxed text-sm">
          You are driven to build complete, reusable tools and projects—but you're relentless about getting the details right.
        </p>
        <ul className="mt-4 space-y-3 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Move fast toward full solutions, not half-measures.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Ask clarifying questions upfront to avoid rework later.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Dig for missing context: edge cases, constraints, preferences.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Don't guess when you can ask; don't assume when you can verify.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Aim for outputs the user can return to and build on.
          </li>
        </ul>
      </div>
    </div>
  )
}

function AdvancedSettings() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="zo-card p-4">
        <h3 className="text-white font-medium text-lg mb-2">Secrets</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Environment variables available to Zo when running scripts and routes. Use these for third-party API keys, tokens, and other credentials.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <input type="text" placeholder="KEY_NAME" className="flex-1 zo-input px-3 py-2 text-sm" />
          <input type="text" placeholder="value" className="flex-1 zo-input px-3 py-2 text-sm" />
          <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="zo-card p-4">
        <h3 className="text-white font-medium text-lg mb-2">Access Tokens</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Authenticate external connections to your Zo via <span className="text-white underline">MCP</span> or the <span className="text-white underline">HTTP API</span>.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <input type="text" placeholder="Key name (e.g., 'Home Laptop', 'F..." className="flex-1 zo-input px-3 py-2 text-sm" />
          <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="zo-card p-4">
        <h3 className="text-white font-medium text-lg mb-2">Danger Zone</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Destructive actions for your workspace and account.
        </p>
      </div>
    </div>
  )
}

function AccountSettings() {
  const [permLevel, setPermLevel] = useState('Full access')
  const perms = {
    files: 'Read only',
    settings: 'View',
    hosting: 'View',
    searchWeb: true,
    webBrowser: true,
    shell: true,
    devices: true,
    managePersona: true,
    mediaGen: true,
    mediaTranscribe: true,
    email: true,
    sms: true,
    telegram: true,
    discord: true,
    slack: true,
    payments: true,
    products: true,
  }

  const levels = ['Full access', 'Workspace', 'Read only', 'Chat only', 'Custom']

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {levels.map(l => (
          <button
            key={l}
            onClick={() => setPermLevel(l)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap ${permLevel === l ? 'bg-[#2a2a45] text-white border border-[#3a3a55]' : 'text-gray-500 border border-[#2a2a45]'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {[
          { label: 'Files', key: 'files' as const, options: ['None', 'Read only'] },
          { label: 'Settings', key: 'settings' as const, options: ['None', 'View'] },
          { label: 'Hosting', key: 'hosting' as const, options: ['None', 'View'] },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{item.label}</span>
              <span className="text-gray-500 text-xs w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">i</span>
            </div>
            <div className="flex items-center gap-4">
              {item.options.map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${perms[item.key as keyof typeof perms] === opt ? 'border-purple-400' : 'border-gray-600'}`}>
                    {perms[item.key as keyof typeof perms] === opt && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                  </span>
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        {[
          { label: 'Search web, images, maps', key: 'searchWeb' as const },
          { label: 'Use the web browser', key: 'webBrowser' as const },
          { label: 'Run shell commands', key: 'shell' as const },
          { label: 'Use connected devices', key: 'devices' as const },
          { label: 'Manage persona tool permissions', key: 'managePersona' as const },
        ].map(item => (
          <label key={item.key} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
              {perms[item.key] && <Check size={12} className="text-white" />}
            </span>
            <span className="text-gray-300 text-sm">{item.label}</span>
            <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center ml-1">i</span>
          </label>
        ))}
      </div>

      {/* Media */}
      <div className="pt-2">
        <label className="flex items-center gap-3 mb-3">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center bg-purple-400`}>
            <Check size={12} className="text-white" />
          </span>
          <span className="text-gray-300 text-sm font-medium">Media</span>
          <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div className="ml-8 space-y-2">
          {[
            { label: 'Generate images, video, diagrams', key: 'mediaGen' as const },
            { label: 'Transcribe audio', key: 'mediaTranscribe' as const },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="text-white" />}
              </span>
              <span className="text-gray-300 text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Communications */}
      <div className="pt-2">
        <label className="flex items-center gap-3 mb-3">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-purple-400">
            <Check size={12} className="text-white" />
          </span>
          <span className="text-gray-300 text-sm font-medium">Communications</span>
          <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div className="ml-8 grid grid-cols-2 gap-2">
          {[
            { label: 'Send emails', key: 'email' as const },
            { label: 'Send SMS', key: 'sms' as const },
            { label: 'Telegram messages', key: 'telegram' as const },
            { label: 'Discord mess...', key: 'discord' as const },
            { label: 'Slack messages', key: 'slack' as const },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="text-white" />}
              </span>
              <span className="text-gray-300 text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Commerce */}
      <div className="pt-2 pb-4">
        <label className="flex items-center gap-3 mb-3">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-purple-400">
            <Check size={12} className="text-white" />
          </span>
          <span className="text-gray-300 text-sm font-medium">Commerce</span>
          <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div className="ml-8 grid grid-cols-2 gap-2">
          {[
            { label: 'View payments and orders', key: 'payments' as const },
            { label: 'Manage prod...', key: 'products' as const },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="text-white" />}
              </span>
              <span className="text-gray-300 text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChannelsSettings() {
  return (
    <div className="px-4 py-8 text-center">
      <MessageCircle size={32} className="mx-auto text-gray-600 mb-3" />
      <p className="text-gray-500 text-sm">Configure chat channels</p>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SparkleIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
    </svg>
  )
}
import { useState } from 'react'
import { Download, Filter, ArrowUpDown, Globe, Zap } from 'lucide-react'

interface Skill {
  id: string
  title: string
  description: string
  tags: string[]
  author: string
  icon: React.ReactNode
}

const skills: Skill[] = [
  {
    id: '1',
    title: 'Improve and optimize prompts for Claude using Anthropic\'s official best practices and the 5-Element Persona Framework. Use when asked to...',
    description: '',
    tags: ['AI', 'Content'],
    author: 'skeletorjs',
    icon: <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center"><span className="text-lg">📝</span></div>
  },
  {
    id: '2',
    title: 'Create a site',
    description: 'Create a site hosted on your Zo server. Private by default, publish with a click.',
    tags: ['Web'],
    author: 'Zo',
    icon: <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center"><Globe size={18} className="text-gray-400" /></div>
  },
  {
    id: '3',
    title: 'Install OpenClaw on Zo',
    description: 'Install and run OpenClaw on Zo Computer with Tailscale private networking, browser Control UI, and Zo MCP tools via mcporter. Use this skill...',
    tags: ['AI', 'Developer Tools'],
    author: 'skeletorjs',
    icon: <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center"><span className="text-lg">🦞</span></div>
  }
]

export default function SkillsView() {
  const [activeTab, setActiveTab] = useState<'installed' | 'hub'>('hub')

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setActiveTab('installed')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm ${activeTab === 'installed' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
        >
          <Download size={14} /> Installed
        </button>
        <button
          onClick={() => setActiveTab('hub')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm ${activeTab === 'hub' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
        >
          <Zap size={14} /> Hub
        </button>
        <div className="flex-1" />
        <button className="zo-btn-icon"><Filter size={14} /></button>
        <button className="zo-btn-icon"><ArrowUpDown size={14} /></button>
      </div>

      {/* Skills list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {skills.map(skill => (
          <div key={skill.id} className="zo-card p-4">
            <div className="flex items-start gap-3">
              {skill.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-white font-medium text-sm leading-snug">{skill.title}</h3>
                  <button className="zo-btn-icon ml-2 shrink-0">
                    <Download size={14} />
                  </button>
                </div>
                {skill.description && (
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">{skill.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {skill.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-[#2a2a45] text-gray-400 text-xs">{tag}</span>
                    ))}
                  </div>
                  <span className="text-gray-500 text-xs">{skill.author}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Eye, Code, Share2, RefreshCw, MoreVertical, Lock, Zap } from 'lucide-react'

export default function SpaceView() {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* URL bar */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1e35] border border-[#2a2a45]">
          <Zap size={14} className="text-purple-400" />
          <span className="text-white text-sm">briizosspace</span>
        </div>
        <span className="text-gray-500 text-sm">Home page</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Lock size={12} />
          <span>Private</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="zo-btn-icon"><MenuIcon size={16} /></button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'preview' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'code' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
          >
            <Code size={14} /> Code
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="zo-btn-icon"><Share2 size={14} /></button>
          <button className="zo-btn-icon"><RefreshCw size={14} /></button>
          <button className="zo-btn-icon"><MoreVertical size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="zo-card p-5">
          <p className="text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">What is this?</span> Your Zo Space is a place where you can publish pages, APIs, and assets created by Zo. Ask Zo to build something and it will appear here. You can ask it to create new pages, or even change this one.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            Pages can be public (anyone can view) or private (only you). You control the visibility of each page.
          </p>
        </div>

        <div className="zo-card p-5">
          <p className="text-gray-300 leading-relaxed">
            For more complex or isolated projects, or if you need to use a custom domain, check out the accompanying <span className="text-white font-semibold">Hosting</span> tab in your Zo Computer.
          </p>
        </div>

        <p className="text-gray-400 text-sm text-center px-4">
          Click the <span className="text-white font-semibold">+ New</span> button in the top right of your Zo Computer, or just ask Zo to make something!
        </p>
      </div>
    </div>
  )
}

function MenuIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="10" y2="18" />
    </svg>
  )
}
