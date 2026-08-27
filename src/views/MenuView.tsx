import type { ElementType } from 'react';
import type { ViewId } from '.App';
import { Home, FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Settings, ChevronRight, Database, BookOpenText } from 'lucide-react';
import AccountControls from '../components/AccountControls';
import type { BriizOSMobileState } from '../types/briizos';

interface MenuViewProps {
  onNavigate: (view: ViewId) => void;
  sync: BriizOSMobileState;
}

export default function MenuView({ onNavigate, sync }: MenuViewProps) {
  const chatCount = sync.organizer.filter((item) => item.type === 'chat' || item.chat).length;
  const externalCount = sync.organizer.filter((item) => item.type === 'external' || item.external).length;
  const syncedRecordCount = sync.organizer.length + sync.events.length + sync.tasks.length + (sync.timer ? 1 : 0);
  const menuItems: {id: ViewId;label: string;icon: ElementType;subtitle?: string;}[] = [
  { id: 'home', label: 'Home', icon: Home, subtitle: sync.status === 'ready' ? 'Live with Web data' : 'Chat with briizOS' },
  { id: 'journals', label: 'Journals', icon: BookOpenText, subtitle: 'Your private shelf' },
  { id: 'files', label: 'Files', icon: FolderOpen, subtitle: `${syncedRecordCount} synced records` },
  { id: 'chats', label: 'Chats', icon: MessageCircle, subtitle: `${chatCount} chat records` },
  { id: 'automations', label: 'Automations', icon: Clock, subtitle: `${sync.tasks.length} tasks / ${sync.events.length} events` },
  { id: 'space', label: 'Space', icon: Grid3X3, subtitle: `${externalCount} external or published records` },
  { id: 'skills', label: 'Skills', icon: Wand2, subtitle: 'Tool registry comes next' }];


  return (
    <div className="stack-3">
      <div className="div-spacing-6">
        <h2 className="h2-spacing">Menu</h2>
        <p className="small-7">Navigate your briizOS</p>
      </div>

      <div className="div-spacing-7">
        <AccountControls sync={sync} />
      </div>

      <div className="div-spacing-7">
        <div className="card">
          <div className="row-19">
            <Database size={15} className="userround-tone" />
            <p className="small-4">Data</p>
          </div>
          <div className="four-col-grid">
            <div>
              <p className="small-20">{sync.organizer.length}</p>
              <p className="span-tone">org</p>
            </div>
            <div>
              <p className="small-20">{sync.events.length}</p>
              <p className="span-tone">events</p>
            </div>
            <div>
              <p className="small-20">{sync.tasks.length}</p>
              <p className="span-tone">tasks</p>
            </div>
            <div>
              <p className="small-20">{sync.timer ? 1 : 0}</p>
              <p className="span-tone">timer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="row-20">
              
              <div className="card-row-center-9">
                <Icon size={18} className="icon-tone" />
              </div>
              <div className="div-styled-2">
                <p className="small-4">{item.label}</p>
                <p className="small-5">{item.subtitle}</p>
              </div>
              <ChevronRight size={16} className="chevronright-tone" />
            </button>);

        })}

        <button
          onClick={() => onNavigate('chats')}
          className="row-20">
          
          <div className="card-row-center-9">
            <Settings size={18} className="icon-tone" />
          </div>
          <div className="div-styled-2">
            <p className="small-4">Settings</p>
            <p className="small-5">UX, Advanced, Account</p>
          </div>
          <ChevronRight size={16} className="chevronright-tone" />
        </button>
      </div>

      <div className="div-spacing-5">
        <p className="small-30">briizOS v1.0</p>
        <p className="small-31">briizoscomputer</p>
      </div>
    </div>);

}
