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

  const switchView = (viewId: ViewId) => {
    if (viewId === 'menu') {
      addView('menu');
    } else {
      addView(viewId);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':return <HomeView />;
      case 'journals':return <JournalsView />;
      case 'files':return <FilesView sync={sync} />;
      case 'chats':return <ChatsView sync={sync} />;
      case 'automations':return <AutomationsView />;
      case 'space':return <SpaceView />;
      case 'skills':return <SkillsView />;
      case 'menu':return <MenuView onNavigate={addView} sync={sync} />;
      default:return <HomeView />;
    }
  };

  return (
    <div className="row">
      <div className="stack">
        
        {/* Tab bar */}


        {/* View content */}
        <div className="scroll">
          {renderView()}
        </div>

        {/* Bottom nav */}
        <SyncStatusStrip sync={sync} />

        <BottomNav active={activeView} onNavigate={switchView} />

      </div>
    </div>);

}
