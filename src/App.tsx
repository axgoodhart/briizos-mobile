import { useState } from 'react';
import BottomNav from './components/BottomNav';
import SyncStatusStrip from './components/SyncStatusStrip';
import { useBriizOSSync } from './hooks/useBriizOSSync';
import HomeView from './views/HomeView';
import FilesView from './views/FilesView';
import ChatsView from './views/ChatsView';
import AutomationsView from './views/AutomationsView';
import SpaceView from './views/SpaceView';
import SkillsView from './views/SkillsView';
import MenuView from './views/MenuView';
import JournalsView from './views/JournalsView';

export type ViewId = 'home' | 'journals' | 'files' | 'chats' | 'automations' | 'space' | 'skills' | 'menu';

export interface TabInfo {
  id: string;
  label: string;
  closable?: boolean;
}

export default function App() {
  const sync = useBriizOSSync();
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [tabs, setTabs] = useState<TabInfo[]>([
  { id: 'home', label: 'Home', closable: false }]
  );

  const addView = (viewId: ViewId) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === viewId);
      if (!existing) {
        const labelMap: Record<string, string> = {
          home: 'Home',
          journals: 'Journals',
          files: 'Files',
          chats: 'Chats',
          automations: 'Automations',
          space: 'Space',
          skills: 'Skills',
          menu: 'Menu'
        };
        return [...prev, { id: viewId, label: labelMap[viewId], closable: true }];
      }
      return prev;
    });
    setActiveView(viewId);
  };

  const closeView = (viewId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== viewId);
      if (activeView === viewId && next.length > 0) {
        setActiveView(next[next.length - 1].id as ViewId);
      }
      return next;
    });
  };

  const switchView = (viewId: ViewId) => {
    if (viewId === 'menu') {
      addView('menu');
    } else {
      addView(viewId);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':return <HomeView style-id="stylo-0" />;
      case 'journals':return <JournalsView />;
      case 'files':return <FilesView style-id="stylo-1" sync={sync} />;
      case 'chats':return <ChatsView style-id="stylo-2" sync={sync} />;
      case 'automations':return <AutomationsView style-id="stylo-3" />;
      case 'space':return <SpaceView style-id="stylo-4" />;
      case 'skills':return <SkillsView style-id="stylo-5" />;
      case 'menu':return <MenuView style-id="stylo-6" onNavigate={addView} sync={sync} />;
      default:return <HomeView style-id="stylo-7" />;
    }
  };

  return (
    <div style-id="stylo-8" className="min-h-screen bg-black flex justify-center items-start">
      <div style-id="stylo-9" className="w-full max-w-[430px] h-[100dvh] bg-[#011605] flex flex-col overflow-hidden relative">
        
        {/* Tab bar */}
        <div style-id="stylo-10" id="tabbar" className="flex items-center gap-1 px-2 py-2 bg-[#000] border-b border-[#252540] overflow-x-auto scrollbar-hide">
          {tabs.map((tab) =>
          <button style-id="stylo-11"
          key={tab.id}
          onClick={() => setActiveView(tab.id as ViewId)}
          id="tabs"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
          activeView === tab.id ?
          'opacity-100 border-t border-cyan-500' :
          ' bg-blend-multiply opacity-65 border-t-0 border-[#252540] hover:opacity-100'}`
          }>
            
              <span style-id="stylo-12" className={activeView === tab.id ? '' : 'italic'}>{tab.label}</span>
              {tab.closable &&
            <span style-id="stylo-13"
            onClick={(e) => {e.stopPropagation();closeView(tab.id);}}
            className="text-gray-500 hover:text-white ml-1">
              ×</span>
            }
            </button>
          )}
        </div>

        <SyncStatusStrip style-id="stylo-14" sync={sync} />

        {/* View content */}
        <div style-id="stylo-15" className="flex-1 overflow-y-auto">
          {renderView()}
        </div>

        {/* Bottom nav */}
        <BottomNav style-id="stylo-16" active={activeView} onNavigate={switchView} />
      </div>
    </div>);

}