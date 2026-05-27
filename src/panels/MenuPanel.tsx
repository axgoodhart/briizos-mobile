import type { PanelId } from '../App'
import { Home, FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Settings, ChevronRight } from 'lucide-react'

interface MenuPanelProps {
  onNavigate: (panel: PanelId) => void
}

const menuItems: { id: PanelId; label: string; icon: React.ElementType; subtitle?: string }[] = [
  { id: 'home', label: 'Home', icon: Home, subtitle: 'Chat with Zo' },
  { id: 'files', label: 'Files', icon: FolderOpen, subtitle: 'Manage files' },
  { id: 'chats', label: 'Chats', icon: MessageCircle, subtitle: 'Conversations' },
  { id: 'automations', label: 'Automations', icon: Clock, subtitle: 'Scheduled tasks' },
  { id: 'space', label: 'Space', icon: Grid3X3, subtitle: 'Published pages' },
  { id: 'skills', label: 'Skills', icon: Wand2, subtitle: 'Installed & Hub' },
]

export default function MenuPanel({ onNavigate }: MenuPanelProps) {
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
        <p className="text-gray-700 text-xs">briizos.zo.computer</p>
      </div>
    </div>
  )
}
