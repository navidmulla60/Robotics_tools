'use client';

import { useState } from 'react';

function fmt(n: number, decimals: number): string {
  const rounded = Number(n.toFixed(decimals));
  return (rounded === 0 ? 0 : rounded).toString();
}

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  decimals?: number;
}

/**
 * A controlled numeric input that only reflects the live `value` prop while unfocused. While
 * the user is actively typing, it shows their raw text instead — otherwise a value derived
 * through a lossy round trip (unit conversions, quaternion<->Euler, etc.) can overwrite what
 * they're mid-typing with floating-point noise like "29.999999999999996".
 */
export default function NumberField({ label, value, onChange, decimals = 4 }: Props) {
  const [text, setText] = useState(() => fmt(value, decimals));
  const [focused, setFocused] = useState(false);
  const displayed = focused ? text : fmt(value, decimals);

  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={displayed}
        onFocus={() => {
          setFocused(true);
          setText(fmt(value, decimals));
        }}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = parseFloat(e.target.value);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        onBlur={() => setFocused(false)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </label>
  );
}
