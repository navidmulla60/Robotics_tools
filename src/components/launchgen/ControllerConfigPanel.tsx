'use client';

import { useState } from 'react';
import type { ControllerConfig } from '@/lib/launchgen/types';

interface Props {
  config: ControllerConfig;
  onChange: (config: ControllerConfig) => void;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </label>
  );
}

export default function ControllerConfigPanel({ config, onChange }: Props) {
  const [newController, setNewController] = useState('');
  const set = <K extends keyof ControllerConfig>(key: K, value: ControllerConfig[K]) => onChange({ ...config, [key]: value });

  const addController = () => {
    const name = newController.trim();
    if (!name) return;
    set('controllerNames', [...config.controllerNames, name]);
    setNewController('');
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Controller launch file</h2>

      <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={config.standaloneControllerManager}
            onChange={(e) => set('standaloneControllerManager', e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">Launch my own controller_manager (ros2_control_node)</span>
            <span className="block text-xs text-neutral-500">
              Leave this <span className="font-medium">off</span> if you&apos;re simulating with Gazebo&apos;s{' '}
              <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">gz_ros2_control</code> /{' '}
              <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">gazebo_ros2_control</code> plugin —
              it already starts one inside the simulator, and launching a second one here will conflict with it. Turn this on for
              real hardware (or any setup where nothing else starts one for you).
            </span>
          </span>
        </label>
        {config.standaloneControllerManager && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <TextField label="Package name" value={config.packageName} onChange={(v) => set('packageName', v)} />
            <TextField label="Xacro/URDF path" value={config.xacroPath} onChange={(v) => set('xacroPath', v)} />
            <TextField label="Controller params YAML path" value={config.controllerParamsPath} onChange={(v) => set('controllerParamsPath', v)} />
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">Controllers to spawn</p>
        <p className="mb-2 text-xs text-neutral-500">
          <span className="font-mono">joint_state_broadcaster</span> is always included first. Add the controller names exactly as
          they appear in your <span className="font-mono">controllers.yaml</span> — each one gets its own spawner, chained to start
          only after the previous one finishes (spawning them all at once can race against controller_manager and fail).
        </p>
        <div className="flex flex-wrap gap-2">
          {config.controllerNames.map((name, i) => (
            <span key={`${name}-${i}`} className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs font-mono text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {name}
              <button
                type="button"
                onClick={() => set('controllerNames', config.controllerNames.filter((_, j) => j !== i))}
                className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newController}
            onChange={(e) => setNewController(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addController();
              }
            }}
            placeholder="e.g. diff_drive_controller"
            className="flex-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="button"
            onClick={addController}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
