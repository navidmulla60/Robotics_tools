'use client';

import { useRef, useState } from 'react';
import type { MapYaml, OccupancyGrid } from '@/lib/nav2/types';
import { parseMapYaml, parsePgm, decodeRasterImageToGrayscale, imageToOccupancyGrid, computeGridStats, type GridStats } from '@/lib/nav2/mapParser';
import { generateSampleMap } from '@/lib/nav2/sampleMap';

interface Props {
  onMapLoaded: (grid: OccupancyGrid, sourceName: string) => void;
  onParamFile: (file: File) => void;
}

export default function MapUploadPanel({ onMapLoaded, onParamFile }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [loadedYaml, setLoadedYaml] = useState<MapYaml | null>(null);
  const [stats, setStats] = useState<GridStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paramInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    const yamlFile = list.find((f) => /\.ya?ml$/i.test(f.name));
    const imageFile = list.find((f) => /\.(pgm|png|bmp|jpg|jpeg)$/i.test(f.name));

    if (!yamlFile || !imageFile) {
      setError('Please provide both a map.yaml file and a map image (.pgm or .png).');
      return;
    }

    setLoading(true);
    try {
      const yamlText = await yamlFile.text();
      const yaml = parseMapYaml(yamlText);
      const buffer = await imageFile.arrayBuffer();
      const isPgm = /\.pgm$/i.test(imageFile.name);
      const image = isPgm ? parsePgm(buffer) : await decodeRasterImageToGrayscale(new Blob([buffer]));
      const grid = imageToOccupancyGrid(image, yaml);
      onMapLoaded(grid, imageFile.name);
      setLoadedName(imageFile.name);
      setLoadedYaml(yaml);
      setStats(computeGridStats(grid));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load map.');
      setLoadedYaml(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const looksMismatched = stats ? stats.unknownPct > 85 || stats.freePct + stats.occupiedPct < 5 : false;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Map</h2>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-300 px-4 py-6 text-center dark:border-neutral-700"
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Drop your map&apos;s <span className="font-mono">.yaml</span> and image (<span className="font-mono">.pgm</span>/
          <span className="font-mono">.png</span>) here, or browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".yaml,.yml,.pgm,.png,.bmp,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Browse files
        </button>
      </div>

      {loading && <p className="mt-2 text-xs text-neutral-500">Loading map…</p>}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {loadedName && !error && <p className="mt-2 text-xs text-green-600 dark:text-green-400">Loaded {loadedName}</p>}

      {loadedYaml && stats && !error && (
        <div className="mt-2 rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-400">
          <p>
            Parsed: resolution {loadedYaml.resolution} m/px, negate {loadedYaml.negate}, occupied_thresh {loadedYaml.occupied_thresh},
            free_thresh {loadedYaml.free_thresh}, mode {loadedYaml.mode}
          </p>
          <p className="mt-1">
            {stats.freePct.toFixed(1)}% free, {stats.occupiedPct.toFixed(1)}% occupied, {stats.unknownPct.toFixed(1)}% unknown
          </p>
        </div>
      )}
      {looksMismatched && (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          That&apos;s an unusually high unknown/uniform fraction for a real map — if this doesn&apos;t look right, double-check{' '}
          <span className="font-mono">negate</span>, <span className="font-mono">occupied_thresh</span>, and{' '}
          <span className="font-mono">free_thresh</span> in your yaml against how your tool actually encoded the image (map_saver&apos;s
          convention is occupied=0, free=254, unknown=205, with defaults occupied_thresh=0.65/free_thresh=0.25 — a smaller
          free_thresh, or thresholds meant for a differently-encoded image, can push almost everything into one bucket).
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          onMapLoaded(generateSampleMap(), 'sample map');
          setLoadedName('sample map');
          setLoadedYaml(null);
          setStats(null);
          setError(null);
        }}
        className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        Or try it with a sample map
      </button>

      <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <p className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Already have an AMCL / nav2_params.yaml? Upload it to prefill the parameters below.
        </p>
        <input
          ref={paramInputRef}
          type="file"
          accept=".yaml,.yml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onParamFile(file);
          }}
        />
        <button
          type="button"
          onClick={() => paramInputRef.current?.click()}
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Upload existing param file
        </button>
      </div>
    </div>
  );
}
