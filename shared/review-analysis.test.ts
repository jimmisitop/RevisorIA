import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { normalizeReviewAnalysis } from './review-analysis';

const cachePath = new URL('../server/src/analysis-cache.json', import.meta.url);
test('all saved reports preserve every finding and checklist action', { skip: !existsSync(cachePath) }, () => {
  const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
  for (const report of Object.values(cache) as any[]) {
    const result = normalizeReviewAnalysis(report);
    assert.equal(result.findings.length, report.findings.length);
    report.findings.forEach((finding: any, index: number) => {
      assert.equal(result.findings[index].title, finding.title || finding.category);
      assert.equal(result.findings[index].description, finding.description || finding.message);
      assert.equal(result.findings[index].severity, finding.severity || 'unspecified');
    });
    report.checklist.forEach((item: any, index: number) => {
      assert.equal(result.checklist[index].label, typeof item === 'string' ? item : item.label);
    });
    assert.deepEqual(normalizeReviewAnalysis(result), result);
    assert.equal(new Set(result.checklist.map(item => item.id)).size, result.checklist.length);
  }
});

test('legacy report fields populate the UI without fabricating severity', () => {
  const result = normalizeReviewAnalysis({
    findings: [{ category: 'Missing Input Validation', message: 'POST /payments accepts an unvalidated body.', subagent: 'security' }],
    checklist: ['Validate the payment body before processing.'],
  });
  assert.equal(result.findings[0].title, 'Missing Input Validation');
  assert.equal(result.findings[0].description, 'POST /payments accepts an unvalidated body.');
  assert.equal(result.findings[0].category, 'security_concern');
  assert.equal(result.findings[0].severity, 'unspecified');
  assert.equal(result.checklist[0].label, 'Validate the payment body before processing.');
  assert.equal(result.checklist[0].completed, false);
});

test('structured evidence, explicit severity and checklist resolution survive normalization', () => {
  const result = normalizeReviewAnalysis({
    findings: [{ id: 'a', title: 'Input validation', description: 'Missing schema', category: 'security_concern', severity: 'HIGH', subagent: 'security', files: ['index.ts'], remediation: 'Validate request body' }],
    checklist: [{ id: 'b', label: 'Validate input', status: 'failed', completed: true, required: true, description: 'Use a schema' }],
  });
  assert.equal(result.findings[0].severity, 'high');
  assert.deepEqual(result.findings[0].files, ['index.ts']);
  assert.equal(result.findings[0].remediation, 'Validate request body');
  assert.equal(result.checklist[0].completed, true);
  assert.equal(result.checklist[0].required, true);
  assert.deepEqual(normalizeReviewAnalysis(result), result);
});

test('missing data and duplicate IDs never create empty rows or false resolution', () => {
  assert.deepEqual(normalizeReviewAnalysis({}), { findings: [], checklist: [] });
  const result = normalizeReviewAnalysis({ findings: [null, { id: 'same' }, { id: 'same' }], checklist: ['', { completed: 'false', required: 'false' }] });
  assert.equal(new Set(result.findings.map(item => item.id)).size, 3);
  assert.ok(result.findings.every(item => item.title && item.description && item.severity === 'unspecified'));
  assert.ok(result.checklist.every(item => item.label && !item.completed && !item.required));
});
