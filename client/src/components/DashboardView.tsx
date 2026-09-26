import React, { useState } from 'react';
import { 
  FileText, 
  ArrowRight, 
  Clock, 
  Search, 
  Layers,
  ChevronRight,
  Github,
  LoaderCircle,
  Play
} from 'lucide-react';
import { PullRequest, ActiveView, GitHubPRItem } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  pullRequests: PullRequest[];
  onOpenPR: (prId: number) => void;
  onNavigate: (view: ActiveView) => void;
  onAnalysisComplete: (newPR: PullRequest) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pullRequests,
  onOpenPR,
  onNavigate,
  onAnalysisComplete,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [repositoryPRs, setRepositoryPRs] = useState<GitHubPRItem[]>([]);
  const [selectedRepositoryPR, setSelectedRepositoryPR] = useState<GitHubPRItem | null>(null);
  const [isLoadingRepository, setIsLoadingRepository] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [repositoryMessage, setRepositoryMessage] = useState<string | null>(null);

  const parseRepository = (value: string) => {
    const normalized = value.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git\/?$/, '').replace(/\/$/, '');
    const [owner, repo, ...extra] = normalized.split('/');
    return owner && repo && extra.length === 0 ? { owner, repo } : null;
  };

  const handleFetchRepository = async (event: React.FormEvent) => {
    event.preventDefault();
    const repository = parseRepository(repoInput);
    if (!repository) {
      setRepositoryMessage('Enter a GitHub repository such as owner/repository.');
      return;
    }

    setIsLoadingRepository(true);
    setRepositoryMessage(null);
    setSelectedRepositoryPR(null);
    try {
      const prs = await api.fetchGithubPRs(repository.owner, repository.repo, 'open');
      setRepositoryPRs(prs);
      setRepositoryMessage(prs.length ? `Found ${prs.length} open pull request${prs.length === 1 ? '' : 's'}.` : 'No open pull requests found.');
    } catch (e: any) {
      setRepositoryPRs([]);
      setRepositoryMessage(e.message || 'Could not fetch pull requests from GitHub.');
    } finally {
      setIsLoadingRepository(false);
    }
  };

  const handleAnalyzePR = async () => {
    const repository = parseRepository(repoInput);
    if (!repository || !selectedRepositoryPR) return;
    setIsAnalyzing(true);
    setRepositoryMessage(null);
    try {
      const result = await api.importAndAnalyzeGithubPR({
        owner: repository.owner,
        repo: repository.repo,
        pullNumber: selectedRepositoryPR.number,
      });
      if (!result.success || !result.pullRequest) {
        throw new Error(result.error || 'Bob could not analyze this pull request.');
      }
      onAnalysisComplete(result.pullRequest);
    } catch (e: any) {
      setRepositoryMessage(e.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeRepository = parseRepository(repoInput);
  const analyzedRepositoryPRs = pullRequests.filter((pr) =>
    activeRepository && pr.repo.toLowerCase() === `${activeRepository.owner}/${activeRepository.repo}`.toLowerCase()
  );
  const hasFetchedRepository = Boolean(repoInput.trim() && repositoryMessage);
  const displayedTotal = hasFetchedRepository ? repositoryPRs.length : 0;
  const displayedReviewed = hasFetchedRepository
    ? repositoryPRs.filter((pr) => analyzedRepositoryPRs.some((reviewed) => reviewed.prNumber === pr.number)).length
    : 0;
  const displayedPending = Math.max(0, displayedTotal - displayedReviewed);
  const displayedRisk = {
    high: analyzedRepositoryPRs.filter((pr) => pr.riskLevel === 'High').length,
    medium: analyzedRepositoryPRs.filter((pr) => pr.riskLevel === 'Medium').length,
    low: analyzedRepositoryPRs.filter((pr) => pr.riskLevel === 'Low').length,
  };
  const reviewMap = new Map(analyzedRepositoryPRs.map((pr) => [pr.prNumber, pr]));
  const displayedPRs = repositoryPRs.slice(0, 5).map((pr) => {
    const reviewed = reviewMap.get(pr.number);
    return {
      id: reviewed?.id || pr.id,
      number: pr.number,
      title: pr.title,
      repo: activeRepository ? `${activeRepository.owner}/${activeRepository.repo}` : '',
      riskLevel: reviewed?.riskLevel || 'Not analyzed',
      status: reviewed?.status || 'Not analyzed',
      reviewedAt: reviewed?.reviewedAt || 'Not analyzed',
      openable: Boolean(reviewed),
    };
  });

  // SVG circular calculation helper
  const radius = 16;
  const circumference = 2 * Math.PI * radius; // ~100.53

  const statsTotal = Math.max(displayedTotal, 1);
  const reviewedPercent = Math.round((displayedReviewed / statsTotal) * 100);
  const reviewedOffset = circumference - (reviewedPercent / 100) * circumference;

  const pendingPercent = Math.round((displayedPending / statsTotal) * 100);
  const pendingOffset = circumference - (pendingPercent / 100) * circumference;

  // Donut chart segments for Risk Distribution:
  // Low: 50% (12), Med: 33% (8), High: 17% (4)
  const chartCircumference = 2 * Math.PI * 38;
  const highLength = (displayedRisk.high / statsTotal) * chartCircumference;
  const mediumLength = (displayedRisk.medium / statsTotal) * chartCircumference;
  const lowLength = (displayedRisk.low / statsTotal) * chartCircumference;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <section className="bg-slate-950 rounded-2xl p-6 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-blue-300" />
              <h1 className="text-lg font-bold">Review a GitHub repository</h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">GitHub and Bob requests stay on the server.</p>
          </div>
          <form onSubmit={handleFetchRepository} className="flex w-full lg:max-w-xl gap-2">
            <input
              value={repoInput}
              onChange={(event) => setRepoInput(event.target.value)}
              placeholder="owner/repository"
              aria-label="GitHub repository"
              className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={isLoadingRepository || !repoInput.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {isLoadingRepository ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Fetch PRs
            </button>
          </form>
        </div>

        {(repositoryPRs.length > 0 || repositoryMessage) && (
          <div className="mt-5 border-t border-slate-800 pt-4">
            {repositoryMessage && <p className="mb-3 text-xs text-slate-300">{repositoryMessage}</p>}
            {repositoryPRs.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-3">
                <select
                  value={selectedRepositoryPR?.number || ''}
                  onChange={(event) => setSelectedRepositoryPR(repositoryPRs.find((pr) => pr.number === Number(event.target.value)) || null)}
                  className="min-w-0 flex-1 rounded-xl bg-slate-800 px-3 py-2.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Pull request to analyze"
                >
                  <option value="">Select a pull request</option>
                  {repositoryPRs.map((pr) => <option key={pr.number} value={pr.number}>#{pr.number} {pr.title}</option>)}
                </select>
                <button
                  type="button"
                  onClick={handleAnalyzePR}
                  disabled={isAnalyzing || !selectedRepositoryPR}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isAnalyzing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Analyze with Bob
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4 Metric Cards Row matching top-right screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total PRs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500">Total PRs</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{displayedTotal}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Reviewed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            {/* Circular Progress Ring */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg className="w-9 h-9 -rotate-90">
                <circle cx="18" cy="18" r={radius} stroke="#E2E8F0" strokeWidth="3" fill="none" />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  stroke="#2563EB"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={reviewedOffset}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500">Reviewed</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{displayedReviewed}</span>
              <span className="text-xs font-bold text-slate-400">{reviewedPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            {/* Circular Progress Ring */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg className="w-9 h-9 -rotate-90">
                <circle cx="18" cy="18" r={radius} stroke="#E2E8F0" strokeWidth="3" fill="none" />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  stroke="#F97316"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={pendingOffset}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500">Pending</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{displayedPending}</span>
              <span className="text-xs font-bold text-slate-400">{pendingPercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Avg. Review Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500">Avg. Review Time</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{displayedReviewed ? 'Measured' : 'N/A'}</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                {displayedReviewed ? 'From Bob reviews' : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Pull Requests (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Recent Pull Requests</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono">
                  GitHub REST
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Live pull requests scanned by IBM Bob 2.0</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors pl-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 px-3">
            <div className="col-span-2">PR</div>
            <div className="col-span-4">Repository</div>
            <div className="col-span-2 text-center">Risk</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Reviewed</div>
          </div>

          {/* PR Rows */}
          <div className="divide-y divide-slate-100">
            {displayedPRs.map((pr) => {
              // Badge colors matching UI screenshot
              const isHigh = pr.riskLevel === 'High';
              const isMedium = pr.riskLevel === 'Medium';
              const isLow = pr.riskLevel === 'Low';

              const isReviewed = pr.openable;

              return (
                <div
                  key={pr.id}
                  onClick={() => onOpenPR(pr.id)}
                  className="grid grid-cols-12 items-center py-4 px-3 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* PR Number & Icon */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[11px] font-bold group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                      &lt;/&gt;
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">#{pr.number}</span>
                  </div>

                  {/* Repository & PR Title */}
                  <div className="col-span-4 pr-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{pr.repo}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{pr.title}</p>
                  </div>

                  {/* Risk Badge */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isHigh
                          ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                          : isMedium
                          ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                          : pr.riskLevel === 'Not analyzed'
                          ? 'bg-slate-50 text-slate-500 border border-slate-200/60'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      }`}
                    >
                      {pr.riskLevel}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isReviewed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {pr.status}
                    </span>
                  </div>

                  {/* Reviewed Time */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs text-slate-400 font-medium">{pr.reviewedAt}</span>
                  </div>
                </div>
              );
            })}
            {!displayedPRs.length && (
              <div className="px-3 py-12 text-center text-xs text-slate-400">
                Fetch a GitHub repository above to load its pull requests.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Risk Distribution & Quick Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Risk Distribution Card matching donut chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-900 mb-6">Risk Distribution</h2>

            {/* Donut Graphic */}
            <div className="flex flex-col items-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Modern SVG multi-segment Donut */}
                <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                  
                  {/* Risk segments use the live analyzed counts. */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#10B981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${lowLength} ${chartCircumference}`}
                    strokeDashoffset="0"
                  />
                  {/* Medium segment (33%) -> 79.58 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${mediumLength} ${chartCircumference}`}
                    strokeDashoffset={-lowLength}
                  />
                  {/* High segment (17%) -> 39.80 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#EF4444"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${highLength} ${chartCircumference}`}
                    strokeDashoffset={-(lowLength + mediumLength)}
                  />
                </svg>

                {/* Center text in donut: live repository total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 leading-none">{displayedTotal}</span>
                  <span className="text-[11px] font-medium text-slate-400 mt-1">Total PRs</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full mt-6 space-y-2.5 text-xs font-medium">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600">High</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{displayedRisk.high}</span>
                    <span className="text-slate-400 w-8 text-right">
                      {Math.round((displayedRisk.high / statsTotal) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600">Medium</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{displayedRisk.medium}</span>
                    <span className="text-slate-400 w-8 text-right">
                      {Math.round((displayedRisk.medium / statsTotal) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Low</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{displayedRisk.low}</span>
                    <span className="text-slate-400 w-8 text-right">
                      {Math.round((displayedRisk.low / statsTotal) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('history')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">View history</span>
                    <span className="text-[10px] text-slate-400">Browse previous reports</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
