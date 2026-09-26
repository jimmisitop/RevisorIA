import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

dotenv.config();

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const bobCommand = process.platform === 'win32' ? 'bob.cmd' : 'bob';
const bobProcessOptions = { shell: process.platform === 'win32' };

app.use(express.json({ limit: '10mb' }));

interface ChangedFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  isSensitive: boolean;
  diffSnippet: string;
}

interface PullRequest {
  id: number;
  prNumber: number;
  title: string;
  repo: string;
  baseBranch: string;
  headBranch: string;
  author: { name: string; avatar: string; email: string; role: string };
  createdAt: string;
  reviewedAt: string;
  status: 'Reviewed' | 'Pending' | 'Changes Requested' | 'Approved';
  riskLevel: 'High' | 'Medium' | 'Low';
  riskScore: number;
  riskSummary: string;
  filesCount: number;
  additions: number;
  deletions: number;
  testsStatus: 'Missing' | 'Incomplete' | 'Passing';
  files: ChangedFile[];
  findings: Array<Record<string, unknown>>;
  checklist: Array<Record<string, unknown>>;
  subagentTraces: Array<Record<string, unknown>>;
  engineUsed?: 'ibm_bob_shell';
  htmlUrl?: string;
  jevDecisionMatrix?: Record<string, unknown>;
}

const pullRequests: PullRequest[] = [];
let runtimeGithubToken = process.env.GITHUB_TOKEN?.trim() || '';

function githubHeaders(): Record<string, string> {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'RevisorIA-Server',
  };
  if (runtimeGithubToken) headers.Authorization = `Bearer ${runtimeGithubToken}`;
  return headers;
}

function repositoryParts(value: string): { owner: string; repo: string } | null {
  const normalized = value.trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git\/?$/, '')
    .replace(/\/$/, '');
  const [owner, repo, ...extra] = normalized.split('/');
  return owner && repo && extra.length === 0 ? { owner, repo } : null;
}

function changedFilesFromGithub(files: any[]): ChangedFile[] {
  return (Array.isArray(files) ? files : []).map((file) => ({
    filename: file.filename,
    status: file.status === 'added' ? 'added' : file.status === 'removed' ? 'deleted' : 'modified',
    additions: Number(file.additions || 0),
    deletions: Number(file.deletions || 0),
    isSensitive: /auth|security|secret|config|password|key|token|env|guard|middleware/i.test(file.filename),
    diffSnippet: file.patch || `// ${file.status} file: ${file.filename}`,
  }));
}

function pullRequestFromGithub(pr: any, owner: string, repo: string, files: ChangedFile[], analysis: any): PullRequest {
  return {
    id: pr.number,
    prNumber: pr.number,
    title: pr.title,
    repo: `${owner}/${repo}`,
    baseBranch: pr.base?.ref || 'unknown',
    headBranch: pr.head?.ref || 'unknown',
    author: {
      name: pr.user?.login || 'unknown',
      avatar: pr.user?.avatar_url || '',
      email: '',
      role: pr.author_association || 'Contributor',
    },
    createdAt: pr.created_at,
    reviewedAt: new Date().toISOString(),
    status: pr.state === 'closed' ? 'Approved' : 'Reviewed',
    riskLevel: analysis.riskLevel,
    riskScore: analysis.riskScore,
    riskSummary: analysis.riskSummary,
    filesCount: pr.changed_files || files.length,
    additions: pr.additions || files.reduce((sum, file) => sum + file.additions, 0),
    deletions: pr.deletions || files.reduce((sum, file) => sum + file.deletions, 0),
    testsStatus: analysis.testsStatus,
    files,
    findings: analysis.findings,
    checklist: analysis.checklist,
    subagentTraces: analysis.subagentTraces,
    engineUsed: 'ibm_bob_shell',
    htmlUrl: pr.html_url,
    jevDecisionMatrix: analysis.jevDecisionMatrix,
  };
}

