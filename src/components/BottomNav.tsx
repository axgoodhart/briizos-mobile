import { FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Menu, Home } from 'lucide-react'
import type { PanelId } from '../App'

interface BottomNavProps {
  active: PanelId
  onNavigate: (panel: PanelId) => void
}

const navItems: { id: PanelId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'chats', label: 'Chats', icon: MessageCircle },
  { id: 'automations', label: 'Automations', icon: Clock },
  { id: 'space', label: 'Space', icon: Grid3X3 },
  { id: 'skills', label: 'Skills', icon: Wand2 },
  { id: 'menu', label: 'Menu', icon: Menu },
]

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <div className="bg-[#1a1a2e]/95 backdrop-blur border-t border-[#252540] px-1 py-2">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-white bg-[#252540]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
