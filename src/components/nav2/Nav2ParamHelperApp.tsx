'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import MapUploadPanel from './MapUploadPanel';
import RobotFootprintPanel from './RobotFootprintPanel';
import AmclParamsPanel from './AmclParamsPanel';
import CostmapParamsPanel from './CostmapParamsPanel';
import { computeInflatedCostmap } from '@/lib/nav2/inflate';
import { generateSampleMap } from '@/lib/nav2/sampleMap';
import { generateNav2ParamsYaml, parseNav2ParamsYaml } from '@/lib/nav2/paramFileIO';
import {
  AMCL_DEFAULTS,
  INFLATION_DEFAULTS,
  OBSTACLE_LAYER_DEFAULTS,
  LOCAL_COSTMAP_DEFAULTS,
  GLOBAL_COSTMAP_DEFAULTS,
  inscribedRadiusM,
  type OccupancyGrid,
  type RobotFootprint,
} from '@/lib/nav2/types';

const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false });

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Nav2ParamHelperApp() {
  const [grid, setGrid] = useState<OccupancyGrid | null>(null);
  const [mapName, setMapName] = useState<string | null>(null);
  const [footprint, setFootprint] = useState<RobotFootprint>({ type: 'circular', radiusM: 0.2, sideAM: 0.4, sideBM: 0.3 });
  const [amcl, setAmcl] = useState(AMCL_DEFAULTS);
  const [inflation, setInflation] = useState(INFLATION_DEFAULTS);
  const [obstacle, setObstacle] = useState(OBSTACLE_LAYER_DEFAULTS);
  const [local, setLocal] = useState(LOCAL_COSTMAP_DEFAULTS);
  const [global, setGlobal] = useState(GLOBAL_COSTMAP_DEFAULTS);
  const [showInflation, setShowInflation] = useState(true);
  const [testPoint, setTestPoint] = useState({ xM: 0, yM: 0 });
  const [copied, setCopied] = useState(false);

  const inflationCost = useMemo(() => {
    if (!grid) return null;
    return computeInflatedCostmap(grid, inscribedRadiusM(footprint), inflation.inflation_radius, inflation.cost_scaling_factor, inflation.inflate_unknown);
  }, [grid, footprint, inflation]);

  const loadMap = (g: OccupancyGrid, name: string) => {
    setGrid(g);
    setMapName(name);
    setTestPoint({ xM: g.origin[0] + (g.width * g.resolution) / 2, yM: g.origin[1] + (g.height * g.resolution) / 2 });
  };

  const handleParamFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseNav2ParamsYaml(text);
    setAmcl((prev) => ({ ...prev, ...parsed.amcl }));
    setInflation((prev) => ({ ...prev, ...parsed.inflation }));
    setObstacle((prev) => ({ ...prev, ...parsed.obstacle }));
    setLocal((prev) => ({ ...prev, ...parsed.local }));
    setGlobal((prev) => ({ ...prev, ...parsed.global }));
    if (parsed.footprint) setFootprint((prev) => ({ ...prev, ...parsed.footprint }));
  };

  const exportYaml = () => generateNav2ParamsYaml({ amcl, footprint, inflation, obstacle, local, global });

  const displayGrid = grid ?? generateSampleMap();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_440px]">
      <div className="space-y-4">
        <MapUploadPanel onMapLoaded={loadMap} onParamFile={(f) => void handleParamFile(f)} />
        <RobotFootprintPanel footprint={footprint} onChange={setFootprint} />
        <AmclParamsPanel params={amcl} onChange={setAmcl} />
        <CostmapParamsPanel
          inflation={inflation}
          onInflationChange={setInflation}
          obstacle={obstacle}
          onObstacleChange={setObstacle}
          local={local}
          onLocalChange={setLocal}
          global={global}
          onGlobalChange={setGlobal}
          showInflation={showInflation}
          onShowInflationChange={setShowInflation}
        />

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Export</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Generates an <span className="font-mono">amcl</span> / <span className="font-mono">local_costmap</span> /{' '}
            <span className="font-mono">global_costmap</span> block in the same shape as{' '}
            <span className="font-mono">nav2_params.yaml</span> — paste it into your own file, or merge with the rest of your Nav2
            stack config (planner, controller, behavior server, etc., which this tool doesn&apos;t generate).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadText(exportYaml(), 'nav2_params_generated.yaml')}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Download nav2_params.yaml
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportYaml());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                } catch {
                  // clipboard API unavailable — silently ignore
                }
              }}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {copied ? 'Copied!' : 'Copy YAML'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2 lg:sticky lg:top-20 lg:self-start">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {mapName ? `Map: ${mapName}` : 'Sample map (upload your own on the left)'} — click the map to move the footprint test point
        </p>
        <div className="h-[32rem] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
          <MapCanvas
            grid={displayGrid}
            inflationCost={inflationCost}
            showInflation={showInflation}
            footprint={footprint}
            testPoint={testPoint}
            onTestPointChange={setTestPoint}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-white ring-1 ring-neutral-400" /> free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-black" /> occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-400" /> unknown
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> inflated cost
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-green-500" /> robot footprint
          </span>
        </div>
      </div>
    </div>
  );
}
