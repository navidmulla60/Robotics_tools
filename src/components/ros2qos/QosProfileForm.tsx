'use client';

import { useId, useState } from 'react';
import type { Durability, HistoryKind, LivelinessKind, QosProfile, Reliability } from '@/lib/ros2qos/types';
import { PRESETS, matchingPresetName } from '@/lib/ros2qos/presets';

interface Props {
  title: string;
  profile: QosProfile;
  onChange: (profile: QosProfile) => void;
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DurationField({
  label,
  valueMs,
  onChange,
  defaultLabel,
}: {
  label: string;
  valueMs: number | null;
  onChange: (v: number | null) => void;
  defaultLabel: string;
}) {
  const id = useId();
  const enabled = valueMs !== null;
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          <input type="checkbox" checked={!enabled} onChange={(e) => onChange(e.target.checked ? null : 1000)} />
          {defaultLabel}
        </label>
        {enabled && (
          <input
            id={id}
            type="number"
            min={0}
            value={valueMs}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        )}
        {enabled && <span className="text-xs text-neutral-500">ms</span>}
      </div>
    </div>
  );
}

export default function QosProfileForm({ title, profile, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const presetName = matchingPresetName(profile);

  const set = <K extends keyof QosProfile>(key: K, value: QosProfile[K]) => onChange({ ...profile, [key]: value });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{title}</h2>
        <select
          value={presetName}
          onChange={(e) => {
            const preset = PRESETS[e.target.value];
            if (preset) onChange(preset);
          }}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          {presetName === 'Custom' && <option value="Custom">Custom</option>}
          {Object.keys(PRESETS).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectField<Reliability>
          label="Reliability"
          value={profile.reliability}
          onChange={(v) => set('reliability', v)}
          options={[
            { value: 'reliable', label: 'Reliable' },
            { value: 'best_effort', label: 'Best Effort' },
            { value: 'system_default', label: 'System Default' },
          ]}
        />
        <SelectField<Durability>
          label="Durability"
          value={profile.durability}
          onChange={(v) => set('durability', v)}
          options={[
            { value: 'volatile', label: 'Volatile' },
            { value: 'transient_local', label: 'Transient Local' },
            { value: 'system_default', label: 'System Default' },
          ]}
        />
        <SelectField<HistoryKind>
          label="History"
          value={profile.history}
          onChange={(v) => set('history', v)}
          options={[
            { value: 'keep_last', label: 'Keep Last' },
            { value: 'keep_all', label: 'Keep All' },
            { value: 'system_default', label: 'System Default' },
          ]}
        />
        {profile.history === 'keep_last' ? (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Depth</span>
            <input
              type="number"
              min={1}
              value={profile.depth}
              onChange={(e) => set('depth', Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
        ) : (
          <div />
        )}
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        {advancedOpen ? '−' : '+'} Advanced (deadline, liveliness, lifespan)
      </button>

      {advancedOpen && (
        <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <DurationField label="Deadline" valueMs={profile.deadlineMs} onChange={(v) => set('deadlineMs', v)} defaultLabel="No deadline (default)" />

          <SelectField<LivelinessKind>
            label="Liveliness"
            value={profile.livelinessKind}
            onChange={(v) => set('livelinessKind', v)}
            options={[
              { value: 'automatic', label: 'Automatic' },
              { value: 'manual_by_topic', label: 'Manual by Topic' },
              { value: 'system_default', label: 'System Default' },
            ]}
          />

          <DurationField
            label="Liveliness lease duration"
            valueMs={profile.livelinessLeaseMs}
            onChange={(v) => set('livelinessLeaseMs', v)}
            defaultLabel="No lease duration (default)"
          />

          <DurationField label="Lifespan (informational only)" valueMs={profile.lifespanMs} onChange={(v) => set('lifespanMs', v)} defaultLabel="No limit (default)" />
        </div>
      )}
    </div>
  );
}
