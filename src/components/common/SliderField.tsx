'use client';

import NumberField from './NumberField';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  decimals?: number;
}

/** A range slider paired with a precise numeric field, both bound to the same value — for
 * params where dragging to see a live effect (e.g. on a canvas) is the primary interaction,
 * but exact values still matter. */
export default function SliderField({ label, value, onChange, min, max, step = 0.01, decimals = 3 }: Props) {
  const clamped = Math.min(max, Math.max(min, value));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamped}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="w-20 shrink-0">
          <NumberField label="" value={value} onChange={onChange} decimals={decimals} />
        </div>
      </div>
    </div>
  );
}
