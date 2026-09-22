'use client';

import { useState } from 'react';
import SliderField from '@/components/common/SliderField';
import type { CostmapCommonParams, InflationLayerParams, ObstacleLayerParams } from '@/lib/nav2/types';

interface Props {
  inflation: InflationLayerParams;
  onInflationChange: (p: InflationLayerParams) => void;
  obstacle: ObstacleLayerParams;
  onObstacleChange: (p: ObstacleLayerParams) => void;
  local: CostmapCommonParams;
  onLocalChange: (p: CostmapCommonParams) => void;
  global: CostmapCommonParams;
  onGlobalChange: (p: CostmapCommonParams) => void;
  showInflation: boolean;
  onShowInflationChange: (v: boolean) => void;
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0 dark:border-neutral-800">
      <button type="button" onClick={() => setOpen((o) => !o)} className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        {open ? '−' : '+'} {title}
      </button>
      {open && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>}
    </div>
  );
}

function CommonCostmapFields({ params, onChange }: { params: CostmapCommonParams; onChange: (p: CostmapCommonParams) => void }) {
  const set = <K extends keyof CostmapCommonParams>(key: K, value: CostmapCommonParams[K]) => onChange({ ...params, [key]: value });
  return (
    <>
      <SliderField label="resolution (m)" value={params.resolution} onChange={(v) => set('resolution', v)} min={0.01} max={0.5} step={0.01} decimals={3} />
      <SliderField label="update_frequency (Hz)" value={params.update_frequency} onChange={(v) => set('update_frequency', v)} min={0.1} max={20} step={0.1} decimals={2} />
      <SliderField label="publish_frequency (Hz)" value={params.publish_frequency} onChange={(v) => set('publish_frequency', v)} min={0.1} max={20} step={0.1} decimals={2} />
      <SliderField label="transform_tolerance (s)" value={params.transform_tolerance} onChange={(v) => set('transform_tolerance', v)} min={0} max={2} step={0.01} decimals={2} />
      <CheckField label="rolling_window" checked={params.rolling_window} onChange={(v) => set('rolling_window', v)} />
      <CheckField label="track_unknown_space" checked={params.track_unknown_space} onChange={(v) => set('track_unknown_space', v)} />
      {params.rolling_window && (
        <>
          <SliderField label="width (m)" value={params.width} onChange={(v) => set('width', v)} min={1} max={20} step={0.5} decimals={1} />
          <SliderField label="height (m)" value={params.height} onChange={(v) => set('height', v)} min={1} max={20} step={0.5} decimals={1} />
        </>
      )}
    </>
  );
}

export default function CostmapParamsPanel({
  inflation,
  onInflationChange,
  obstacle,
  onObstacleChange,
  local,
  onLocalChange,
  global,
  onGlobalChange,
  showInflation,
  onShowInflationChange,
}: Props) {
  const setInflation = <K extends keyof InflationLayerParams>(key: K, value: InflationLayerParams[K]) => onInflationChange({ ...inflation, [key]: value });
  const setObstacle = <K extends keyof ObstacleLayerParams>(key: K, value: ObstacleLayerParams[K]) => onObstacleChange({ ...obstacle, [key]: value });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Costmap parameters</h2>
      <div className="space-y-3">
        <div className="border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0 dark:border-neutral-800">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Inflation layer</span>
            <CheckField label="show on map" checked={showInflation} onChange={onShowInflationChange} />
          </div>
          <div className="space-y-3">
            <SliderField label="inflation_radius (m)" value={inflation.inflation_radius} onChange={(v) => setInflation('inflation_radius', Math.max(0, v))} min={0} max={3} step={0.01} decimals={2} />
            <SliderField label="cost_scaling_factor" value={inflation.cost_scaling_factor} onChange={(v) => setInflation('cost_scaling_factor', Math.max(0.01, v))} min={0.1} max={20} step={0.1} decimals={2} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <CheckField label="inflate_unknown" checked={inflation.inflate_unknown} onChange={(v) => setInflation('inflate_unknown', v)} />
            <CheckField label="inflate_around_unknown" checked={inflation.inflate_around_unknown} onChange={(v) => setInflation('inflate_around_unknown', v)} />
            <CheckField label="enabled" checked={inflation.enabled} onChange={(v) => setInflation('enabled', v)} />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Drag <span className="font-mono">inflation_radius</span> or <span className="font-mono">cost_scaling_factor</span> and
            watch the halo around obstacles on the map update live.
          </p>
        </div>

        <Section title="Obstacle layer">
          <CheckField label="enabled" checked={obstacle.enabled} onChange={(v) => setObstacle('enabled', v)} />
          <CheckField label="footprint_clearing_enabled" checked={obstacle.footprint_clearing_enabled} onChange={(v) => setObstacle('footprint_clearing_enabled', v)} />
          <SliderField label="min_obstacle_height (m)" value={obstacle.min_obstacle_height} onChange={(v) => setObstacle('min_obstacle_height', v)} min={0} max={5} step={0.05} decimals={2} />
          <SliderField label="max_obstacle_height (m)" value={obstacle.max_obstacle_height} onChange={(v) => setObstacle('max_obstacle_height', v)} min={0} max={5} step={0.05} decimals={2} />
          <SliderField label="obstacle_min_range (m)" value={obstacle.obstacle_min_range} onChange={(v) => setObstacle('obstacle_min_range', v)} min={0} max={10} step={0.05} decimals={2} />
          <SliderField label="obstacle_max_range (m)" value={obstacle.obstacle_max_range} onChange={(v) => setObstacle('obstacle_max_range', v)} min={0} max={10} step={0.05} decimals={2} />
          <SliderField label="raytrace_min_range (m)" value={obstacle.raytrace_min_range} onChange={(v) => setObstacle('raytrace_min_range', v)} min={0} max={10} step={0.05} decimals={2} />
          <SliderField label="raytrace_max_range (m)" value={obstacle.raytrace_max_range} onChange={(v) => setObstacle('raytrace_max_range', v)} min={0} max={15} step={0.05} decimals={2} />
        </Section>

        <Section title="Local costmap">
          <CommonCostmapFields params={local} onChange={onLocalChange} />
        </Section>

        <Section title="Global costmap">
          <CommonCostmapFields params={global} onChange={onGlobalChange} />
        </Section>
      </div>
    </div>
  );
}
