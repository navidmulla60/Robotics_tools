'use client';

import { useCallback, useRef, useState } from 'react';
import type { CollectedFile } from '@/lib/urdf/types';
import { collectFromDataTransferItems, expandZips, fileList } from '@/lib/urdf/fileCollection';
import { classifyPackageFiles } from '@/lib/moveit/classifyPackageFiles';

export interface PackageSlots {
  urdf: { name: string; text: string } | null;
  srdf: { name: string; text: string } | null;
  jointLimits: { name: string; text: string } | null;
  controllers: { name: string; text: string } | null;
  kinematics: { name: string; text: string } | null;
  initialPositions: { name: string; text: string } | null;
  ros2Controllers: { name: string; text: string } | null;
  cartesianLimits: { name: string; text: string } | null;
}

interface Props {
  slots: PackageSlots;
  onSlotsChange: (slots: PackageSlots) => void;
  extraUrdfNames: string[];
  xacroNames: string[];
  unmatchedNames: string[];
  onExtraFiles: (info: { extraUrdfNames: string[]; xacroNames: string[]; unmatchedNames: string[] }) => void;
}

const SLOT_META: { key: keyof PackageSlots; label: string; hint: string; placeholder: string; optional?: boolean }[] = [
  {
    key: 'urdf',
    label: 'URDF',
    hint: 'A plain .urdf, if you have one handy — most Setup Assistant packages only ship a .urdf.xacro that includes the real description from a separate *_description package, so this often won\'t come from the package itself.',
    placeholder: '<?xml version="1.0"?>\n<robot name="my_robot">\n  ...\n</robot>',
    optional: true,
  },
  { key: 'srdf', label: 'SRDF', hint: 'From config/*.srdf.', placeholder: '<?xml version="1.0"?>\n<robot name="my_robot">\n  <group name="arm">...</group>\n</robot>' },
  { key: 'jointLimits', label: 'joint_limits.yaml', hint: 'From config/joint_limits.yaml.', placeholder: 'joint_limits:\n  joint1:\n    has_velocity_limits: true\n    max_velocity: 1.0' },
  {
    key: 'controllers',
    label: 'moveit_controllers.yaml',
    hint: 'From config/moveit_controllers.yaml.',
    placeholder: 'moveit_controller_manager: moveit_simple_controller_manager/MoveItSimpleControllerManager\n\nmoveit_simple_controller_manager:\n  controller_names:\n    - arm_controller\n\n  arm_controller:\n    action_ns: follow_joint_trajectory\n    type: FollowJointTrajectory\n    joints:\n      - joint1',
  },
  { key: 'kinematics', label: 'kinematics.yaml', hint: 'From config/kinematics.yaml.', placeholder: 'panda_arm:\n  kinematics_solver: kdl_kinematics_plugin/KDLKinematicsPlugin\n  kinematics_solver_search_resolution: 0.005' },
  { key: 'initialPositions', label: 'initial_positions.yaml', hint: 'From config/initial_positions.yaml.', placeholder: 'initial_positions:\n  joint1: 0.0\n  joint2: -0.785' },
  {
    key: 'ros2Controllers',
    label: 'ros2_controllers.yaml',
    hint: 'The ros2_control controller_manager config — a different file from moveit_controllers.yaml above, but also worth checking.',
    placeholder: 'controller_manager:\n  ros__parameters:\n    joint_trajectory_controller:\n      type: joint_trajectory_controller/JointTrajectoryController\n\njoint_trajectory_controller:\n  ros__parameters:\n    joints:\n      - joint1',
  },
  { key: 'cartesianLimits', label: 'pilz_cartesian_limits.yaml', hint: 'From config/pilz_cartesian_limits.yaml, if you use the Pilz planner.', placeholder: 'cartesian_limits:\n  max_trans_vel: 1.0\n  max_trans_acc: 2.25' },
];

