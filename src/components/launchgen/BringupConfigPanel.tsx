'use client';

import NumberField from '@/components/common/NumberField';
import { createCustomNode, type BringupConfig, type CustomNode } from '@/lib/launchgen/types';

interface Props {
  config: BringupConfig;
  onChange: (config: BringupConfig) => void;
}

function TextField({ label, value, onChange, mono = true }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 ${mono ? 'font-mono' : ''}`}
      />
    </label>
  );
}

function CheckRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
      <span>
        <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
        {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}

function CustomNodeEditor({ node, onChange, onRemove }: { node: CustomNode; onChange: (n: CustomNode) => void; onRemove: () => void }) {
  return (
    <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <input type="checkbox" checked={node.enabled} onChange={(e) => onChange({ ...node, enabled: e.target.checked })} />
          include in generated file
        </label>
        <button type="button" onClick={onRemove} className="rounded-md px-1.5 py-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <TextField label="package" value={node.package} onChange={(v) => onChange({ ...node, package: v })} />
        <TextField label="executable" value={node.executable} onChange={(v) => onChange({ ...node, executable: v })} />
        <TextField label="node name" value={node.name} onChange={(v) => onChange({ ...node, name: v })} />
      </div>
      <div className="mt-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">parameters (one &quot;key: value&quot; per line)</span>
          <textarea
            value={node.paramsText}
            onChange={(e) => onChange({ ...node, paramsText: e.target.value })}
            rows={2}
            placeholder={'port: /dev/ttyUSB0\nbaud: 115200'}
            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
      </div>
      <div className="mt-2">
        <TextField label="extra CLI arguments (space-separated)" value={node.argumentsText} onChange={(v) => onChange({ ...node, argumentsText: v })} />
      </div>
    </div>
  );
}

export default function BringupConfigPanel({ config, onChange }: Props) {
  const set = <K extends keyof BringupConfig>(key: K, value: BringupConfig[K]) => onChange({ ...config, [key]: value });
  const setPose = <K extends keyof BringupConfig['spawnPose']>(key: K, value: number) => onChange({ ...config, spawnPose: { ...config.spawnPose, [key]: value } });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Bringup launch file</h2>

      <div className="space-y-2">
        <TextField label="Package name" value={config.packageName} onChange={(v) => set('packageName', v)} />
        <TextField label="Xacro/URDF path (relative to package share)" value={config.xacroPath} onChange={(v) => set('xacroPath', v)} />
      </div>

      <div className="mt-4 space-y-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <CheckRow label="Gazebo (gz sim) + spawn robot" hint="Launches the simulator and spawns your robot from /robot_description." checked={config.useGazebo} onChange={(v) => set('useGazebo', v)} />
        {config.useGazebo && (
          <div className="ml-6 space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <TextField label="Entity name" value={config.entityName} onChange={(v) => set('entityName', v)} />
              <TextField label="World file" value={config.gazeboWorld} onChange={(v) => set('gazeboWorld', v)} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <NumberField label="Spawn x (m)" value={config.spawnPose.x} onChange={(v) => setPose('x', v)} decimals={2} />
              <NumberField label="Spawn y (m)" value={config.spawnPose.y} onChange={(v) => setPose('y', v)} decimals={2} />
              <NumberField label="Spawn z (m)" value={config.spawnPose.z} onChange={(v) => setPose('z', v)} decimals={2} />
              <NumberField label="Spawn yaw (rad)" value={config.spawnPose.yaw} onChange={(v) => setPose('yaw', v)} decimals={2} />
            </div>
          </div>
        )}

        <CheckRow label="RViz2" hint="Adds a use_rviz launch argument so it can be toggled off at run time." checked={config.useRviz} onChange={(v) => set('useRviz', v)} />
        {config.useRviz && (
          <div className="ml-6">
            <TextField label="RViz config path (relative to package share)" value={config.rvizConfigPath} onChange={(v) => set('rvizConfigPath', v)} />
          </div>
        )}

        <CheckRow
          label="joint_state_publisher"
          hint="Publishes fake joint states, for viewing a robot with no real/simulated hardware behind it."
          checked={config.useJointStatePublisher}
          onChange={(v) => set('useJointStatePublisher', v)}
        />
        <CheckRow
          label="joint_state_publisher_gui"
          hint="Same, with sliders. Skip both of these if ros2_control's joint_state_broadcaster is already publishing joint states."
          checked={config.useJointStatePublisherGui}
          onChange={(v) => set('useJointStatePublisherGui', v)}
        />

        <CheckRow label="static_transform_publisher" hint="A fixed TF, e.g. between a sensor frame and base_link." checked={config.useStaticTransformPublisher} onChange={(v) => set('useStaticTransformPublisher', v)} />
        {config.useStaticTransformPublisher && (
          <div className="ml-6">
            <TextField label="Arguments" value={config.staticTfArgs} onChange={(v) => set('staticTfArgs', v)} />
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Custom nodes</p>
          <button
            type="button"
            onClick={() => set('customNodes', [...config.customNodes, createCustomNode(config.customNodes.length + 1)])}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + Add node template
          </button>
        </div>
        <p className="mb-2 text-xs text-neutral-500">
          A blank starting point for any node this tool doesn&apos;t know about — fill in the package/executable, rename it, add
          params, and it&apos;ll drop straight into the generated file.
        </p>
        <div className="space-y-3">
          {config.customNodes.map((n) => (
            <CustomNodeEditor
              key={n.id}
              node={n}
              onChange={(updated) => set('customNodes', config.customNodes.map((c) => (c.id === updated.id ? updated : c)))}
              onRemove={() => set('customNodes', config.customNodes.filter((c) => c.id !== n.id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
