'use client';

import { useMemo, useState } from 'react';
import type { URDFRobot } from 'urdf-loader';

interface ControllableJoint {
  name: string;
  type: string;
  lower: number;
  upper: number;
}

const CONTROLLABLE_TYPES = new Set(['revolute', 'continuous', 'prismatic']);
const DEFAULT_CONTINUOUS_RANGE = Math.PI;

function getControllableJoints(robot: URDFRobot | null): ControllableJoint[] {
  if (!robot) return [];
  return Object.entries(robot.joints)
    .filter(([, j]) => CONTROLLABLE_TYPES.has(j.jointType))
    .map(([name, j]) => {
      const hasLimit = Number.isFinite(j.limit?.lower) && Number.isFinite(j.limit?.upper) && j.limit.lower !== j.limit.upper;
      return {
        name,
        type: j.jointType,
        lower: hasLimit ? j.limit.lower : -DEFAULT_CONTINUOUS_RANGE,
        upper: hasLimit ? j.limit.upper : DEFAULT_CONTINUOUS_RANGE,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface Props {
  robot: URDFRobot | null;
  onSetJointValue: (name: string, value: number) => void;
}

export default function JointControlsPanel({ robot, onSetJointValue }: Props) {
  const joints = useMemo(() => getControllableJoints(robot), [robot]);
  const [values, setValues] = useState<Record<string, number>>({});
  const [trackedJoints, setTrackedJoints] = useState(joints);

  if (joints !== trackedJoints) {
    setTrackedJoints(joints);
    const initial: Record<string, number> = {};
    joints.forEach((j) => {
      initial[j.name] = 0;
    });
    setValues(initial);
  }

  if (!robot) {
    return <p className="text-sm text-neutral-500">Load a URDF to control its joints.</p>;
  }

  if (joints.length === 0) {
    return <p className="text-sm text-neutral-500">No revolute, continuous, or prismatic joints found in this robot.</p>;
  }

  const handleChange = (name: string, value: number) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    onSetJointValue(name, value);
  };

  const resetAll = () => {
    joints.forEach((j) => onSetJointValue(j.name, 0));
    const reset: Record<string, number> = {};
    joints.forEach((j) => {
      reset[j.name] = 0;
    });
    setValues(reset);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{joints.length} movable joint{joints.length === 1 ? '' : 's'}</p>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Reset all
        </button>
      </div>
      <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {joints.map((j) => {
          const value = values[j.name] ?? 0;
          return (
            <div key={j.name}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label htmlFor={`joint-${j.name}`} className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200" title={j.name}>
                  {j.name}
                </label>
                <span className="shrink-0 font-mono text-xs text-neutral-500">
                  {value.toFixed(3)} <span className="text-neutral-400">({j.type})</span>
                </span>
              </div>
              <input
                id={`joint-${j.name}`}
                type="range"
                min={j.lower}
                max={j.upper}
                step={(j.upper - j.lower) / 500 || 0.01}
                value={value}
                onChange={(e) => handleChange(j.name, parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
