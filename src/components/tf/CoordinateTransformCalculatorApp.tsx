'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import FrameTable from './FrameTable';
import TransformLookupPanel from './TransformLookupPanel';
import { computeWorldFrames } from '@/lib/tf/compute';
import { PRESETS, DEFAULT_PRESET } from '@/lib/tf/presets';
import type { FrameDef } from '@/lib/tf/types';
import { WORLD_ID } from '@/lib/tf/types';

const TfTreePreview = dynamic(() => import('./TfTreePreview'), { ssr: false });

export default function CoordinateTransformCalculatorApp() {
  const [frames, setFrames] = useState<FrameDef[]>(() => PRESETS[DEFAULT_PRESET]());
  const [presetName, setPresetName] = useState(DEFAULT_PRESET);
  const [sourceId, setSourceId] = useState(frames.length > 0 ? frames[frames.length - 1].id : WORLD_ID);
  const [targetId, setTargetId] = useState(WORLD_ID);

  // Adjust the selection during render (not in an effect) if the current source/target frame
  // was removed — see https://react.dev/learn/you-might-not-need-an-effect.
  const [trackedFrames, setTrackedFrames] = useState(frames);
  if (frames !== trackedFrames) {
    setTrackedFrames(frames);
    const ids = [WORLD_ID, ...frames.map((f) => f.id)];
    if (!ids.includes(sourceId)) setSourceId(frames.length > 0 ? frames[frames.length - 1].id : WORLD_ID);
    if (!ids.includes(targetId)) setTargetId(WORLD_ID);
  }

  const { frames: world, issues } = useMemo(() => computeWorldFrames(frames), [frames]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Preset chains</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setPresetName(name);
                  setFrames(PRESETS[name]());
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  presetName === name
                    ? 'bg-blue-600 text-white'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <FrameTable
          frames={frames}
          onChange={(next) => {
            setPresetName('Custom');
            setFrames(next);
          }}
        />

        {issues.length > 0 && (
          <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            {issues.map((issue) => (
              <p key={issue}>{issue}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-neutral-500">
          Each frame is defined relative to its parent, then composed up the tree to world space — the same model as ROS 2&apos;s tf2.
          Translation/rotation use the ROS/URDF fixed-axis X-Y-Z convention throughout.
        </p>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="h-72 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 sm:h-96">
          <TfTreePreview frames={Array.from(world.values())} sourceId={sourceId} targetId={targetId} />
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> source
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-400" /> world
          </span>
        </div>
        <TransformLookupPanel
          frames={frames}
          world={world}
          sourceId={sourceId}
          targetId={targetId}
          onSourceChange={setSourceId}
          onTargetChange={setTargetId}
        />
      </div>
    </div>
  );
}
