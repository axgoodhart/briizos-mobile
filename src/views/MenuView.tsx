import type { ElementType } from 'react'
import type { ViewId } from '../App'
import { Home, FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Settings, ChevronRight, Database } from 'lucide-react'
import AccountControls from '../components/AccountControls'
import type { BriizOSMobileState } from '../types/briizos'

interface MenuViewProps {
  onNavigate: (view: ViewId) => void
  sync: BriizOSMobileState
}

export default function MenuView({ onNavigate, sync }: MenuViewProps) {
  const chatCount = sync.organizer.filter(item => item.type === 'chat' || item.chat).length
  const externalCount = sync.organizer.filter(item => item.type === 'external' || item.external).length
  const syncedRecordCount = sync.organizer.length + sync.events.length + sync.tasks.length + (sync.timer ? 1 : 0)
  const menuItems: { id: ViewId; label: string; icon: ElementType; subtitle?: string }[] = [
    { id: 'home', label: 'Home', icon: Home, subtitle: sync.status === 'ready' ? 'Live with Web data' : 'Chat with Zo' },
    { id: 'files', label: 'Files', icon: FolderOpen, subtitle: `${syncedRecordCount} synced records` },
    { id: 'chats', label: 'Chats', icon: MessageCircle, subtitle: `${chatCount} chat records` },
    { id: 'automations', label: 'Automations', icon: Clock, subtitle: `${sync.tasks.length} tasks / ${sync.events.length} events` },
    { id: 'space', label: 'Space', icon: Grid3X3, subtitle: `${externalCount} external or published records` },
    { id: 'skills', label: 'Skills', icon: Wand2, subtitle: 'Tool registry comes next' },
  ]

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      <div className="px-4 py-4">
        <h2 className="text-white text-lg font-medium mb-1">Menu</h2>
        <p className="text-gray-500 text-sm">Navigate your Zo Computer</p>
      </div>

      <div className="px-4 pb-3">
        <AccountControls sync={sync} />
      </div>

      <div className="px-4 pb-3">
        <div className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Database size={15} className="text-cyan-200" />
            <p className="text-white text-sm font-medium">Data</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-white text-sm">{sync.organizer.length}</p>
              <p className="text-gray-500 text-[10px]">org</p>
            </div>
            <div>
              <p className="text-white text-sm">{sync.events.length}</p>
              <p className="text-gray-500 text-[10px]">events</p>
            </div>
            <div>
              <p className="text-white text-sm">{sync.tasks.length}</p>
              <p className="text-gray-500 text-[10px]">tasks</p>
            </div>
            <div>
              <p className="text-white text-sm">{sync.timer ? 1 : 0}</p>
              <p className="text-gray-500 text-[10px]">timer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
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
