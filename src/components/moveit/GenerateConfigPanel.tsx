'use client';

import { useState } from 'react';
import { autoDetectGroups, generateMoveitPackage, type GroupSpec } from '@/lib/moveit/generatePackage';
import type { UrdfSummary } from '@/lib/moveit/types';
import type { PackageSlots } from './PackageUploader';

type GeneratedSlots = Pick<PackageSlots, 'srdf' | 'jointLimits' | 'controllers' | 'kinematics' | 'initialPositions' | 'ros2Controllers'>;

interface Props {
  urdf: UrdfSummary;
  robotNameDefault: string;
  onGenerated: (slots: GeneratedSlots) => void;
}

interface GeneratedFiles {
  srdf: string;
  jointLimits: string;
  controllers: string;
  kinematics: string;
  initialPositions: string;
  ros2Controllers: string;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

let nextId = 1;

export default function GenerateConfigPanel({ urdf, robotNameDefault, onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [robotName, setRobotName] = useState(robotNameDefault);
  const [groups, setGroups] = useState<(GroupSpec & { id: number })[]>(() => autoDetectGroups(urdf).map((g) => ({ ...g, id: nextId++ })));
  const [generated, setGenerated] = useState<GeneratedFiles | null>(null);

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      { id: nextId++, name: `group${prev.length + 1}`, baseLink: urdf.linkNames[0] ?? '', tipLink: urdf.linkNames[urdf.linkNames.length - 1] ?? '' },
    ]);
  };

  const updateGroup = (id: number, patch: Partial<GroupSpec>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const canGenerate = groups.length > 0 && groups.every((g) => g.name.trim() && g.baseLink && g.tipLink);

  const handleGenerate = () => {
    const name = robotName.trim() || 'my_robot';
    const result = generateMoveitPackage(urdf, name, groups);
    setGenerated(result);
    onGenerated({
      srdf: { name: `${name}.srdf`, text: result.srdf },
      jointLimits: { name: 'joint_limits.yaml', text: result.jointLimits },
      controllers: { name: 'moveit_controllers.yaml', text: result.controllers },
      kinematics: { name: 'kinematics.yaml', text: result.kinematics },
      initialPositions: { name: 'initial_positions.yaml', text: result.initialPositions },
      ros2Controllers: { name: 'ros2_controllers.yaml', text: result.ros2Controllers },
    });
  };

  const downloads: { label: string; filename: string; get: (g: GeneratedFiles) => string }[] = [
    { label: 'SRDF', filename: `${robotName.trim() || 'my_robot'}.srdf`, get: (g) => g.srdf },
    { label: 'joint_limits.yaml', filename: 'joint_limits.yaml', get: (g) => g.jointLimits },
    { label: 'moveit_controllers.yaml', filename: 'moveit_controllers.yaml', get: (g) => g.controllers },
    { label: 'kinematics.yaml', filename: 'kinematics.yaml', get: (g) => g.kinematics },
    { label: 'initial_positions.yaml', filename: 'initial_positions.yaml', get: (g) => g.initialPositions },
    { label: 'ros2_controllers.yaml', filename: 'ros2_controllers.yaml', get: (g) => g.ros2Controllers },
  ];

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          Don&apos;t have an SRDF / config yet? Generate everything from your URDF
        </span>
        <span className="text-blue-600 dark:text-blue-400">{open ? '−' : '+'}</span>
      </button>
      <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
        No MoveIt Setup Assistant install needed for a first pass: give it a name, and it auto-detects planning group(s)
        from your URDF&apos;s link tree and generates an SRDF, joint_limits.yaml, moveit_controllers.yaml, kinematics.yaml,
        initial_positions.yaml, and ros2_controllers.yaml. It&apos;s a starting point, not a full replacement &mdash; it
        can&apos;t compute the real self-collision matrix (no collision geometry sampling in a browser), so review
        disable_collisions before trusting it on hardware.
      </p>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-blue-900 dark:text-blue-300">Robot name</span>
              <input
                type="text"
                value={robotName}
                onChange={(e) => setRobotName(e.target.value)}
                className="w-56 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </label>
            <button
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerate}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Generate all files
            </button>
            {!canGenerate && <span className="text-xs text-red-600 dark:text-red-400">Couldn&apos;t auto-detect any planning groups from this URDF &mdash; add one manually below.</span>}
          </div>

          <button type="button" onClick={() => setCustomizeOpen((o) => !o)} className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">
            {customizeOpen ? 'Hide' : 'Customize'} planning groups ({groups.length} auto-detected)
          </button>

          {customizeOpen && (
            <div className="space-y-2">
              {groups.map((g) => (
                <div key={g.id} className="grid grid-cols-1 gap-2 rounded-md border border-blue-200 bg-white p-2.5 dark:border-blue-900/50 dark:bg-neutral-900 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-neutral-500">Group name</span>
                    <input
                      type="text"
                      value={g.name}
                      onChange={(e) => updateGroup(g.id, { name: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-neutral-500">Base link</span>
                    <select
                      value={g.baseLink}
                      onChange={(e) => updateGroup(g.id, { baseLink: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                      {urdf.linkNames.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-neutral-500">Tip link</span>
                    <select
                      value={g.tipLink}
                      onChange={(e) => updateGroup(g.id, { tipLink: e.target.value })}
                      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                      {urdf.linkNames.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setGroups((prev) => prev.filter((x) => x.id !== g.id))}
                      className="rounded-md px-2 py-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addGroup}
                className="rounded-md border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/40"
              >
                + Add group
              </button>
              <p className="text-[11px] text-blue-800 dark:text-blue-300">Change anything above, then click &quot;Generate all files&quot; again to regenerate.</p>
            </div>
          )}

          {generated && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
              <p className="mb-2 font-medium">Generated &mdash; loaded into the checks on the right. Review them, then download:</p>
              <div className="flex flex-wrap gap-2">
                {downloads.map((d) => (
                  <button
                    key={d.filename}
                    type="button"
                    onClick={() => downloadText(d.get(generated), d.filename)}
                    className="rounded-md border border-green-300 bg-white px-2.5 py-1 font-medium hover:bg-green-100 dark:border-green-800 dark:bg-neutral-900"
                  >
                    Download {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
