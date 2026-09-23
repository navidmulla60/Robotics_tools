import type { LintIssue } from '@/lib/urdf/types';
import type { MoveitIssue } from './types';

export function adaptLintIssues(issues: LintIssue[]): MoveitIssue[] {
  return issues.map((i) => ({ id: i.id, severity: i.severity, source: 'urdf', message: `[${i.target}] ${i.message}` }));
}
