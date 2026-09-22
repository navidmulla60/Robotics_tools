'use client';

import { useState } from 'react';
import * as THREE from 'three';
import type { FrameDef } from '@/lib/tf/types';
import { WORLD_ID, WORLD_NAME } from '@/lib/tf/types';
import { lookupTransform, transformPoint, type WorldFrame } from '@/lib/tf/compute';

interface Props {
  frames: FrameDef[];
  world: Map<string, WorldFrame>;
  sourceId: string;
  targetId: string;
}

function PointField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="number"
        step={0.01}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isNaN(v) ? 0 : v);
        }}
        className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </label>
  );
}

export default function PointTransformPanel({ frames, world, sourceId, targetId }: Props) {
  const [point, setPoint] = useState({ x: 0, y: 0, z: 0 });

  const result = lookupTransform(world, sourceId, targetId);
  const transformedPoint = result ? transformPoint(result, new THREE.Vector3(point.x, point.y, point.z)) : null;

  const sourceName = sourceId === WORLD_ID ? WORLD_NAME : (frames.find((f) => f.id === sourceId)?.name ?? sourceId);
  const targetName = targetId === WORLD_ID ? WORLD_NAME : (frames.find((f) => f.id === targetId)?.name ?? targetId);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Transform a point</h2>
      <p className="mb-3 text-xs text-neutral-500">
        A point expressed in <span className="font-mono">{sourceName}</span>, converted into <span className="font-mono">{targetName}</span>.
        Pick the source/target frames in the panel next to the 3D view.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <PointField label={`x in ${sourceName}`} value={point.x} onChange={(v) => setPoint((p) => ({ ...p, x: v }))} />
        <PointField label={`y in ${sourceName}`} value={point.y} onChange={(v) => setPoint((p) => ({ ...p, y: v }))} />
        <PointField label={`z in ${sourceName}`} value={point.z} onChange={(v) => setPoint((p) => ({ ...p, z: v }))} />
      </div>
      {transformedPoint ? (
        <div className="mt-3 rounded-md bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200">
          [{transformedPoint.x.toFixed(4)}, {transformedPoint.y.toFixed(4)}, {transformedPoint.z.toFixed(4)}] in {targetName}
        </div>
      ) : (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">Pick two valid frames above to transform this point.</p>
      )}
    </div>
  );
}
