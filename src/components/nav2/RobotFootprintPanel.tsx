'use client';

import SliderField from '@/components/common/SliderField';
import type { FootprintType, RobotFootprint } from '@/lib/nav2/types';

interface Props {
  footprint: RobotFootprint;
  onChange: (footprint: RobotFootprint) => void;
}

function CircleIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <circle cx="24" cy="24" r="18" fill="none" stroke={active ? '#2563eb' : '#a3a3a3'} strokeWidth="3" />
      <line x1="24" y1="24" x2="24" y2="6" stroke={active ? '#2563eb' : '#a3a3a3'} strokeWidth="2" strokeDasharray="3 2" />
      <text x="27" y="16" fontSize="8" fill={active ? '#2563eb' : '#a3a3a3'}>
        r
      </text>
    </svg>
  );
}

function RectIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <rect x="6" y="12" width="36" height="24" fill="none" stroke={active ? '#2563eb' : '#a3a3a3'} strokeWidth="3" />
      <line x1="6" y1="40" x2="42" y2="40" stroke={active ? '#2563eb' : '#a3a3a3'} strokeWidth="1.5" />
      <text x="18" y="46" fontSize="7" fill={active ? '#2563eb' : '#a3a3a3'}>
        a
      </text>
      <line x1="46" y1="12" x2="46" y2="36" stroke={active ? '#2563eb' : '#a3a3a3'} strokeWidth="1.5" />
      <text x="44" y="26" fontSize="7" fill={active ? '#2563eb' : '#a3a3a3'}>
        b
      </text>
    </svg>
  );
}

export default function RobotFootprintPanel({ footprint, onChange }: Props) {
  const setType = (type: FootprintType) => onChange({ ...footprint, type });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Robot footprint</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setType('circular')}
          className={`flex flex-col items-center gap-1.5 rounded-md border p-3 ${
            footprint.type === 'circular' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <CircleIcon active={footprint.type === 'circular'} />
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Circular</span>
        </button>
        <button
          type="button"
          onClick={() => setType('rectangular')}
          className={`flex flex-col items-center gap-1.5 rounded-md border p-3 ${
            footprint.type === 'rectangular' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <RectIcon active={footprint.type === 'rectangular'} />
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Rectangular</span>
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {footprint.type === 'circular' ? (
          <SliderField label="Radius r (m)" value={footprint.radiusM} onChange={(v) => onChange({ ...footprint, radiusM: Math.max(0.01, v) })} min={0.01} max={1.5} step={0.01} decimals={3} />
        ) : (
          <>
            <SliderField label="Side a — length (m)" value={footprint.sideAM} onChange={(v) => onChange({ ...footprint, sideAM: Math.max(0.01, v) })} min={0.01} max={2} step={0.01} decimals={3} />
            <SliderField label="Side b — width (m)" value={footprint.sideBM} onChange={(v) => onChange({ ...footprint, sideBM: Math.max(0.01, v) })} min={0.01} max={2} step={0.01} decimals={3} />
          </>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        This sets Nav2&apos;s <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">robot_radius</code>{' '}
        (circular) or <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">footprint</code>{' '}
        (rectangular, centered on the robot&apos;s origin) costmap parameter, and the derived{' '}
        <span className="font-medium">inscribed radius</span> used by the inflation layer&apos;s cost formula — for a rectangle
        that&apos;s half the shorter side.
      </p>
    </div>
  );
}
