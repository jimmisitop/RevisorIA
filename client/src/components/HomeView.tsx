import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, Github, Sparkles, Check, FileCode, FlaskConical, Shield } from 'lucide-react';
import { ActiveView } from '../types';

interface HomeViewProps {
  onNavigate: (view: ActiveView) => void;
  onOpenPR: (prId: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenPR }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between p-8 lg:p-14 max-w-7xl mx-auto">
      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-4 lg:pt-8">
        {/* Left Column: Heading and Pitch */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-5">
            <h1 className="text-6xl sm:text-7xl lg:text-[76px] font-normal text-slate-900 tracking-tight leading-[1.04] font-['Instrument_Serif',Georgia,serif]">
              AI that reviews <br />
              so you can <span className="text-blue-600 font-['Outfit',sans-serif] font-bold tracking-tight">build</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl leading-relaxed">
              RevisorIA analyzes your Pull Requests, finds risks, missing tests, security issues and more — so your team can move faster.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Get started
            </button>
          </div>

          {/* Key Feature items matching the screenshot */}
          <div className="pt-2 flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-600">
                <Clock className="w-3 h-3" />
              </div>
              <span>
                Risk score <span className="text-slate-400 font-normal">(Low / Medium / High)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-600">
                <Shield className="w-3 h-3" />
              </div>
              <span>Security & test findings</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-600">
                <Check className="w-3 h-3" />
              </div>
              <span>Actionable checklist</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic Floating Card Mockup matching screenshot */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          {/* Subtle blue flower / abstract shape background matching design */}
          <div className="absolute -top-10 -right-8 w-72 h-72 bg-blue-100/70 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-0 -bottom-4 w-40 h-40 bg-indigo-100/60 rounded-full blur-xl pointer-events-none" />
          
          {/* Decorative artistic floral / star element */}
          <div className="absolute -right-6 top-8 text-blue-300/60 pointer-events-none select-none">
            <svg width="120" height="120" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0 C50 30 70 50 100 50 C70 50 50 70 50 100 C50 70 30 50 0 50 C30 50 50 30 50 0 Z" />
            </svg>
          </div>

          {/* Dark Floating PR Card Mockup */}
          <div
            onClick={() => onOpenPR(124)}
            className="relative z-10 w-full max-w-sm bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/10 group"
          >
            {/* PR Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Github className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-mono font-bold text-slate-200">PR #124</span>
              </div>
              <span className="text-[11px] text-slate-400 group-hover:text-blue-400 transition-colors flex items-center gap-1 font-medium">
                View review <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            {/* Inner White Card showing Risk & Findings */}
            <div className="mt-4 bg-white text-slate-900 rounded-2xl p-5 shadow-inner space-y-4">
              {/* Risk Score circle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Risk Score</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" r="13" stroke="#F1F5F9" strokeWidth="3" fill="none" />
                      <circle
                        cx="16"
                        cy="16"
                        r="13"
                        stroke="#F59E0B"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="81.6"
                        strokeDashoffset="28"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-amber-500">Medium</span>
                </div>
              </div>

              {/* Findings list matching screenshot */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">2 sensitive files</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <FlaskConical className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">Tests missing</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">1 security concern</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">4 items in checklist</span>
                </div>
              </div>
            </div>

            {/* Sparkle decorative */}
            <div className="absolute -bottom-2 -right-2 text-white/40">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sponsor Banner: Built with IBM Bob 2.0 & Jev */}
      <div className="pt-16 pb-4 border-t border-slate-200/80 mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Built with</span>
            <span className="font-extrabold text-sm tracking-tight text-slate-800 flex items-center gap-1">
              <span className="text-blue-700 font-black tracking-tighter">IBM</span> Bob 2.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Powered by Bob for analysis and Jev for risk scoring.
          </p>
        </div>

        {/* Dual tech badges */}
        <div className="flex items-center gap-4">
          {/* Bob 2.0 Badge */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
              {/* Mascot / Agent head icon */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18 2.5 2.5 0 0 0 10 15.5 2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800">Bob 2.0</span>
              <span className="block text-[10px] text-slate-500 font-medium">Parallel Agent Scanner</span>
            </div>
          </div>

          {/* Jev Badge */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
              {/* Honeycomb / Decision icon */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l7 4v8l-7 4-7-4V6l7-4zm0 2.3L6.8 7.3v5.4L12 15.7l5.2-3V7.3L12 4.3z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800">Jev</span>
              <span className="block text-[10px] text-slate-500 font-medium">TypeSafe AI Decision</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
