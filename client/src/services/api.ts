import { PullRequest, DashboardStats, GitHubRepoItem, GitHubPRItem } from '../types';
import { normalizeReviewAnalysis } from '../../../shared/review-analysis';

function normalizePR(pr: PullRequest): PullRequest {
  return { ...pr, ...normalizeReviewAnalysis(pr) };
}

function normalizeResult(data: any) {
  return {
    ...data,
    ...(data.pullRequest ? { pullRequest: normalizePR(data.pullRequest) } : {}),
    ...(data.pr ? { pr: normalizePR(data.pr) } : {}),
    ...(Array.isArray(data.pullRequests) ? { pullRequests: data.pullRequests.map(normalizePR) } : {}),
  };
}

export const api = {
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return normalizeResult(await res.json());
    } catch (e) {
      console.warn('API stats fetch failed', e);
      return {
        totalPRs: 0,
        reviewedCount: 0,
        pendingCount: 0,
        avgReviewTime: 'N/A',
        reviewTimeSavings: 'N/A',
        riskDistribution: { high: 0, medium: 0, low: 0 },
      };
    }
  },

  async getPullRequests(filters?: { risk?: string; status?: string; repo?: string; search?: string }): Promise<PullRequest[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.risk && filters.risk !== 'All') params.append('risk', filters.risk);
      if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters?.repo && filters.repo !== 'All') params.append('repo', filters.repo);
      if (filters?.search) params.append('search', filters.search);

      const url = `/api/prs${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch PRs');
      const data = await res.json();
      return data.pullRequests.map(normalizePR);
    } catch (e) {
      console.warn('API getPullRequests fetch failed', e);
      return [];
    }
  },

  async getPullRequestById(id: number): Promise<PullRequest | null> {
    try {
      const res = await fetch(`/api/prs/${id}`);
      if (!res.ok) throw new Error('Failed to fetch PR');
      const data = await res.json();
      return normalizePR(data.pullRequest);
    } catch (e) {
      console.warn('API getPullRequestById fetch failed', e);
      return null;
    }
  },

  async toggleChecklistItem(prId: number, itemId: string): Promise<PullRequest | null> {
    try {
      const res = await fetch(`/api/prs/${prId}/checklist/${itemId}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to toggle checklist');
      const data = await res.json();
      return normalizePR(data.pr);
    } catch (e) {
      console.warn('API toggleChecklistItem fetch failed', e);
      return null;
    }
  },

  async postComment(prId: number, commentType: 'approve' | 'request_changes', repo: string): Promise<{ success: boolean; message: string; pr?: PullRequest }> {
    try {
      const res = await fetch(`/api/prs/${prId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentType, repo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'GitHub could not publish the notice.');
      }
      return normalizeResult(await res.json());
    } catch (e) {
      console.warn('API postComment fetch failed', e);
      return { success: false, message: e instanceof Error ? e.message : 'Could not confirm posting. Check the PR discussion before retrying.' };
    }
  },

  async getBobStatus(): Promise<{ installed: boolean; version: string; hasKey: boolean; apiKeyMasked?: string }> {
    try {
      const res = await fetch('/api/bob/status');
      if (!res.ok) throw new Error('Failed to fetch Bob status');
      return normalizeResult(await res.json());
    } catch (e) {
      return { installed: false, version: '', hasKey: false };
    }
  },

  async configureBobKey(apiKey: string): Promise<{ success: boolean; hasKey: boolean; apiKeyMasked?: string }> {
    try {
      const res = await fetch('/api/bob/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error('Failed to configure Bob key');
      return normalizeResult(await res.json());
    } catch (e) {
      return { success: false, hasKey: false };
    }
  },

  async analyzePR(payload: {
    title: string;
    repo: string;
    baseBranch?: string;
    headBranch?: string;
    diffOrCode?: string;
    githubUrl?: string;
    userId?: string;
  }): Promise<{ success: boolean; pullRequest?: PullRequest; error?: string }> {
    try {
      const res = await fetch('/api/prs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to analyze PR');
      }
      return normalizeResult(await res.json());
    } catch (e: any) {
      console.warn('API analyzePR fetch failed', e);
      return { success: false, error: e.message || 'Analysis failed' };
    }
  },

  // GitHub REST API Integration
  async getGithubStatus(): Promise<{
    configured: boolean;
    tokenMasked?: string;
    rateLimit?: { limit: number; remaining: number; reset: number };
    user?: { login: string; name?: string; avatarUrl?: string } | null;
  }> {
    try {
      const res = await fetch('/api/github/status');
      if (!res.ok) throw new Error('Failed to fetch GitHub status');
      return normalizeResult(await res.json());
    } catch (e) {
      return { configured: false, rateLimit: { limit: 60, remaining: 50, reset: 0 } };
    }
  },

  async configureGithubToken(token: string): Promise<{ success: boolean; configured: boolean; rateLimit?: any }> {
    try {
      const res = await fetch('/api/github/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('Failed to configure GitHub token');
      return normalizeResult(await res.json());
    } catch (e) {
      return { success: false, configured: false };
    }
  },

  async fetchGithubRepos(params?: { username?: string; query?: string }): Promise<GitHubRepoItem[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.username) searchParams.append('username', params.username);
      if (params?.query) searchParams.append('query', params.query);

      const url = `/api/github/repos${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch GitHub repositories');
      const data = await res.json();
      return data.repos || [];
    } catch (e) {
      console.warn('fetchGithubRepos failed', e);
      return [];
    }
  },

  async fetchGithubPRs(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubPRItem[]> {
    try {
      const res = await fetch(`/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${state}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch PRs from repository');
      }
      const data = await res.json();
      return data.pulls || [];
    } catch (e: any) {
      console.warn('fetchGithubPRs failed', e);
      throw e;
    }
  },

  async fetchGithubPRDetail(owner: string, repo: string, pullNumber: number): Promise<{ pull: GitHubPRItem; files: any[] }> {
    const res = await fetch(`/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch PR detail');
    }
    return normalizeResult(await res.json());
  },

  async importAndAnalyzeGithubPR(payload: {
    url?: string;
    owner?: string;
    repo?: string;
    pullNumber?: number;
  }): Promise<{ success: boolean; pullRequest?: PullRequest; error?: string }> {
    try {
      const res = await fetch('/api/github/import-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to import and analyze GitHub PR');
      }
      return normalizeResult(await res.json());
    } catch (e: any) {
      return { success: false, error: e.message || 'Import failed' };
    }
  },

  async syncGithubPRs(owner: string, repo: string, limit = 4): Promise<{ success: boolean; syncedCount: number; pullRequests?: PullRequest[]; error?: string }> {
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, limit }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Sync failed');
      }
      return normalizeResult(await res.json());
    } catch (e: any) {
      return { success: false, syncedCount: 0, error: e.message || 'Sync failed' };
    }
  },
};
