import test from 'node:test';
import assert from 'node:assert/strict';
import { publishReviewNotice } from '../src/review-notice.ts';

const report = {
  repo: 'demo/repo', prNumber: 2, riskSummary: 'Missing validation', engineUsed: 'cached_manual_review',
  findings: [{ title: 'Validation', description: 'Validate input' }], checklist: [{ label: 'Add validation' }],
};

for (const kind of ['approve', 'request_changes'] as const) {
  test(`${kind} only posts a discussion comment and preserves the report`, async () => {
    const original = JSON.stringify(report);
    const calls: Array<{ url: string; options?: RequestInit }> = [];
    const request = (async (url: string, options?: RequestInit) => {
      calls.push({ url, options });
      return new Response(JSON.stringify(options?.method === 'POST' ? { html_url: 'https://github.com/demo/repo/pull/2#issuecomment-1' } : { state: 'open', merged: false, auto_merge: { enabled_by: 'someone' } }), { status: options?.method === 'POST' ? 201 : 200 });
    }) as typeof fetch;
    const result = await publishReviewNotice(report, kind, 'test-token', request);
    assert.equal(result.success, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, 'https://api.github.com/repos/demo/repo/pulls/2');
    assert.equal(calls[1].url, 'https://api.github.com/repos/demo/repo/issues/2/comments');
    assert.equal(calls[1].options?.method, 'POST');
    const payload = JSON.parse(calls[1].options?.body as string);
    assert.deepEqual(Object.keys(payload), ['body']);
    assert.match(payload.body, /not a formal GitHub approval/);
    assert.match(payload.body, /may not reflect newer commits/);
    assert.match(payload.body, /Validate input/);
    assert.equal(JSON.stringify(report), original);
  });
}

test('missing token and invalid action make no requests', async () => {
  const forbidden = (async () => { assert.fail('Unexpected network request'); }) as typeof fetch;
  await assert.rejects(publishReviewNotice(report, 'approve', '', forbidden), /GITHUB_TOKEN/);
  await assert.rejects(publishReviewNotice(report, 'merge' as any, 'token', forbidden), /Unknown review action/);
});

test('closed PR, unauthorized access and rejected comments do not report success', async () => {
  for (const scenario of ['closed', 'unauthorized', 'rejected']) {
    let calls = 0;
    const request = (async () => {
      calls++;
      if (scenario === 'unauthorized') return new Response('{}', { status: 401 });
      if (calls === 1) return new Response(JSON.stringify({ state: scenario === 'closed' ? 'closed' : 'open', merged: false }));
      return new Response('{}', { status: 403 });
    }) as typeof fetch;
    await assert.rejects(publishReviewNotice(report, 'request_changes', 'token', request));
    assert.equal(calls, scenario === 'rejected' ? 2 : 1);
  }
});