async function fetchGithubPR(owner: string, repo: string, number: number) {
  const baseUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}`;
  const [prResponse, filesResponse] = await Promise.all([
    fetch(baseUrl, { headers: githubHeaders() }),
    fetch(`${baseUrl}/files?per_page=100`, { headers: githubHeaders() }),
  ]);
  if (!prResponse.ok) {
    const error = await prResponse.json().catch(() => ({}));
    throw new Error(error.message || `GitHub returned ${prResponse.status}`);
  }
  const pr = await prResponse.json();
  const files = filesResponse.ok ? await filesResponse.json() : [];
  return { pr, files: changedFilesFromGithub(files) };
}

async function analyzeWithBob(input: { title: string; repo: string; diff: string; number: number }) {
  const apiKey = process.env.BOB_API_KEY?.trim();
  if (!apiKey) throw new Error('BOB_API_KEY is not configured in the server .env file.');

  const prompt = `Review this GitHub pull request as IBM Bob. Return JSON only with riskLevel, riskScore, riskSummary, testsStatus, findings, securityLogs, testLogs, docLogs.\nTitle: ${input.title}\nRepository: ${input.repo}\nDiff:\n${input.diff.slice(0, 12000)}`;
  const { stdout } = await execFileAsync(bobCommand, ['run', '--format', 'json', '--accept-license', '--trust', prompt], {
    env: { ...process.env, BOB_API_KEY: apiKey },
    timeout: 120000,
    maxBuffer: 5 * 1024 * 1024,
    ...bobProcessOptions,
  });
  const match = stdout.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Bob returned no JSON analysis.');
  const result = JSON.parse(match[0]);
  const riskLevel = ['High', 'Medium', 'Low'].includes(result.riskLevel) ? result.riskLevel : 'Medium';
  const riskScore = Math.min(9.9, Math.max(1, Number(result.riskScore) || 5));
  const testsStatus = ['Missing', 'Incomplete', 'Passing'].includes(result.testsStatus) ? result.testsStatus : 'Incomplete';
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const traces = [
    ['Security Subagent', 'security', result.securityLogs],
    ['Test Subagent', 'tests', result.testLogs],
    ['Documentation Subagent', 'documentation', result.docLogs],
  ].map(([name, subagent, logs]) => ({ name, icon: subagent === 'security' ? 'Shield' : subagent === 'tests' ? 'FlaskConical' : 'FileText', status: 'completed', durationMs: 0, findingsCount: findings.filter((item: any) => item.subagent === subagent).length, logSummary: Array.isArray(logs) ? logs : [] }));
  return {
    riskLevel,
    riskScore,
    riskSummary: result.riskSummary || 'Bob completed the pull request review.',
    testsStatus,
    findings,
    subagentTraces: traces,
    checklist: [],
    jevDecisionMatrix: { finalDecision: `${riskLevel} Risk (Score: ${riskScore}/10).` },
  };
}

app.get('/api/bob/status', async (_req, res) => {
  try {
    const { stdout } = await execFileAsync(bobCommand, ['--version'], bobProcessOptions);
    res.json({ installed: true, version: stdout.trim(), hasKey: Boolean(process.env.BOB_API_KEY) });
  } catch {
    res.json({ installed: false, version: '', hasKey: Boolean(process.env.BOB_API_KEY) });
  }
});

app.get('/api/github/repos/:owner/:repo/pulls', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const state = String(req.query.state || 'open');
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${encodeURIComponent(state)}&per_page=25`, { headers: githubHeaders() });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'GitHub request failed.' });
    res.json({ pulls: data.map((pr: any) => ({ id: pr.id, number: pr.number, title: pr.title, state: pr.state, htmlUrl: pr.html_url, createdAt: pr.created_at, updatedAt: pr.updated_at, user: { login: pr.user?.login || '', avatarUrl: pr.user?.avatar_url || '' }, headBranch: pr.head?.ref || '', baseBranch: pr.base?.ref || '', draft: Boolean(pr.draft), body: pr.body })) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to fetch pull requests.' });
  }
});

app.post('/api/github/import-and-analyze', async (req, res) => {
  try {
    const owner = String(req.body.owner || '').trim();
    const repo = String(req.body.repo || '').trim();
    const pullNumber = Number(req.body.pullNumber);
    if (!owner || !repo || !Number.isInteger(pullNumber)) return res.status(400).json({ error: 'owner, repo, and pullNumber are required.' });
    const { pr, files } = await fetchGithubPR(owner, repo, pullNumber);
    const diff = files.map((file) => `// ${file.filename}\n${file.diffSnippet}`).join('\n\n');
    const analysis = await analyzeWithBob({ title: pr.title, repo: `${owner}/${repo}`, diff, number: pullNumber });
    const reviewedPR = pullRequestFromGithub(pr, owner, repo, files, analysis);
    const existingIndex = pullRequests.findIndex((item) => item.repo === reviewedPR.repo && item.prNumber === reviewedPR.prNumber);
    if (existingIndex >= 0) pullRequests.splice(existingIndex, 1);
    pullRequests.unshift(reviewedPR);
    res.json({ success: true, pullRequest: reviewedPR });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Unable to analyze pull request.' });
  }
});

app.get('/api/prs', (_req, res) => res.json({ pullRequests }));
app.get('/api/stats', (_req, res) => {
  const total = pullRequests.length;
  res.json({ totalPRs: total, reviewedCount: pullRequests.filter((pr) => pr.status === 'Reviewed' || pr.status === 'Approved').length, pendingCount: pullRequests.filter((pr) => pr.status === 'Pending').length, avgReviewTime: 'N/A', reviewTimeSavings: 'N/A', riskDistribution: { high: pullRequests.filter((pr) => pr.riskLevel === 'High').length, medium: pullRequests.filter((pr) => pr.riskLevel === 'Medium').length, low: pullRequests.filter((pr) => pr.riskLevel === 'Low').length } });
});

app.get('/api/prs/:id', (req, res) => {
  const pr = pullRequests.find((item) => item.id === Number(req.params.id) || item.prNumber === Number(req.params.id));
  if (!pr) return res.status(404).json({ error: 'Pull request not found.' });
  res.json({ pullRequest: pr });
});

app.patch('/api/prs/:id/checklist/:itemId', (_req, res) => res.status(501).json({ error: 'Checklist persistence is not configured.' }));
app.post('/api/prs/:id/comment', (_req, res) => res.status(501).json({ error: 'GitHub review comments are not configured.' }));

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(port, '0.0.0.0', () => console.log(`RevisorIA server listening on http://localhost:${port}`));
