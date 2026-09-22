'use client';

import { useState } from 'react';
import NumberField from '@/components/common/NumberField';
import FovDiagram from './FovDiagram';
import FootprintDiagram from './FootprintDiagram';
import { computeFov } from '@/lib/camerafov/compute';
import { SENSOR_PRESETS, DEFAULT_SENSOR_PRESET } from '@/lib/camerafov/presets';

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

export default function CameraFovCalculatorApp() {
  const [sensorPreset, setSensorPreset] = useState(DEFAULT_SENSOR_PRESET);
  const [sensorWidthMm, setSensorWidthMm] = useState(SENSOR_PRESETS[DEFAULT_SENSOR_PRESET].widthMm);
  const [sensorHeightMm, setSensorHeightMm] = useState(SENSOR_PRESETS[DEFAULT_SENSOR_PRESET].heightMm);
  const [focalLengthMm, setFocalLengthMm] = useState(4);
  const [distanceM, setDistanceM] = useState(2);
  const [useResolution, setUseResolution] = useState(false);
  const [imageWidthPx, setImageWidthPx] = useState(1920);
  const [imageHeightPx, setImageHeightPx] = useState(1080);

  const result = computeFov(
    sensorWidthMm,
    sensorHeightMm,
    focalLengthMm,
    distanceM,
    useResolution ? imageWidthPx : null,
    useResolution ? imageHeightPx : null,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Sensor</h2>
            <select
              value={sensorPreset}
              onChange={(e) => {
                const name = e.target.value;
                setSensorPreset(name);
                const preset = SENSOR_PRESETS[name];
                if (preset) {
                  setSensorWidthMm(preset.widthMm);
                  setSensorHeightMm(preset.heightMm);
                }
              }}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              {sensorPreset === 'Custom' && <option value="Custom">Custom</option>}
              {Object.keys(SENSOR_PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Sensor width (mm)"
              value={sensorWidthMm}
              onChange={(v) => {
                setSensorPreset('Custom');
                setSensorWidthMm(v);
              }}
              decimals={3}
            />
            <NumberField
              label="Sensor height (mm)"
              value={sensorHeightMm}
              onChange={(v) => {
                setSensorPreset('Custom');
                setSensorHeightMm(v);
              }}
              decimals={3}
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Lens &amp; working distance</h2>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Focal length (mm)" value={focalLengthMm} onChange={setFocalLengthMm} decimals={2} />
            <NumberField label="Working distance (m)" value={distanceM} onChange={setDistanceM} decimals={2} />
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <input type="checkbox" checked={useResolution} onChange={(e) => setUseResolution(e.target.checked)} />
            Also compute ground sample distance (needs image resolution)
          </label>
          {useResolution && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <NumberField label="Image width (px)" value={imageWidthPx} onChange={setImageWidthPx} decimals={0} />
              <NumberField label="Image height (px)" value={imageHeightPx} onChange={setImageHeightPx} decimals={0} />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Results</h2>
            <CopyButton
              label="Copy results"
              getText={() =>
                `HFOV: ${result.hFovDeg.toFixed(2)} deg\nVFOV: ${result.vFovDeg.toFixed(2)} deg\nDFOV: ${result.dFovDeg.toFixed(2)} deg\nCoverage: ${result.coverageWidthM.toFixed(3)} x ${result.coverageHeightM.toFixed(3)} m at ${distanceM} m\n35mm equivalent focal length: ${result.equivalentFocalLengthMm.toFixed(1)} mm`
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Field of view</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">H: {result.hFovDeg.toFixed(2)}&deg;</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">V: {result.vFovDeg.toFixed(2)}&deg;</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">D: {result.dFovDeg.toFixed(2)}&deg;</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Coverage at {distanceM} m</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">W: {result.coverageWidthM.toFixed(3)} m</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">H: {result.coverageHeightM.toFixed(3)} m</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">D: {result.coverageDiagonalM.toFixed(3)} m</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Other</p>
              <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">35mm equiv: {result.equivalentFocalLengthMm.toFixed(1)} mm</p>
              {result.gsdWidthMmPerPx !== null && (
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">GSD: {(result.gsdWidthMmPerPx * 1000).toFixed(1)} &micro;m/px</p>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Uses the pinhole-camera approximation (angle of view = 2&middot;atan(sensor dimension / (2&middot;focal length)), coverage =
          distance&middot;sensor dimension / focal length) — ignores lens distortion, so results are most accurate for rectilinear
          lenses without strong barrel/fisheye distortion.
        </p>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div>
          <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Top-down view (horizontal FOV)</p>
          <div className="h-52 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
            <FovDiagram distanceM={distanceM} coverageWidthM={result.coverageWidthM} hFovDeg={result.hFovDeg} />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Imaged footprint at {distanceM} m</p>
          <div className="h-52 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
            <FootprintDiagram coverageWidthM={result.coverageWidthM} coverageHeightM={result.coverageHeightM} />
          </div>
        </div>
      </div>
    </div>
  );
}
