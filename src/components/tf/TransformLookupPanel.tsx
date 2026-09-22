'use client';

import { useState } from 'react';
import * as THREE from 'three';
import type { FrameDef } from '@/lib/tf/types';
import { WORLD_ID, WORLD_NAME } from '@/lib/tf/types';
import { lookupTransform, transformPoint, type WorldFrame } from '@/lib/tf/compute';
import { quaternionToEuler, radToDeg } from '@/lib/quaternion/convert';

interface Props {
  frames: FrameDef[];
  world: Map<string, WorldFrame>;
  sourceId: string;
  targetId: string;
  onSourceChange: (id: string) => void;
  onTargetChange: (id: string) => void;
}

function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText());
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // clipboard API unavailable — silently ignore
        }
      }}
      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

function FrameSelect({
  value,
  onChange,
  frames,
}: {
  value: string;
  onChange: (id: string) => void;
  frames: FrameDef[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    >
      <option value={WORLD_ID}>{WORLD_NAME}</option>
      {frames.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
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

export default function TransformLookupPanel({ frames, world, sourceId, targetId, onSourceChange, onTargetChange }: Props) {
  const [point, setPoint] = useState({ x: 0, y: 0, z: 0 });

  const result = lookupTransform(world, sourceId, targetId);
  const q = result ? { x: result.quaternion.x, y: result.quaternion.y, z: result.quaternion.z, w: result.quaternion.w } : null;
  const euler = q ? quaternionToEuler(q) : null;
  const transformedPoint = result ? transformPoint(result, new THREE.Vector3(point.x, point.y, point.z)) : null;

  const sourceName = sourceId === WORLD_ID ? WORLD_NAME : (frames.find((f) => f.id === sourceId)?.name ?? sourceId);
  const targetName = targetId === WORLD_ID ? WORLD_NAME : (frames.find((f) => f.id === targetId)?.name ?? targetId);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Look up transform</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Source frame</span>
            <FrameSelect value={sourceId} onChange={onSourceChange} frames={frames} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Target frame</span>
            <FrameSelect value={targetId} onChange={onTargetChange} frames={frames} />
          </label>
        </div>

        {result && q && euler ? (
          <>
            <p className="mt-3 text-xs text-neutral-500">
              Transform of <span className="font-mono">{sourceName}</span> expressed in <span className="font-mono">{targetName}</span>{' '}
              — matches <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">tf2</code>&apos;s{' '}
              <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">
                lookupTransform(&quot;{targetName}&quot;, &quot;{sourceName}&quot;)
              </code>
              .
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Translation (m)</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">x: {result.position.x.toFixed(4)}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">y: {result.position.y.toFixed(4)}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">z: {result.position.z.toFixed(4)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Quaternion (x, y, z, w)</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">x: {q.x.toFixed(4)}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">y: {q.y.toFixed(4)}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">z: {q.z.toFixed(4)}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">w: {q.w.toFixed(4)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Roll / Pitch / Yaw (deg)</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">roll: {radToDeg(euler.roll).toFixed(2)}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">pitch: {radToDeg(euler.pitch).toFixed(2)}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">yaw: {radToDeg(euler.yaw).toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3">
              <CopyButton
                label="Copy as static_transform_publisher args"
                getText={() =>
                  `--x ${result.position.x.toFixed(6)} --y ${result.position.y.toFixed(6)} --z ${result.position.z.toFixed(6)} --qx ${q.x.toFixed(6)} --qy ${q.y.toFixed(6)} --qz ${q.z.toFixed(6)} --qw ${q.w.toFixed(6)} --frame-id ${targetName} --child-frame-id ${sourceName}`
                }
              />
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">Pick two valid frames to see their transform.</p>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Transform a point</h2>
        <p className="mb-3 text-xs text-neutral-500">
          A point expressed in <span className="font-mono">{sourceName}</span>, converted into{' '}
          <span className="font-mono">{targetName}</span>.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <PointField label={`x in ${sourceName}`} value={point.x} onChange={(v) => setPoint((p) => ({ ...p, x: v }))} />
          <PointField label={`y in ${sourceName}`} value={point.y} onChange={(v) => setPoint((p) => ({ ...p, y: v }))} />
          <PointField label={`z in ${sourceName}`} value={point.z} onChange={(v) => setPoint((p) => ({ ...p, z: v }))} />
        </div>
        {transformedPoint && (
          <div className="mt-3 rounded-md bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200">
            [{transformedPoint.x.toFixed(4)}, {transformedPoint.y.toFixed(4)}, {transformedPoint.z.toFixed(4)}] in {targetName}
          </div>
        )}
      </div>
    </div>
  );
}
