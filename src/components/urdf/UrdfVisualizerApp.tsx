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
  const [viewerLoading, setViewerLoading] = useState(false);

  const viewerRef = useRef<UrdfViewerHandle>(null);

  const loadUrdfText = useCallback(async (name: string, text: string) => {
    setUrdfName(name);
    setUrdfText(text);
    setRobot(null);
    setMissingMeshes([]);
    setLoadError(null);
    setViewerLoading(true);
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
  const xacroIssue = lintIssues.find((i) => i.id === 'xacro-detected');
  const suggestionIssues = useMemo(() => lintIssues.filter((i) => i.id !== 'xacro-detected'), [lintIssues]);

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

          {xacroIssue && (
            <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="font-medium">This looks like a xacro file, not a plain URDF.</p>
              <p className="mt-1">
                Xacro macros and <code className="rounded bg-amber-900/10 px-1 py-0.5 font-mono text-xs dark:bg-black/30">${'{...}'}</code> expressions
                can&apos;t be evaluated in the browser. Convert it to a plain URDF first, then upload that file instead:
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-amber-900/10 px-2.5 py-1.5 font-mono text-xs dark:bg-black/30">
                xacro your_file.xacro {'>'} your_file.urdf
              </pre>
              <p className="mt-1 text-xs opacity-80">
                On ROS 2, if <code className="font-mono">xacro</code> isn&apos;t directly on your PATH:{' '}
                <code className="font-mono">ros2 run xacro xacro your_file.xacro -o your_file.urdf</code>
              </p>
            </div>
          )}
        </div>

        <div className="relative h-[28rem] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 sm:h-[36rem]">
          {urdfText && !hasFatalParseError ? (
            <UrdfViewerCanvas
              ref={viewerRef}
              urdfText={urdfText}
              meshMap={resourceCtx?.meshMap ?? new Map()}
              showCollision={showCollision}
              onLoaded={(r) => {
                setRobot(r);
                setViewerLoading(false);
              }}
              onError={(msg) => {
                setLoadError(msg);
                setViewerLoading(false);
              }}
              onMissingMesh={handleMissingMesh}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-400">
              {hasFatalParseError ? 'Fix the XML errors below, then reload the file.' : 'Upload a URDF (or try the sample robot) to see it rendered here.'}
            </div>
          )}
          {urdfText && !hasFatalParseError && viewerLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/70">
              <div className="flex flex-col items-center gap-2">
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-neutral-700 border-t-blue-500" />
                <span className="text-xs font-medium text-neutral-300">Loading URDF…</span>
              </div>
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
          <SuggestionsPanel issues={suggestionIssues} missingMeshes={missingMeshes} />
        </div>
      </div>
    </div>
  );
}
