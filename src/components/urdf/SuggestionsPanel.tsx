'use client';

import { useMemo, useState } from 'react';
import type { LintIssue } from '@/lib/urdf/types';
import { severityWeight } from '@/lib/urdf/lint';

const SEVERITY_STYLES: Record<LintIssue['severity'], string> = {
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
};

const SEVERITY_LABEL: Record<LintIssue['severity'], string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

interface Props {
  issues: LintIssue[];
  missingMeshes: string[];
}

export default function SuggestionsPanel({ issues, missingMeshes }: Props) {
  const [filter, setFilter] = useState<'all' | LintIssue['severity']>('all');

  const sorted = useMemo(() => [...issues].sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity)), [issues]);
  const filtered = filter === 'all' ? sorted : sorted.filter((i) => i.severity === filter);

  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0 };
    issues.forEach((i) => c[i.severity]++);
    return c;
  }, [issues]);

  if (issues.length === 0 && missingMeshes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Load a URDF to see suggestions here (e.g. missing inertia, which will break MoveIt Setup Assistant).
      </p>
    );
  }

  if (issues.length === 0 && missingMeshes.length > 0) {
    return <MissingMeshes missingMeshes={missingMeshes} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'error', 'warning', 'info'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              filter === key
                ? 'border-neutral-800 bg-neutral-800 text-white dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            {key === 'all' ? `All (${issues.length})` : `${SEVERITY_LABEL[key]} (${counts[key]})`}
          </button>
        ))}
      </div>

      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {filtered.map((issue, i) => (
          <div key={`${issue.id}-${issue.target}-${i}`} className={`rounded-md border px-3 py-2 text-sm ${SEVERITY_STYLES[issue.severity]}`}>
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{SEVERITY_LABEL[issue.severity]}</span>
              <span className="font-mono text-xs opacity-70">{issue.target}</span>
            </div>
            <p>{issue.message}</p>
          </div>
        ))}
      </div>

      {missingMeshes.length > 0 && <MissingMeshes missingMeshes={missingMeshes} />}
    </div>
  );
}

function MissingMeshes({ missingMeshes }: { missingMeshes: string[] }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
      <p className="mb-1 font-medium">
        {missingMeshes.length} mesh file{missingMeshes.length === 1 ? '' : 's'} {missingMeshes.length === 1 ? 'was' : 'were'} not part of this upload, so{' '}
        {missingMeshes.length === 1 ? 'it has' : "they've"} been replaced with pink placeholder shapes (a rod toward each child joint, or a small ball for an end link):
      </p>
      <ul className="list-inside list-disc font-mono text-xs">
        {missingMeshes.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <p className="mt-1 text-xs">
        These files exist on your machine, just not in what was uploaded. Use &quot;Choose folder&quot; (or a .zip) and select the directory that
        contains both the URDF and its meshes together &mdash; e.g. a <code className="font-mono">xxx_description</code> package folder &mdash; so they
        resolve by filename no matter how deep they&apos;re nested inside it.
      </p>
    </div>
  );
}
