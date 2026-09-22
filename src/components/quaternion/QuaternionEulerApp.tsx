'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import NumberField from '@/components/common/NumberField';
import {
  type Quaternion,
  type Euler,
  quaternionToEuler,
  eulerToQuaternion,
  quaternionMagnitude,
  normalizeQuaternion,
  quaternionToAxisAngle,
  quaternionToMatrix3,
  isNearGimbalLock,
  degToRad,
  radToDeg,
} from '@/lib/quaternion/convert';

const OrientationPreview = dynamic(() => import('./OrientationPreview'), { ssr: false });

type AngleUnit = 'deg' | 'rad';

const IDENTITY: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

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

export default function QuaternionEulerApp() {
  const [quaternion, setQuaternion] = useState<Quaternion>(IDENTITY);
  const [unit, setUnit] = useState<AngleUnit>('deg');

  const euler = useMemo(() => quaternionToEuler(quaternion), [quaternion]);
  const magnitude = useMemo(() => quaternionMagnitude(quaternion), [quaternion]);
  const isNormalized = Math.abs(magnitude - 1) < 1e-4;
  const axisAngle = useMemo(() => quaternionToAxisAngle(quaternion), [quaternion]);
  const matrix = useMemo(() => quaternionToMatrix3(quaternion), [quaternion]);
  const gimbalLock = isNearGimbalLock(euler);

  const toDisplayAngle = (rad: number) => (unit === 'deg' ? radToDeg(rad) : rad);
  const fromDisplayAngle = (v: number) => (unit === 'deg' ? degToRad(v) : v);

  const setEulerField = (field: keyof Euler, displayValue: number) => {
    const nextEuler: Euler = { ...euler, [field]: fromDisplayAngle(displayValue) };
    setQuaternion(eulerToQuaternion(nextEuler));
  };

  const setQuatField = (field: keyof Quaternion, value: number) => {
    setQuaternion({ ...quaternion, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Quaternion (x, y, z, w)</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isNormalized ? 'text-neutral-400' : 'text-amber-600 dark:text-amber-400'}`}>
                |q| = {magnitude.toFixed(4)}
                {!isNormalized && ' (not unit length)'}
              </span>
              {!isNormalized && (
                <button
                  type="button"
                  onClick={() => setQuaternion(normalizeQuaternion(quaternion))}
                  className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                >
                  Normalize
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumberField label="x" value={quaternion.x} onChange={(v) => setQuatField('x', v)} decimals={5} />
            <NumberField label="y" value={quaternion.y} onChange={(v) => setQuatField('y', v)} decimals={5} />
            <NumberField label="z" value={quaternion.z} onChange={(v) => setQuatField('z', v)} decimals={5} />
            <NumberField label="w" value={quaternion.w} onChange={(v) => setQuatField('w', v)} decimals={5} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton label="Copy x, y, z, w" getText={() => `${quaternion.x}, ${quaternion.y}, ${quaternion.z}, ${quaternion.w}`} />
            <CopyButton
              label="Copy as geometry_msgs/Quaternion"
              getText={() => `x: ${quaternion.x}\ny: ${quaternion.y}\nz: ${quaternion.z}\nw: ${quaternion.w}`}
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Roll / Pitch / Yaw</h2>
            <div className="flex overflow-hidden rounded-md border border-neutral-300 text-xs dark:border-neutral-700">
              {(['deg', 'rad'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 font-medium ${
                    unit === u
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  {u === 'deg' ? 'Degrees' : 'Radians'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label={`roll (x) ${unit}`} value={toDisplayAngle(euler.roll)} onChange={(v) => setEulerField('roll', v)} decimals={unit === 'deg' ? 2 : 4} />
            <NumberField label={`pitch (y) ${unit}`} value={toDisplayAngle(euler.pitch)} onChange={(v) => setEulerField('pitch', v)} decimals={unit === 'deg' ? 2 : 4} />
            <NumberField label={`yaw (z) ${unit}`} value={toDisplayAngle(euler.yaw)} onChange={(v) => setEulerField('yaw', v)} decimals={unit === 'deg' ? 2 : 4} />
          </div>
          {gimbalLock && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              Gimbal lock: pitch is at ±90°, so roll and yaw represent the same rotation split infinitely many ways.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton
              label="Copy as URDF rpy"
              getText={() => `rpy="${euler.roll} ${euler.pitch} ${euler.yaw}"`}
            />
            <CopyButton
              label={`Copy r, p, y (${unit})`}
              getText={() => `${toDisplayAngle(euler.roll)}, ${toDisplayAngle(euler.pitch)}, ${toDisplayAngle(euler.yaw)}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Axis-angle</h2>
            <p className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
              axis = [{axisAngle.axis.map((v) => v.toFixed(4)).join(', ')}]
            </p>
            <p className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
              angle = {radToDeg(axisAngle.angleRad).toFixed(3)}° ({axisAngle.angleRad.toFixed(4)} rad)
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Rotation matrix</h2>
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 font-mono text-xs text-neutral-700 dark:text-neutral-300">
              {matrix.flatMap((row, i) => row.map((v, j) => <span key={`${i}-${j}`}>{v.toFixed(3)}</span>))}
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Uses the ROS/URDF convention: quaternion order (x, y, z, w), and roll-pitch-yaw as fixed-axis (extrinsic) X-Y-Z rotations
          &mdash; i.e. R = R<sub>z</sub>(yaw) · R<sub>y</sub>(pitch) · R<sub>x</sub>(roll). Matches{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">geometry_msgs/Quaternion</code> and{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">&lt;origin rpy=&quot;r p y&quot;/&gt;</code> in URDF.
        </p>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="h-72 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 sm:h-96">
          <OrientationPreview quaternion={quaternion} />
        </div>
        <button
          type="button"
          onClick={() => setQuaternion(IDENTITY)}
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Reset to identity
        </button>
      </div>
    </div>
  );
}
