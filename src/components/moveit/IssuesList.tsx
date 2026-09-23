'use client';

import type { MoveitIssue } from '@/lib/moveit/types';

const SEVERITY_STYLES: Record<MoveitIssue['severity'], string> = {
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
};

const SEVERITY_LABEL: Record<MoveitIssue['severity'], string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const SOURCE_LABEL: Record<MoveitIssue['source'], string> = {
  urdf: 'URDF',
  srdf: 'SRDF',
  joint_limits: 'joint_limits.yaml',
  cross: 'cross-check',
};

export function severityWeight(s: MoveitIssue['severity']): number {
  return s === 'error' ? 0 : s === 'warning' ? 1 : 2;
}

export default function IssuesList({ issues, emptyText }: { issues: MoveitIssue[]; emptyText: string }) {
  if (issues.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyText}</p>;
  }

  const sorted = [...issues].sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity));

  return (
    <div className="space-y-2">
      {sorted.map((issue, i) => (
        <div key={`${issue.id}-${i}`} className={`rounded-md border px-3 py-2 text-sm ${SEVERITY_STYLES[issue.severity]}`}>
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{SEVERITY_LABEL[issue.severity]}</span>
            <span className="text-[10px] uppercase tracking-wide opacity-50">{SOURCE_LABEL[issue.source]}</span>
          </div>
          <p>{issue.message}</p>
        </div>
      ))}
    </div>
  );
}
