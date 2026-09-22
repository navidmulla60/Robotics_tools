'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { URDFRobot } from 'urdf-loader';
import type { CollectedFile } from '@/lib/urdf/types';
import { buildResourceContext, revokeResourceContext, type ResourceContext } from '@/lib/urdf/fileCollection';
import { lintUrdf } from '@/lib/urdf/lint';
import { buildTfTree } from '@/lib/urdf/tfTree';
import UrdfUploader from './UrdfUploader';
import UrdfViewerCanvas, { type UrdfViewerHandle } from './UrdfViewerCanvas';
import TfTreePanel from './TfTreePanel';
import JointControlsPanel from './JointControlsPanel';
import SuggestionsPanel from './SuggestionsPanel';

export default function UrdfVisualizerApp() {
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resourceCtx, setResourceCtx] = useState<ResourceContext | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [urdfName, setUrdfName] = useState<string>('robot.urdf');
  const [urdfText, setUrdfText] = useState<string | null>(null);
  const [robot, setRobot] = useState<URDFRobot | null>(null);
  const [missingMeshes, setMissingMeshes] = useState<string[]>([]);
  const [showCollision, setShowCollision] = useState(false);

  const viewerRef = useRef<UrdfViewerHandle>(null);

  const loadUrdfText = useCallback(async (name: string, text: string) => {
    setUrdfName(name);
    setUrdfText(text);
    setRobot(null);
    setMissingMeshes([]);
    setLoadError(null);
  }, []);

  const handleFiles = useCallback(
    async (files: CollectedFile[]) => {
      setBusy(true);
      setLoadError(null);
      try {
        if (resourceCtx) revokeResourceContext(resourceCtx);
        const ctx = buildResourceContext(files);
        setResourceCtx(ctx);

        if (ctx.urdfCandidates.length === 0) {
          setLoadError('No .urdf or .xacro file found among the uploaded files.');
          setUrdfText(null);
          setRobot(null);
          return;
        }

        const chosen = ctx.urdfCandidates.sort((a, b) => a.relativePath.length - b.relativePath.length)[0];
        setSelectedPath(chosen.relativePath);
        const text = await chosen.file.text();
        await loadUrdfText(chosen.name, text);
      } finally {
        setBusy(false);
      }
    },
    [resourceCtx, loadUrdfText],
  );

  const handleSelectCandidate = useCallback(
    async (relativePath: string) => {
      if (!resourceCtx) return;
      const candidate = resourceCtx.urdfCandidates.find((f) => f.relativePath === relativePath);
      if (!candidate) return;
      setSelectedPath(relativePath);
      const text = await candidate.file.text();
      await loadUrdfText(candidate.name, text);
    },
    [resourceCtx, loadUrdfText],
  );

  const handleMissingMesh = useCallback((basename: string) => {
    setMissingMeshes((prev) => (prev.includes(basename) ? prev : [...prev, basename]));
  }, []);

  const lintIssues = useMemo(() => (urdfText ? lintUrdf(urdfText) : []), [urdfText]);
  const tfTree = useMemo(() => (urdfText ? buildTfTree(urdfText) : null), [urdfText]);
  const hasFatalParseError = lintIssues.some((i) => i.id === 'parse-error' || i.id === 'no-robot-tag');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <UrdfUploader onFiles={handleFiles} onPasteText={loadUrdfText} busy={busy} />

          {resourceCtx && resourceCtx.urdfCandidates.length > 1 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <label htmlFor="urdf-candidate" className="text-neutral-600 dark:text-neutral-400">
                Multiple URDF files found:
              </label>
              <select
                id="urdf-candidate"
                value={selectedPath ?? ''}
                onChange={(e) => void handleSelectCandidate(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              >
                {resourceCtx.urdfCandidates.map((c) => (
                  <option key={c.relativePath} value={c.relativePath}>
                    {c.relativePath}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loadError && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {loadError}
            </p>
          )}
        </div>

        <div className="relative h-[28rem] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 sm:h-[36rem]">
          {urdfText && !hasFatalParseError ? (
            <UrdfViewerCanvas
              ref={viewerRef}
              urdfText={urdfText}
              meshMap={resourceCtx?.meshMap ?? new Map()}
              showCollision={showCollision}
              onLoaded={setRobot}
              onError={(msg) => setLoadError(msg)}
              onMissingMesh={handleMissingMesh}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-400">
              {hasFatalParseError ? 'Fix the XML errors below, then reload the file.' : 'Upload a URDF (or try the sample robot) to see it rendered here.'}
            </div>
          )}
          {urdfText && !hasFatalParseError && (
            <label className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-neutral-900/90 px-2.5 py-1 text-xs font-medium text-neutral-300 shadow">
              <input type="checkbox" checked={showCollision} onChange={(e) => setShowCollision(e.target.checked)} />
              Show collision geometry
            </label>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">TF tree</h2>
          <TfTreePanel tree={tfTree} robotName={urdfName.replace(/\.(urdf|xacro)$/i, '')} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Joint states</h2>
          <JointControlsPanel robot={robot} onSetJointValue={(name, value) => viewerRef.current?.setJointValue(name, value)} />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Suggestions</h2>
          <SuggestionsPanel issues={lintIssues} missingMeshes={missingMeshes} />
        </div>
      </div>
    </div>
  );
}
