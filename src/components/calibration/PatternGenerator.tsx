'use client';

import { useMemo, useState } from 'react';
import NumberField from '@/components/common/NumberField';
import type { PatternConfig, PatternType } from '@/lib/calibration/types';
import { boardSizeMm, totalSizeMm, buildSvgMarkup } from '@/lib/calibration/svg';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function downloadPng(svgMarkup: string, widthMm: number, heightMm: number, dpi: number, filename: string) {
  const pxPerMm = dpi / 25.4;
  const widthPx = Math.max(1, Math.round(widthMm * pxPerMm));
  const heightPx = Math.max(1, Math.round(heightMm * pxPerMm));

  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to rasterize pattern'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, widthPx, heightPx);
    ctx.drawImage(img, 0, 0, widthPx, heightPx);

    const pngBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (pngBlob) downloadBlob(pngBlob, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const DEFAULTS: Record<PatternType, PatternConfig> = {
  checkerboard: { type: 'checkerboard', cols: 9, rows: 6, squareSizeMm: 25, circleDiameterMm: 15, marginMm: 15 },
  circlesSymmetric: { type: 'circlesSymmetric', cols: 4, rows: 11, squareSizeMm: 25, circleDiameterMm: 15, marginMm: 15 },
};

export default function PatternGenerator() {
  const [config, setConfig] = useState<PatternConfig>(DEFAULTS.checkerboard);
  const [dpi, setDpi] = useState(300);

  const svgMarkup = useMemo(() => buildSvgMarkup(config), [config]);
  const board = boardSizeMm(config);
  const total = totalSizeMm(config);

  const set = <K extends keyof PatternConfig>(key: K, value: PatternConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));

  const filenameBase = `${config.type === 'checkerboard' ? 'checkerboard' : 'circles-grid'}_${config.cols}x${config.rows}_${config.squareSizeMm}mm`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Pattern</h2>
            <div className="flex overflow-hidden rounded-md border border-neutral-300 text-xs dark:border-neutral-700">
              {(['checkerboard', 'circlesSymmetric'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setConfig(DEFAULTS[type])}
                  className={`px-2.5 py-1 font-medium ${
                    config.type === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  {type === 'checkerboard' ? 'Checkerboard' : 'Symmetric circle grid'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={config.type === 'checkerboard' ? 'Internal corners — columns' : 'Circle columns'}
              value={config.cols}
              onChange={(v) => set('cols', Math.max(2, Math.round(v)))}
              decimals={0}
            />
            <NumberField
              label={config.type === 'checkerboard' ? 'Internal corners — rows' : 'Circle rows'}
              value={config.rows}
              onChange={(v) => set('rows', Math.max(2, Math.round(v)))}
              decimals={0}
            />
            <NumberField
              label={config.type === 'checkerboard' ? 'Square size (mm)' : 'Circle spacing (mm)'}
              value={config.squareSizeMm}
              onChange={(v) => set('squareSizeMm', Math.max(0.1, v))}
              decimals={2}
            />
            {config.type === 'circlesSymmetric' ? (
              <NumberField label="Circle diameter (mm)" value={config.circleDiameterMm} onChange={(v) => set('circleDiameterMm', Math.max(0.1, v))} decimals={2} />
            ) : (
              <NumberField label="Margin (mm)" value={config.marginMm} onChange={(v) => set('marginMm', Math.max(0, v))} decimals={1} />
            )}
          </div>
          {config.type === 'circlesSymmetric' && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="Margin (mm)" value={config.marginMm} onChange={(v) => set('marginMm', Math.max(0, v))} decimals={1} />
            </div>
          )}

          {config.type === 'checkerboard' && (
            <p className="mt-3 text-xs text-neutral-500">
              OpenCV / ROS <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">findChessboardCorners</code>{' '}
              and camera_calibration count <span className="font-medium">internal corners</span> (where four squares meet), not
              full squares — a &quot;9&times;6&quot; board like this one has {config.cols + 1}&times;{config.rows + 1} squares.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Size &amp; export</h2>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Pattern area: <span className="font-mono">{board.widthMm.toFixed(1)} &times; {board.heightMm.toFixed(1)} mm</span>
            <br />
            Full sheet (with margin): <span className="font-mono">{total.widthMm.toFixed(1)} &times; {total.heightMm.toFixed(1)} mm</span>
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => downloadBlob(new Blob([svgMarkup], { type: 'image/svg+xml' }), `${filenameBase}.svg`)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Download SVG
            </button>
            <div className="flex items-end gap-2">
              <NumberField label="PNG DPI" value={dpi} onChange={(v) => setDpi(Math.max(50, Math.round(v)))} decimals={0} />
              <button
                type="button"
                onClick={() => downloadPng(svgMarkup, total.widthMm, total.heightMm, dpi, `${filenameBase}_${dpi}dpi.png`)}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Download PNG
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            The preview on the right is <span className="font-medium">not to scale on screen</span>. Print the downloaded file at
            100% / &quot;actual size&quot; (never &quot;fit to page&quot;), then measure a square or circle spacing with a ruler
            before using it — printer scaling errors are the most common source of bad calibration results. Mount the print on a
            flat, rigid surface (foam board, acrylic, a clipboard) so it can&apos;t warp.
          </p>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Preview</p>
        <div
          className="flex h-72 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 sm:h-96 dark:border-neutral-800 [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-full [&>svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      </div>
    </div>
  );
}
