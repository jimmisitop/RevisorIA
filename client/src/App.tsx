import React, { useState, useEffect } from 'react';
import { ActiveView, PullRequest } from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { DashboardView } from './components/DashboardView';
import { PRDetailView } from './components/PRDetailView';
import { HistoryView } from './components/HistoryView';
import { AgentTraceModal } from './components/AgentTraceModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>('home');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [bobStatus, setBobStatus] = useState<{ installed: boolean; version: string; hasKey: boolean; apiKeyMasked?: string }>({
    installed: false,
    version: '',
    hasKey: false,
  });
  const [isAgentTraceModalOpen, setIsAgentTraceModalOpen] = useState(false);

  // Load initial data and Bob status
  useEffect(() => {
    async function initData() {
      const bobData = await api.getBobStatus();
      if (bobData) {
        setBobStatus(bobData);
      }
    }
    initData();
  }, []);

  const handleOpenPR = (prId: number) => {
    const found = pullRequests.find((p) => p.id === prId || p.prNumber === prId);
    if (found) {
      setSelectedPR(found);
      setCurrentView('pr-detail');
    }
  };

  const handleAnalysisComplete = (newPR: PullRequest) => {
    setPullRequests((prev) => [newPR, ...prev]);
    setSelectedPR(newPR);
    setCurrentView('pr-detail');
  };

  const handleUpdatePR = (updated: PullRequest) => {
    setPullRequests((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPR(updated);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-['Outfit','Plus_Jakarta_Sans',sans-serif]">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          bobStatus={bobStatus}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'home' && (
            <HomeView
              onNavigate={(view) => setCurrentView(view)}
              onOpenPR={handleOpenPR}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              pullRequests={pullRequests}
              onOpenPR={handleOpenPR}
              onNavigate={(view) => setCurrentView(view)}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          {currentView === 'pr-detail' && selectedPR && (
            <PRDetailView
              pullRequest={selectedPR}
              onBack={() => setCurrentView('dashboard')}
              onOpenAgentTrace={() => setIsAgentTraceModalOpen(true)}
              onUpdatePR={handleUpdatePR}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              pullRequests={pullRequests}
              onOpenPR={handleOpenPR}
            />
          )}

        </main>
      </div>

      {/* Agent Trace Inspector Modal */}
      {selectedPR && (
        <AgentTraceModal
          isOpen={isAgentTraceModalOpen}
          onClose={() => setIsAgentTraceModalOpen(false)}
          pullRequest={selectedPR}
        />
      )}

    </div>
  );
}

