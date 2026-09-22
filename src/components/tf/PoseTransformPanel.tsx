'use client';

import { useState } from 'react';
import * as THREE from 'three';
import NumberField from '@/components/common/NumberField';
import type { FrameDef } from '@/lib/tf/types';
import { WORLD_ID, WORLD_NAME } from '@/lib/tf/types';
import { lookupTransform, transformPose, type WorldFrame } from '@/lib/tf/compute';
import {
  type Quaternion,
  type Euler,
  quaternionToEuler,
  eulerToQuaternion,
  quaternionMagnitude,
  normalizeQuaternion,
  degToRad,
  radToDeg,
} from '@/lib/quaternion/convert';

interface Props {
  frames: FrameDef[];
  world: Map<string, WorldFrame>;
  sourceId: string;
  targetId: string;
}

const IDENTITY: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

export default function PoseTransformPanel({ frames, world, sourceId, targetId }: Props) {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [quaternion, setQuaternion] = useState<Quaternion>(IDENTITY);
  const [orientationMode, setOrientationMode] = useState<'quaternion' | 'euler'>('euler');

  const euler = quaternionToEuler(quaternion);
  const magnitude = quaternionMagnitude(quaternion);
  const isNormalized = Math.abs(magnitude - 1) < 1e-4;

  const setEulerField = (field: keyof Euler, deg: number) => {
    const nextEuler: Euler = { ...euler, [field]: degToRad(deg) };
    setQuaternion(eulerToQuaternion(nextEuler));
  };

  const result = lookupTransform(world, sourceId, targetId);
  const transformed = result
    ? transformPose(result, {
        position: new THREE.Vector3(position.x, position.y, position.z),
        quaternion: new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
      })
    : null;
  const transformedQuat = transformed ? { x: transformed.quaternion.x, y: transformed.quaternion.y, z: transformed.quaternion.z, w: transformed.quaternion.w } : null;
  const transformedEuler = transformedQuat ? quaternionToEuler(transformedQuat) : null;

  const sourceName = sourceId === WORLD_ID ? WORLD_NAME : (frames.find((f) => f.id === sourceId)?.name ?? sourceId);
  const targetName = targetId === WORLD_ID ? WORLD_NAME : (frames.find((f) => f.id === targetId)?.name ?? targetId);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Transform a pose</h2>
      <p className="mb-3 text-xs text-neutral-500">
        A position + orientation expressed in <span className="font-mono">{sourceName}</span>, converted into{' '}
        <span className="font-mono">{targetName}</span>. Pick the source/target frames in the panel next to the 3D view.
      </p>

      <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Position (m)</p>
      <div className="grid grid-cols-3 gap-3">
        <NumberField label={`x in ${sourceName}`} value={position.x} onChange={(v) => setPosition((p) => ({ ...p, x: v }))} />
        <NumberField label={`y in ${sourceName}`} value={position.y} onChange={(v) => setPosition((p) => ({ ...p, y: v }))} />
        <NumberField label={`z in ${sourceName}`} value={position.z} onChange={(v) => setPosition((p) => ({ ...p, z: v }))} />
      </div>

      <div className="mt-4 mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Orientation in {sourceName}</p>
        <div className="flex overflow-hidden rounded-md border border-neutral-300 text-xs dark:border-neutral-700">
          {(['euler', 'quaternion'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setOrientationMode(mode)}
              className={`px-2.5 py-1 font-medium ${
                orientationMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
              }`}
            >
              {mode === 'euler' ? 'Euler (RPY)' : 'Quaternion'}
            </button>
          ))}
        </div>
      </div>

      {orientationMode === 'euler' ? (
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="roll (deg)" value={radToDeg(euler.roll)} onChange={(v) => setEulerField('roll', v)} decimals={2} />
          <NumberField label="pitch (deg)" value={radToDeg(euler.pitch)} onChange={(v) => setEulerField('pitch', v)} decimals={2} />
          <NumberField label="yaw (deg)" value={radToDeg(euler.yaw)} onChange={(v) => setEulerField('yaw', v)} decimals={2} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <NumberField label="x" value={quaternion.x} onChange={(v) => setQuaternion({ ...quaternion, x: v })} decimals={5} />
            <NumberField label="y" value={quaternion.y} onChange={(v) => setQuaternion({ ...quaternion, y: v })} decimals={5} />
            <NumberField label="z" value={quaternion.z} onChange={(v) => setQuaternion({ ...quaternion, z: v })} decimals={5} />
            <NumberField label="w" value={quaternion.w} onChange={(v) => setQuaternion({ ...quaternion, w: v })} decimals={5} />
          </div>
          {!isNormalized && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs text-amber-600 dark:text-amber-400">|q| = {magnitude.toFixed(4)} (not unit length)</span>
              <button
                type="button"
                onClick={() => setQuaternion(normalizeQuaternion(quaternion))}
                className="rounded-md bg-amber-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                Normalize
              </button>
            </div>
          )}
        </>
      )}

      {transformed && transformedQuat && transformedEuler ? (
        <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Result in {targetName}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Position (m)</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">x: {transformed.position.x.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">y: {transformed.position.y.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">z: {transformed.position.z.toFixed(4)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Quaternion (x, y, z, w)</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">x: {transformedQuat.x.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">y: {transformedQuat.y.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">z: {transformedQuat.z.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">w: {transformedQuat.w.toFixed(4)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Roll / Pitch / Yaw (deg)</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">roll: {radToDeg(transformedEuler.roll).toFixed(2)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">pitch: {radToDeg(transformedEuler.pitch).toFixed(2)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">yaw: {radToDeg(transformedEuler.yaw).toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">Pick two valid frames above to transform this pose.</p>
      )}
    </div>
  );
}
