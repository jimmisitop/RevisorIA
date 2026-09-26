import React, { useState } from 'react';
import { Search, Filter, ArrowRight, Github, FileCode, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { PullRequest } from '../types';

interface HistoryViewProps {
  pullRequests: PullRequest[];
  onOpenPR: (prId: number) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ pullRequests, onOpenPR }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredPRs = pullRequests.filter((pr) => {
    const matchesSearch =
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.repo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `#${pr.prNumber}`.includes(searchTerm) ||
      pr.author.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'All' || pr.riskLevel.toLowerCase() === riskFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || pr.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search PRs by repo, title, #number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2 py-1 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Risk:</span>
            {['All', 'High', 'Medium', 'Low'].map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  riskFilter === r
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* PR Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 px-6 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-1">PR</div>
          <div className="col-span-4">Repository & Title</div>
          <div className="col-span-2">Author</div>
          <div className="col-span-2 text-center">Risk Score</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Time</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPRs.map((pr) => {
            const isHigh = pr.riskLevel === 'High';
            const isMed = pr.riskLevel === 'Medium';

            return (
              <div
                key={pr.id}
                onClick={() => onOpenPR(pr.id)}
                className="grid grid-cols-12 items-center py-4 px-6 hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                {/* PR Number */}
                <div className="col-span-1 flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono text-slate-900">#{pr.prNumber}</span>
                </div>

                {/* Repo & Title */}
                <div className="col-span-4 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 font-mono">{pr.repo}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{pr.baseBranch} ← {pr.headBranch}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{pr.title}</p>
                </div>

                {/* Author */}
                <div className="col-span-2 flex items-center gap-2">
                  <img
                    src={pr.author.avatar}
                    alt={pr.author.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <span className="text-xs font-medium text-slate-700 capitalize">{pr.author.name}</span>
                </div>

                {/* Risk Score */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isHigh
                        ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        : isMed
                        ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                    }`}
                  >
                    {pr.riskLevel} ({pr.riskScore})
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2 flex justify-center">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      pr.status === 'Reviewed' || pr.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}
                  >
                    {pr.status}
                  </span>
                </div>

                {/* Reviewed Time */}
                <div className="col-span-1 text-right">
                  <span className="text-xs text-slate-400 font-medium">{pr.reviewedAt}</span>
                </div>
              </div>
            );
          })}

          {filteredPRs.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No pull requests matched your current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
