import React from 'react';
import { Cpu } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  bobStatus?: { installed: boolean; version: string; hasKey: boolean };
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, bobStatus }) => {
  const titles: Record<ActiveView, { title: string; description: string }> = {
    home: { title: 'RevisorIA', description: 'Server-side pull request analysis with IBM Bob.' },
    dashboard: { title: 'Dashboard', description: 'Choose a GitHub repository and analyze its pull requests.' },
    history: { title: 'Review History', description: 'Pull requests analyzed during this server session.' },
    'pr-detail': { title: 'Review Report', description: 'Detailed findings from the selected pull request.' },
  };
  const heading = titles[currentView];

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-xs sticky top-0 z-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{heading.title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{heading.description}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-[11px] font-mono font-medium text-slate-700">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span>Bob {bobStatus?.version || 'unavailable'}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${bobStatus?.hasKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </div>
        {currentView !== 'dashboard' && (
          <button onClick={() => onNavigate('dashboard')} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
            Dashboard
          </button>
        )}
      </div>
    </header>
  );
};
