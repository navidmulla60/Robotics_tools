'use client';

import type { FrameDef } from '@/lib/tf/types';
import { WORLD_ID, WORLD_NAME } from '@/lib/tf/types';

interface Props {
  frames: FrameDef[];
  onChange: (frames: FrameDef[]) => void;
}

function Cell({ value, onChange, step = 0.01 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isNaN(v) ? 0 : v);
      }}
      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    />
  );
}

export default function FrameTable({ frames, onChange }: Props) {
  const update = (id: string, patch: Partial<FrameDef>) => {
    onChange(frames.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const remove = (id: string) => {
    // Re-parent any children of the removed frame to the world so the tree stays valid.
    onChange(frames.filter((f) => f.id !== id).map((f) => (f.parentId === id ? { ...f, parentId: null } : f)));
  };

  const addFrame = () => {
    const n = frames.length + 1;
    onChange([
      ...frames,
      {
        id: `tf-custom-${Date.now()}-${n}`,
        name: `frame_${n}`,
        parentId: frames.length > 0 ? frames[frames.length - 1].id : null,
        x: 0,
        y: 0,
        z: 0,
        rollDeg: 0,
        pitchDeg: 0,
        yawDeg: 0,
      },
    ]);
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Frames</h2>
        <button
          type="button"
          onClick={addFrame}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          + Add frame
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-x-2 border-spacing-y-1.5">
          <thead>
            <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <th className="w-32">Name</th>
              <th className="w-32">Parent</th>
              <th>x (m)</th>
              <th>y (m)</th>
              <th>z (m)</th>
              <th>roll (deg)</th>
              <th>pitch (deg)</th>
              <th>yaw (deg)</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {frames.map((frame) => (
              <tr key={frame.id}>
                <td>
                  <input
                    type="text"
                    value={frame.name}
                    onChange={(e) => update(frame.id, { name: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </td>
                <td>
                  <select
                    value={frame.parentId ?? WORLD_ID}
                    onChange={(e) => update(frame.id, { parentId: e.target.value === WORLD_ID ? null : e.target.value })}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value={WORLD_ID}>{WORLD_NAME}</option>
                    {frames
                      .filter((f) => f.id !== frame.id)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <Cell value={frame.x} onChange={(v) => update(frame.id, { x: v })} />
                </td>
                <td>
                  <Cell value={frame.y} onChange={(v) => update(frame.id, { y: v })} />
                </td>
                <td>
                  <Cell value={frame.z} onChange={(v) => update(frame.id, { z: v })} />
                </td>
                <td>
                  <Cell value={frame.rollDeg} onChange={(v) => update(frame.id, { rollDeg: v })} step={1} />
                </td>
                <td>
                  <Cell value={frame.pitchDeg} onChange={(v) => update(frame.id, { pitchDeg: v })} step={1} />
                </td>
                <td>
                  <Cell value={frame.yawDeg} onChange={(v) => update(frame.id, { yawDeg: v })} step={1} />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => remove(frame.id)}
                    title="Remove frame"
                    className="rounded-md px-1.5 py-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {frames.length === 0 && <p className="py-4 text-center text-sm text-neutral-500">No frames yet — add one above.</p>}
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Each frame&apos;s x/y/z/roll/pitch/yaw is its pose relative to its parent, ROS/URDF fixed-axis X-Y-Z convention — the same as a{' '}
        <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">static_transform_publisher</code> or a URDF{' '}
        <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">&lt;origin&gt;</code>.
      </p>
    </div>
  );
}
