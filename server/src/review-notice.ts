export type NoticeType = 'approve' | 'request_changes';
type Report = {
  repo: string;
  prNumber: number;
  riskSummary: string;
  engineUsed?: string;
  findings: Array<{ title: string; description: string }>;
  checklist: Array<{ label: string }>;
};

export class NoticeError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

// These controls intentionally post discussion comments only. A formal APPROVE
// review can satisfy an auto-merge requirement, contrary to this app's promise.
export async function publishReviewNotice(
  report: Report, kind: NoticeType, token: string, request: typeof fetch = fetch,
) {
  if (kind !== 'approve' && kind !== 'request_changes') throw new NoticeError(400, 'Unknown review action.');
  if (!token.trim()) throw new NoticeError(503, 'Configure GITHUB_TOKEN on the server with permission to comment on this repository. No notice was posted.');
  const parts = report.repo.split('/');
  if (parts.length !== 2 || parts.some(part => !part || part === '.' || part === '..') || !Number.isInteger(report.prNumber) || report.prNumber < 1) {
    throw new NoticeError(400, 'Invalid repository or pull request number.');
  }
  const base = `https://api.github.com/repos/${parts.map(encodeURIComponent).join('/')}`;
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'RevisorIA-Server' };
  const current = await request(`${base}/pulls/${report.prNumber}`, { headers });
  if (!current.ok) throw new NoticeError(current.status, 'Could not verify the pull request. Check the server GitHub token and repository access.');
  const pr = await current.json() as { state: string; merged: boolean };
  if (pr.state !== 'open' || pr.merged) throw new NoticeError(409, 'This PR is already closed or merged. No notice was posted and its state was not changed.');

  const heading = kind === 'approve' ? 'Approval suggested — human review still required' : 'Changes requested — human review still required';
  const cacheNotice = report.engineUsed === 'cached_manual_review'
    ? 'This report reuses a saved analysis keyed by repository and PR number. It may not reflect newer commits; corrected findings may still appear on reanalysis.'
    : 'This notice shares the existing report; publishing it does not run a new analysis.';
  // Quotes preserve evidence as report content instead of active Markdown tasks.
  const quote = (value: string) => value.replace(/\r\n/g, '\n').split('\n').map(line => `> ${line}`).join('\n');
  const body = [
    `## RevisorIA: ${heading}`,
    'Informational comment only. This is not a formal GitHub approval or change-request review. RevisorIA does not merge, close, or delete the PR or its branch. The PR remains available for another analysis.',
    cacheNotice,
    '### Risk summary', quote(report.riskSummary),
    '### Findings', ...report.findings.map((f, index) => quote(`${index + 1}. ${f.title}\n${f.description}`)),
    '### Suggested actions', ...report.checklist.map((item, index) => quote(`${index + 1}. ${item.label}`)),
  ].join('\n\n');
  if (body.length > 60000) throw new NoticeError(422, 'The report is too long for one GitHub comment. No notice was posted.');
  const response = await request(`${base}/issues/${report.prNumber}/comments`, {
    method: 'POST', headers, body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    const reason = response.status === 401 ? 'The GitHub token is invalid or expired.'
      : response.status === 403 || response.status === 404 ? 'The token cannot comment on this repository, or GitHub is limiting requests.'
      : `GitHub rejected the notice (HTTP ${response.status}).`;
    throw new NoticeError(response.status, reason);
  }
  const comment = await response.json() as { html_url?: string };
  return {
    success: true, commentUrl: comment.html_url,
    message: `${kind === 'approve' ? 'Approval suggestion' : 'Change request'} posted as a GitHub comment, not a formal review. This action did not merge, close, or delete the PR. You can analyze it again; the saved analysis is unchanged.`,
  };
}