export default function PackageUploader({ slots, onSlotsChange, extraUrdfNames, xacroNames, unmatchedNames, onExtraFiles }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openPaste, setOpenPaste] = useState<Set<keyof PackageSlots>>(new Set());
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback(
    async (files: CollectedFile[]) => {
      setBusy(true);
      try {
        const expanded = await expandZips(files);
        const classified = await classifyPackageFiles(expanded);
        onSlotsChange({
          urdf: classified.urdf ?? slots.urdf,
          srdf: classified.srdf ?? slots.srdf,
          jointLimits: classified.jointLimits ?? slots.jointLimits,
          controllers: classified.controllers ?? slots.controllers,
          kinematics: classified.kinematics ?? slots.kinematics,
          initialPositions: classified.initialPositions ?? slots.initialPositions,
          ros2Controllers: classified.ros2Controllers ?? slots.ros2Controllers,
          cartesianLimits: classified.cartesianLimits ?? slots.cartesianLimits,
        });
        onExtraFiles({
          extraUrdfNames: classified.extraUrdfNames,
          xacroNames: classified.xacroNames,
          unmatchedNames: classified.unmatchedNames,
        });
      } finally {
        setBusy(false);
      }
    },
    [onSlotsChange, onExtraFiles, slots],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const items = e.dataTransfer.items;
      let collected: CollectedFile[] = [];
      if (items && items.length > 0 && 'webkitGetAsEntry' in items[0]) {
        collected = await collectFromDataTransferItems(items);
      }
      if (collected.length === 0) collected = fileList(e.dataTransfer.files);
      if (collected.length > 0) await ingest(collected);
    },
    [ingest],
  );

  const setSlotText = (key: keyof PackageSlots, name: string, text: string) => {
    onSlotsChange({ ...slots, [key]: text.trim() ? { name, text } : null });
  };

  const togglePaste = (key: keyof PackageSlots) => {
    setOpenPaste((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-neutral-300 dark:border-neutral-700'
        }`}
      >
        <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Drag &amp; drop your moveit_config package&apos;s config folder (or a .zip) here
        </p>
        <p className="mb-4 text-xs text-neutral-500">
          SRDF, joint_limits.yaml, moveit_controllers.yaml, kinematics.yaml, and more get matched up automatically by
          content, not filename.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => filesInputRef.current?.click()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Choose files
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => folderInputRef.current?.click()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Choose folder
          </button>
        </div>
        <input
          ref={filesInputRef}
          type="file"
          multiple
          accept=".urdf,.xacro,.srdf,.yaml,.yml,.zip,.xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void ingest(fileList(e.target.files));
            e.target.value = '';
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-expect-error non-standard attribute for folder selection
          webkitdirectory=""
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void ingest(fileList(e.target.files));
            e.target.value = '';
          }}
        />
      </div>

      {xacroNames.length > 0 && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          Found {xacroNames.length} .xacro file(s) ({xacroNames.join(', ')}) &mdash; normal for a Setup Assistant package,
          since the real URDF usually lives in a separate *_description package. This tool can&apos;t expand xacro macros,
          so these are skipped; add a plain .urdf above (e.g. via <span className="font-mono">xacro your_file.xacro &gt; your_file.urdf</span>) if you want full URDF-dependent cross-checks.
        </div>
      )}
      {extraUrdfNames.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          Found more than one .urdf file &mdash; using the first one found. Extra: {extraUrdfNames.join(', ')}.
        </div>
      )}
      {unmatchedNames.length > 0 && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          {unmatchedNames.length} file(s) weren&apos;t recognized and were skipped: {unmatchedNames.join(', ')}.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        {SLOT_META.map((m) => {
          const slot = slots[m.key];
          const pasteOpen = openPaste.has(m.key);
          return (
            <div key={m.key} className="border-b border-neutral-200 p-3 last:border-b-0 dark:border-neutral-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${slot ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{m.label}</span>
                  {slot && <span className="font-mono text-xs text-neutral-500">{slot.name}</span>}
                  {!slot && <span className="text-xs text-neutral-400">not provided (optional)</span>}
                </div>
                <div className="flex gap-2">
                  {slot && (
                    <button type="button" onClick={() => setSlotText(m.key, '', '')} className="text-xs font-medium text-neutral-400 hover:text-red-600 dark:hover:text-red-400">
                      Clear
                    </button>
                  )}
                  <button type="button" onClick={() => togglePaste(m.key)} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {pasteOpen ? 'Hide' : slot ? 'Edit as text' : 'Paste as text'}
                  </button>
                </div>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-400">{m.hint}</p>
              {pasteOpen && (
                <textarea
                  value={slot?.text ?? ''}
                  onChange={(e) => setSlotText(m.key, slot?.name ?? 'pasted', e.target.value)}
                  placeholder={m.placeholder}
                  rows={5}
                  className="mt-2 w-full rounded-md border border-neutral-300 bg-white p-2.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
