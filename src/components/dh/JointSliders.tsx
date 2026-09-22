'use client';

import type { DHRow } from '@/lib/dh/types';

interface Props {
  rows: DHRow[];
  onChange: (rows: DHRow[]) => void;
}

const REVOLUTE_RANGE = { min: -180, max: 180, step: 1 };
const PRISMATIC_RANGE = { min: -1, max: 1, step: 0.01 };

export default function JointSliders({ rows, onChange }: Props) {
  const setValue = (id: string, value: number) => {
    onChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        return r.jointType === 'revolute' ? { ...r, thetaDeg: value } : { ...r, d: value };
      }),
    );
  };

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Joint values</h2>
      <div className="space-y-3">
        {rows.map((row) => {
          const isRevolute = row.jointType === 'revolute';
          const range = isRevolute ? REVOLUTE_RANGE : PRISMATIC_RANGE;
          const value = isRevolute ? row.thetaDeg : row.d;
          const unit = isRevolute ? '°' : 'm';
          return (
            <div key={row.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {row.name} <span className="text-neutral-400">({isRevolute ? 'θ' : 'd'})</span>
                </span>
                <span className="font-mono text-neutral-500">
                  {value.toFixed(isRevolute ? 1 : 3)} {unit}
                </span>
              </div>
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(e) => setValue(row.id, parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
