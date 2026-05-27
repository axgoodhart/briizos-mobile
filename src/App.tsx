import { useState } from 'react'
import AddressBar from './components/AddressBar'
import BottomNav from './components/BottomNav'
import HomePanel from './panels/HomePanel'
import FilesPanel from './panels/FilesPanel'
import ChatsPanel from './panels/ChatsPanel'
import AutomationsPanel from './panels/AutomationsPanel'
import SpacePanel from './panels/SpacePanel'
import SkillsPanel from './panels/SkillsPanel'
import MenuPanel from './panels/MenuPanel'

export type PanelId = 'home' | 'files' | 'chats' | 'automations' | 'space' | 'skills' | 'menu'

export interface TabInfo {
  id: string
  label: string
  closable?: boolean
}

export default function App() {
  const [activePanel, setActivePanel] = useState<PanelId>('home')
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'home', label: 'Home', closable: false }
  ])

  const addPanel = (panelId: PanelId) => {
    setTabs(prev => {
      const existing = prev.find(t => t.id === panelId)
      if (!existing) {
        const labelMap: Record<string, string> = {
          home: 'Home',
          files: 'Files',
          chats: 'Chats',
          automations: 'Automations',
          space: 'Space',
          skills: 'Skills',
          menu: 'Menu'
        }
        return [...prev, { id: panelId, label: labelMap[panelId], closable: true }]
      }
      return prev
    })
    setActivePanel(panelId)
  }

  const closePanel = (panelId: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== panelId)
      if (activePanel === panelId && next.length > 0) {
        setActivePanel(next[next.length - 1].id as PanelId)
      }
      return next
    })
  }

  const switchPanel = (panelId: PanelId) => {
    if (panelId === 'menu') {
      addPanel('menu')
    } else {
      addPanel(panelId)
    }
  }

  const renderPanel = () => {
    switch (activePanel) {
      case 'home': return <HomePanel />
      case 'files': return <FilesPanel />
      case 'chats': return <ChatsPanel />
      case 'automations': return <AutomationsPanel />
      case 'space': return <SpacePanel />
      case 'skills': return <SkillsPanel />
      case 'menu': return <MenuPanel onNavigate={addPanel} />
      default: return <HomePanel />
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex justify-center items-start">
      <div className="w-full max-w-[430px] h-[100dvh] bg-[#16162a] flex flex-col overflow-hidden relative">
        <AddressBar domain="briizos.zo.computer" />
        
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-2 py-2 bg-[#16162a] border-b border-[#252540] overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id as PanelId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                activePanel === tab.id
                  ? 'bg-[#252540] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className={activePanel === tab.id ? '' : 'italic'}>{tab.label}</span>
              {tab.closable && (
                <span
                  onClick={(e) => { e.stopPropagation(); closePanel(tab.id) }}
                  className="text-gray-500 hover:text-white ml-1"
                >×</span>
              )}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto">
          {renderPanel()}
        </div>

        {/* Bottom nav */}
        <BottomNav active={activePanel} onNavigate={switchPanel} />
      </div>
    </div>
  )
}
