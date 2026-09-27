import React from 'react';
import { Home, LayoutDashboard } from 'lucide-react';
import { ActiveView } from '../types';

interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'home' as ActiveView, label: 'Home', icon: Home },
    { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: LayoutDashboard },
    // { id: 'history' as ActiveView, label: 'History', icon: History },
    // { id: 'settings' as ActiveView, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 min-w-[16rem] bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 px-4 py-6 select-none z-30">
      <div className="space-y-8">
        {/* Brand Logo matching the starburst in screenshot */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 px-3 cursor-pointer group"
        >
          <div className="relative w-8 h-8 flex items-center justify-center text-blue-600 transition-transform group-hover:rotate-45 duration-300">
            {/* Custom geometric starburst / asterisk icon */}
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
              <path d="M12 0L13.5 8.5L22 7L15.5 12L22 17L13.5 15.5L12 24L10.5 15.5L2 17L8.5 12L2 7L10.5 8.5L12 0Z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Revisor<span className="text-blue-600 font-extrabold">IA</span>
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'history' && currentView === 'pr-detail');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-3 text-[11px] text-slate-400">Select a repository from Dashboard to begin.</div>
    </aside>
  );
};
