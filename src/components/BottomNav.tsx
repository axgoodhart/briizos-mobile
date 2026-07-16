import { FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Menu, Home, BookOpenText } from 'lucide-react';
import type { ViewId } from '../App';
import './BottomNav.css';

interface BottomNavProps {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
}

const navItems: {id: ViewId;label: string;icon: React.ElementType;}[] = [
{ id: 'home', label: 'Home', icon: Home },
{ id: 'journals', label: 'Journals', icon: BookOpenText },
{ id: 'files', label: 'Files', icon: FolderOpen },
{ id: 'chats', label: 'Chats', icon: MessageCircle },
{ id: 'automations', label: 'Automations', icon: Clock },
{ id: 'space', label: 'Space', icon: Grid3X3 },
{ id: 'skills', label: 'Skills', icon: Wand2 },
{ id: 'menu', label: 'Menu', icon: Menu }];


export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <div style-id="stylo-38" className="bg-[#1a1a2e]/95 backdrop-blur border-t border-[#252540] px-1 py-2">
      <div style-id="stylo-39" className="flex items-center justify-around row-3 mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button style-id="stylo-40"
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all stack-2 mobile-bottom-nav__item ${
            isActive ?
            'text-white bg-[#252540]' :
            'text-gray-500 hover:text-gray-300'}`
            }>
              
              <Icon style-id="stylo-41" size={20} strokeWidth={1.5} />
              <span style-id="stylo-42" className="text-[10px] span-tone mobile-bottom-nav__label">{item.label}</span>
            </button>);

        })}
      </div>
    </div>);

}