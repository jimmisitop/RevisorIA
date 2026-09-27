import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Github, 
  ExternalLink, 
  User, 
  FileCode, 
  GitCommit, 
  FlaskConical, 
  Check, 
  X, 
  AlertCircle, 
  ShieldAlert, 
  Shield, 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Layers,
  ChevronDown,
  Terminal,
  Send,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { PullRequest, ActiveView } from '../types';
import { api } from '../services/api';

interface PRDetailViewProps {
  pullRequest: PullRequest;
  onBack: () => void;
  onOpenAgentTrace: () => void;
  onUpdatePR: (updated: PullRequest) => void;
}

export const PRDetailView: React.FC<PRDetailViewProps> = ({
  pullRequest: initialPR,
  onBack,
  onOpenAgentTrace,
  onUpdatePR,
}) => {
  const [pr, setPr] = useState<PullRequest>(initialPR);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'findings' | 'checklist'>('overview');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    setPr(initialPR);
  }, [initialPR]);

  // Handle checklist item toggle
  const handleToggleChecklist = async (itemId: string) => {
    setActionError(null);
    try {
      const updated = await api.toggleChecklistItem(pr.id, itemId);
      if (updated) {
        setPr(updated);
        onUpdatePR(updated);
      } else {
        setActionError('Could not update the checklist. Check that the updated server is running and try again.');
      }
    } catch (e) {
      console.error('Failed to toggle checklist item', e);
    }
  };

  // Show success only when the server confirms the review was posted.
  const handlePostVerdict = async (type: 'approve' | 'request_changes') => {
    if (isPostingComment) return;
    setIsPostingComment(true);
    setActionSuccessMessage(null);
    setActionError(null);
    try {
      const res = await api.postComment(pr.id, type, pr.repo);
      if (!res.success) {
        setActionError(res.message);
        return;
      }
      if (res.success && res.pr) {
        setPr(res.pr);
        onUpdatePR(res.pr);
      }
      setActionSuccessMessage(res.message);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPostingComment(false);
    }
  };

  const isHighRisk = pr.riskLevel === 'High';
  const isMedRisk = pr.riskLevel === 'Medium';

  // Gauge calculation for Risk Score (e.g. 8.7 out of 10)
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const scorePercent = (pr.riskScore / 10) * 100;
  const strokeOffset = circumference - (scorePercent / 100) * circumference;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div role="note" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 leading-relaxed">
        <strong>Notices only — human review still required.</strong> These buttons post comments to GitHub, not formal approvals. They do not merge, close, or delete the PR or its branch.
        {' '}You can analyze this PR again, with or without new commits. Saved analyses are reused and may still show findings that have already been fixed.
      </div>
      {/* Top Breadcrumb Navigation matching screenshot */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to history</span>
        </button>
      </div>

      {/* Main PR Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* PR Number, Repo, Branches */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-slate-900" />
                <h1 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  PR #{pr.prNumber}
                </h1>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
                {pr.repo}
              </span>

              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <span>{pr.baseBranch}</span>
                <span>←</span>
                <span className="text-slate-600 font-semibold">{pr.headBranch}</span>
              </span>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-slate-800">{pr.title}</h2>
          </div>

          {/* Badges and Actions matching screenshot */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                isHighRisk
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : isMedRisk
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isHighRisk ? 'bg-rose-600' : isMedRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {pr.riskLevel} Risk
            </span>

            <span className="text-xs text-slate-400 font-medium">{pr.reviewedAt}</span>

            <a
              href={pr.htmlUrl || `https://github.com/${pr.repo}/pull/${pr.prNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 4 Metadata Cards Row matching bottom-left screenshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Author */}
          <div className="bg-slate-50/70 rounded-xl p-3 flex items-center gap-3">
            <img
              src={pr.author.avatar}
              alt={pr.author.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Author</span>
              <span className="text-xs font-bold text-slate-800 capitalize">{pr.author.name}</span>
            </div>
          </div>

          {/* Files Changed */}
          <div className="bg-slate-50/70 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Files Changed</span>
              <span className="text-xs font-bold text-slate-800">{pr.filesCount} files</span>
            </div>
          </div>

          {/* Lines Changed */}
          <div className="bg-slate-50/70 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-mono text-xs font-bold">
              ±
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Lines Changed</span>
              <span className="text-xs font-bold font-mono">
                <span className="text-emerald-600">+{pr.additions}</span>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-rose-600">-{pr.deletions}</span>
              </span>
            </div>
          </div>

          {/* Tests */}
          <div className="bg-slate-50/70 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pr.testsStatus === 'Passing' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tests</span>
              <span className={`text-xs font-bold ${pr.testsStatus === 'Passing' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {pr.testsStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pt-2">
          <div className="flex items-center gap-6">
            {(['overview', 'files', 'findings', 'checklist'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs font-bold capitalize transition-all relative ${
                  activeTab === tab
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Bob 2.0 Subagents inspector trigger button */}
          <button
            onClick={onOpenAgentTrace}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors mb-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Bob 2.0 Subagents Trace</span>
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in">
          <span>{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {actionError}
        </div>
      )}

      {/* OVERVIEW TAB CONTENT (3 Columns matching bottom-left screenshot) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Risk Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-6">Risk Analysis</h3>

              {/* Circular Gauge Gauge */}
              <div className="flex flex-col items-center justify-center my-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-36 h-36 -rotate-90">
                    <circle cx="72" cy="72" r={radius} stroke="#F1F5F9" strokeWidth="8" fill="none" />
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke={isHighRisk ? '#EF4444' : isMedRisk ? '#F59E0B' : '#10B981'}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span
                      className={`text-lg font-extrabold ${
                        isHighRisk ? 'text-rose-500' : isMedRisk ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                    >
                      {pr.riskLevel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Risk Score</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{pr.riskScore} / 10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation paragraph matching screenshot */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {pr.riskSummary}
              </p>
            </div>
          </div>

          {/* Card 2: Key Findings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Key Findings</h3>

            <div className="space-y-4 pt-1">
              {pr.findings.map((f) => {
                let iconColor = 'text-amber-500 bg-amber-50';
                let IconComponent = AlertCircle;

                if (f.category === 'sensitive_files') {
                  iconColor = 'text-rose-500 bg-rose-50';
                  IconComponent = ShieldAlert;
                } else if (f.category === 'tests_missing') {
                  iconColor = 'text-pink-500 bg-pink-50';
                  IconComponent = FlaskConical;
                } else if (f.category === 'security_concern') {
                  iconColor = 'text-orange-500 bg-orange-50';
                  IconComponent = Shield;
                } else if (f.category === 'documentation') {
                  iconColor = 'text-yellow-600 bg-yellow-50';
                  IconComponent = FileText;
                }

                return (
                  <div key={f.id} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="text-xs flex-1">
                      <span className="font-bold text-slate-800 block">{f.title}</span>
                      <p className="text-slate-500 font-normal text-[11px] mt-0.5 leading-snug">
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })}

              {pr.findings.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No findings were included in this report.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Checklist</h3>
                <span className="text-[10px] text-slate-400 font-medium">Click to toggle resolution</span>
              </div>

              <div className="space-y-3.5 pt-1">
                {pr.checklist.length === 0 && <p className="text-xs text-slate-500">No checklist actions were provided.</p>}
                {pr.checklist.map((item) => {
                  const isChecked = item.completed;
                  const isWarning = item.status === 'warning' && !isChecked;
                  const isFailed = item.status === 'failed' && !isChecked;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id)}
                      className="flex items-center justify-between py-1 cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : isWarning
                              ? 'border-amber-400 text-amber-500'
                              : 'border-rose-400 text-rose-500'
                          }`}
                        >
                          {isChecked ? (
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          ) : isWarning ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          ) : (
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold transition-colors ${
                            isChecked ? 'text-slate-800 line-through opacity-70' : 'text-slate-700 group-hover:text-slate-900'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* Status indicator matching the screenshot symbols */}
                      <span className="text-xs">
                        {isChecked ? (
                          <span className="text-emerald-500 font-bold">✔</span>
                        ) : isWarning ? (
                          <span className="text-amber-500 font-bold">⊗</span>
                        ) : (
                          <span className="text-rose-500 font-bold">❌</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick action buttons at bottom of checklist */}
            <div className="pt-5 border-t border-slate-100 flex items-center gap-2">
              <button
                disabled={isPostingComment}
                onClick={() => handlePostVerdict('request_changes')}
                className="flex-1 py-2 px-3 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Post Change Request
              </button>
              <button
                disabled={isPostingComment}
                onClick={() => handlePostVerdict('approve')}
                className="flex-1 py-2 px-3 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                Suggest Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILES TAB CONTENT (Diff viewer with sensitive annotations) */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          {/* File list */}
          <div className="lg:col-span-4 border-r border-slate-100 pr-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Changed Files</h4>
            {pr.files.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                  selectedFileIndex === idx
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.filename}</span>
                </div>
                {file.isSensitive && (
                  <span className="text-[10px] font-sans font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md shrink-0">
                    Sensitive
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Diff view */}
          <div className="lg:col-span-8 space-y-4">
            {pr.files[selectedFileIndex] && (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {pr.files[selectedFileIndex].filename}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-mono font-bold">
                      +{pr.files[selectedFileIndex].additions}
                    </span>
                    <span className="text-[11px] text-rose-600 font-mono font-bold">
                      -{pr.files[selectedFileIndex].deletions}
                    </span>
                  </div>
                  {pr.files[selectedFileIndex].isSensitive && (
                    <span className="text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> High security risk file
                    </span>
                  )}
                </div>

                <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  <pre>{pr.files[selectedFileIndex].diffSnippet}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINDINGS TAB */}
      {activeTab === 'findings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Concrete Findings & Remediation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed evidence gathered by IBM Bob 2.0 parallel subagents.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {pr.findings.length} findings
            </span>
          </div>

          <div className="space-y-4">
            {pr.findings.length === 0 && <p className="text-xs text-slate-500">No findings were included in this report.</p>}
            {pr.findings.map((f, i) => (
              <div key={f.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[11px]">
                      {i + 1}
                    </span>
                    {f.title}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      f.severity === 'high' ? 'bg-rose-100 text-rose-700' : f.severity === 'medium' ? 'bg-amber-100 text-amber-700' : f.severity === 'low' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {f.severity === 'unspecified' ? 'Severity: Not specified' : `${f.severity} severity`}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-7">{f.description}</p>
                {f.files && f.files.length > 0 && (
                  <p className="text-[11px] font-mono text-slate-500 pl-7 break-words">Files: {f.files.join(', ')}</p>
                )}
                {f.remediation && (
                  <p className="text-xs text-slate-700 pl-7"><strong>Recommended action: </strong>{f.remediation}</p>
                )}
                <div className="pl-7 pt-2 flex items-center gap-2 text-[11px] text-blue-600 font-semibold">
                  <span>{f.subagent === 'unknown' ? 'Source not specified' : `Subagent: ${f.subagent.toUpperCase()} SCANNER`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHECKLIST TAB */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pre-Merge Action Checklist</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Items must be satisfied or acknowledged before approving this pull request.
              {' '}Resolution is saved for this server session only.
            </p>
          </div>

          <div className="space-y-3">
            {pr.checklist.length === 0 && <p className="text-xs text-slate-500">No checklist actions were provided.</p>}
            {pr.checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklist(item.id)}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-all flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-colors ${
                      item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                    }`}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {item.label}
                    </span>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>
                {item.required && (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              disabled={isPostingComment}
              onClick={() => handlePostVerdict('request_changes')}
              className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
            >
              Post Change Request
            </button>
            <button
              disabled={isPostingComment}
              onClick={() => handlePostVerdict('approve')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              Suggest Approval
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
