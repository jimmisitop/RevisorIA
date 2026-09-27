import type { ChecklistItem, FindingItem } from '../client/src/types/index';

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};

/** Adapt saved Bob reports and structured provider results to the UI contract. */
export function normalizeReviewAnalysis(input: { findings?: unknown; checklist?: unknown }) {
  const findingIds = new Set<string>();
  const checklistIds = new Set<string>();
  function uniqueId(value: unknown, fallback: string, used: Set<string>) {
    const base = text(value) || fallback;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  }
  const categories = new Set(['sensitive_files', 'tests_missing', 'security_concern', 'documentation', 'best_practice']);
  const findings: FindingItem[] = (Array.isArray(input.findings) ? input.findings : []).map((value, index) => {
    const item = record(value);
    const category = text(item.category);
    const source = text(item.subagent).toLowerCase();
    const subagent = ['security', 'tests', 'documentation'].includes(source)
      ? source as FindingItem['subagent'] : 'unknown';
    const severity = text(item.severity).toLowerCase();
    return {
      id: uniqueId(item.id, `finding-${index + 1}`, findingIds),
      title: text(item.title) || (categories.has(category) ? '' : category) || `Finding ${index + 1}`,
      description: text(item.description) || text(item.message) || text(value) || 'No detailed evidence was provided.',
      category: (categories.has(category) ? category : subagent === 'security' ? 'security_concern' : subagent === 'tests' ? 'tests_missing' : subagent === 'documentation' ? 'documentation' : 'best_practice') as FindingItem['category'],
      severity: (['high', 'medium', 'low'].includes(severity) ? severity : 'unspecified') as FindingItem['severity'],
      subagent,
      files: Array.isArray(item.files) ? item.files.map(text).filter(Boolean) : [],
      remediation: text(item.remediation) || undefined,
    };
  });
  const checklist: ChecklistItem[] = (Array.isArray(input.checklist) ? input.checklist : []).map((value, index) => {
    const item = record(value);
    const status = text(item.status).toLowerCase();
    return {
      id: uniqueId(item.id, `checklist-${index + 1}`, checklistIds),
      label: text(value) || text(item.label) || text(item.title) || text(item.message) || `Review action ${index + 1}`,
      description: text(item.description) || undefined,
      status: (['passed', 'warning', 'failed'].includes(status) ? status : 'warning') as ChecklistItem['status'],
      completed: item.completed === true,
      required: item.required === true,
    };
  });
  return { findings, checklist };
}
