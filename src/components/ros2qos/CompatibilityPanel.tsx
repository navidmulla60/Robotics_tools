'use client';

import type { CompatibilityReport, Verdict } from '@/lib/ros2qos/types';

const VERDICT_STYLES: Record<Verdict, string> = {
  ok: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
};

const VERDICT_ICON: Record<Verdict, string> = { ok: '✓', warning: '⚠', error: '✕' };

const BANNER: Record<Verdict, { style: string; label: string }> = {
  ok: {
    style: 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200',
    label: 'Compatible — this publisher and subscription will connect.',
  },
  warning: {
    style: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    label: "Possibly compatible — depends on your RMW implementation's defaults (see below).",
  },
  error: {
    style: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200',
    label: 'Incompatible — this publisher and subscription will not connect.',
  },
};

export default function CompatibilityPanel({ report }: { report: CompatibilityReport }) {
  const banner = BANNER[report.overall];
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Compatibility</h2>

      <div className={`mb-3 rounded-md border px-3 py-2 text-sm font-medium ${banner.style}`}>{banner.label}</div>

      <div className="space-y-2">
        {report.findings.map((f) => (
          <div key={f.policy} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${VERDICT_STYLES[f.verdict]}`}>
            <span className="mt-0.5 shrink-0 font-bold">{VERDICT_ICON[f.verdict]}</span>
            <div>
              <span className="font-medium">{f.policy}</span>
              <p className="opacity-90">{f.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
