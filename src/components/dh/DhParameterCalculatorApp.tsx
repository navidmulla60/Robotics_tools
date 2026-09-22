'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import DhTable from './DhTable';
import JointSliders from './JointSliders';
import { computeChain } from '@/lib/dh/kinematics';
import { PRESETS, DEFAULT_PRESET } from '@/lib/dh/presets';
import type { DHRow } from '@/lib/dh/types';
import { quaternionToEuler, radToDeg } from '@/lib/quaternion/convert';

const DhChainPreview = dynamic(() => import('./DhChainPreview'), { ssr: false });

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

export default function DhParameterCalculatorApp() {
  const [rows, setRows] = useState<DHRow[]>(() => PRESETS[DEFAULT_PRESET]());
  const [presetName, setPresetName] = useState(DEFAULT_PRESET);

  const frames = useMemo(() => computeChain(rows), [rows]);
  const endEffector = frames[frames.length - 1];

  const eeQuat = { x: endEffector.quaternion.x, y: endEffector.quaternion.y, z: endEffector.quaternion.z, w: endEffector.quaternion.w };
  const eeEuler = quaternionToEuler(eeQuat);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Preset chains</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setPresetName(name);
                  setRows(PRESETS[name]());
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

        <DhTable
          rows={rows}
          onChange={(next) => {
            setPresetName('Custom');
            setRows(next);
          }}
        />

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">End-effector pose</h2>
            <CopyButton
              label="Copy pose"
              getText={() =>
                `position: [${endEffector.position.x.toFixed(6)}, ${endEffector.position.y.toFixed(6)}, ${endEffector.position.z.toFixed(6)}]\nquaternion (x,y,z,w): [${eeQuat.x.toFixed(6)}, ${eeQuat.y.toFixed(6)}, ${eeQuat.z.toFixed(6)}, ${eeQuat.w.toFixed(6)}]`
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Position (m)</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">x: {endEffector.position.x.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">y: {endEffector.position.y.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">z: {endEffector.position.z.toFixed(4)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Quaternion (x, y, z, w)</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">x: {eeQuat.x.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">y: {eeQuat.y.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">z: {eeQuat.z.toFixed(4)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">w: {eeQuat.w.toFixed(4)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Roll / Pitch / Yaw (deg)</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">roll: {radToDeg(eeEuler.roll).toFixed(2)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">pitch: {radToDeg(eeEuler.pitch).toFixed(2)}</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">yaw: {radToDeg(eeEuler.yaw).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Uses the <span className="font-medium">standard</span> Denavit-Hartenberg convention (not &quot;modified&quot;/Craig
          convention) — frame i is placed at the end of link i, and rows are applied base-to-tip in order. Roll/pitch/yaw follows the
          ROS/URDF fixed-axis X-Y-Z convention.
        </p>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="h-72 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 sm:h-96">
          <DhChainPreview frames={frames} />
        </div>
        <JointSliders
          rows={rows}
          onChange={(next) => {
            setPresetName('Custom');
            setRows(next);
          }}
        />
      </div>
    </div>
  );
}
