import { FolderOpen, MessageCircle, Clock, Grid3X3, Wand2, Menu, Home, BookOpenText } from 'lucide-react';
import type { ViewId } from '../App';
import '../App.css';

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
    <div className="div-spacing">
      <div className="row-3 mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`stack-2 mobile-bottom-nav__item ${isActive
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
              style={{
                background: isActive
                  ? 'linear-gradient(to bottom, rgba(0,255,255,.195) 50%, transparent 50%), radial-gradient(circle at center, rgba(255,255,255,.15), transparent 70%), #1a1a1a'
                  : undefined,
              }}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="span-tone mobile-bottom-nav__label">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>);

}
