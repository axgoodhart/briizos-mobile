import type { ElementType } from 'react';
import type { ViewId } from '../App';
import { Home, FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Settings, ChevronRight, Database } from 'lucide-react';
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
  { id: 'home', label: 'Home', icon: Home, subtitle: sync.status === 'ready' ? 'Live with Web data' : 'Chat with Zo' },
  { id: 'files', label: 'Files', icon: FolderOpen, subtitle: `${syncedRecordCount} synced records` },
  { id: 'chats', label: 'Chats', icon: MessageCircle, subtitle: `${chatCount} chat records` },
  { id: 'automations', label: 'Automations', icon: Clock, subtitle: `${sync.tasks.length} tasks / ${sync.events.length} events` },
  { id: 'space', label: 'Space', icon: Grid3X3, subtitle: `${externalCount} external or published records` },
  { id: 'skills', label: 'Skills', icon: Wand2, subtitle: 'Tool registry comes next' }];


  return (
    <div style-id="stylo-338" className="h-full flex flex-col bg-[#000]">
      <div style-id="stylo-339" className="px-4 py-4">
        <h2 style-id="stylo-340" className="text-white text-lg font-medium mb-1">Menu</h2>
        <p style-id="stylo-341" className="text-gray-500 text-sm">Navigate your Zo Computer</p>
      </div>

      <div style-id="stylo-342" className="px-4 pb-3">
        <AccountControls style-id="stylo-343" sync={sync} />
      </div>

      <div style-id="stylo-344" className="px-4 pb-3">
        <div style-id="stylo-345" className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3">
          <div style-id="stylo-346" className="flex items-center gap-2 mb-2">
            <Database style-id="stylo-347" size={15} className="text-cyan-200" />
            <p style-id="stylo-348" className="text-white text-sm font-medium">Data</p>
          </div>
          <div style-id="stylo-349" className="grid grid-cols-4 gap-2 text-center">
            <div style-id="stylo-350">
              <p style-id="stylo-351" className="text-white text-sm">{sync.organizer.length}</p>
              <p style-id="stylo-352" className="text-gray-500 text-[10px]">org</p>
            </div>
            <div style-id="stylo-353">
              <p style-id="stylo-354" className="text-white text-sm">{sync.events.length}</p>
              <p style-id="stylo-355" className="text-gray-500 text-[10px]">events</p>
            </div>
            <div style-id="stylo-356">
              <p style-id="stylo-357" className="text-white text-sm">{sync.tasks.length}</p>
              <p style-id="stylo-358" className="text-gray-500 text-[10px]">tasks</p>
            </div>
            <div style-id="stylo-359">
              <p style-id="stylo-360" className="text-white text-sm">{sync.timer ? 1 : 0}</p>
              <p style-id="stylo-361" className="text-gray-500 text-[10px]">timer</p>
            </div>
          </div>
        </div>
      </div>

      <div style-id="stylo-362" className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button style-id="stylo-363"
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#1e1e35] transition-colors text-left">
              
              <div style-id="stylo-364" className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center">
                <Icon style-id="stylo-365" size={18} className="text-gray-400" />
              </div>
              <div style-id="stylo-366" className="flex-1">
                <p style-id="stylo-367" className="text-white font-medium text-sm">{item.label}</p>
                <p style-id="stylo-368" className="text-gray-500 text-xs">{item.subtitle}</p>
              </div>
              <ChevronRight style-id="stylo-369" size={16} className="text-gray-600" />
            </button>);

        })}

        <button style-id="stylo-370"
        onClick={() => onNavigate('chats')}
        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#1e1e35] transition-colors text-left">
          
          <div style-id="stylo-371" className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center">
            <Settings style-id="stylo-372" size={18} className="text-gray-400" />
          </div>
          <div style-id="stylo-373" className="flex-1">
            <p style-id="stylo-374" className="text-white font-medium text-sm">Settings</p>
            <p style-id="stylo-375" className="text-gray-500 text-xs">UX, Advanced, Account</p>
          </div>
          <ChevronRight style-id="stylo-376" size={16} className="text-gray-600" />
        </button>
      </div>

      <div style-id="stylo-377" className="px-4 py-4 text-center">
        <p style-id="stylo-378" className="text-gray-600 text-xs">Zo Computer v1.0</p>
        <p style-id="stylo-379" className="text-gray-700 text-xs">briizoscomputer</p>
      </div>
    </div>);

}