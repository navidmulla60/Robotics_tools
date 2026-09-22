'use client';

import { useCallback, useRef, useState } from 'react';
import type { CollectedFile } from '@/lib/urdf/types';
import { collectFromDataTransferItems, expandZips, fileList } from '@/lib/urdf/fileCollection';
import { SAMPLE_URDF, SAMPLE_URDF_NAME } from '@/lib/urdf/exampleRobot';

interface Props {
  onFiles: (files: CollectedFile[]) => void;
  onPasteText: (name: string, text: string) => void;
  busy: boolean;
}

export default function UrdfUploader({ onFiles, onPasteText, busy }: Props) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback(
    async (files: CollectedFile[]) => {
      const expanded = await expandZips(files);
      onFiles(expanded);
    },
    [onFiles],
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
      if (collected.length === 0) {
        collected = fileList(e.dataTransfer.files);
      }
      if (collected.length > 0) await ingest(collected);
    },
    [ingest],
  );

  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-3 py-2 text-sm font-medium ${mode === 'upload' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
        >
          Upload files
        </button>
        <button
          type="button"
          onClick={() => setMode('paste')}
          className={`px-3 py-2 text-sm font-medium ${mode === 'paste' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
        >
          Paste XML
        </button>
      </div>

      {mode === 'upload' ? (
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
            Drag &amp; drop a URDF folder, files, or a .zip here
          </p>
          <p className="mb-4 text-xs text-neutral-500">
            Include the .urdf (or .xacro) file together with its mesh files (.stl / .dae / .obj) so geometry resolves correctly.
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
            <button
              type="button"
              disabled={busy}
              onClick={() => onPasteText(SAMPLE_URDF_NAME, SAMPLE_URDF)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Try a sample robot
            </button>
          </div>
          <input
            ref={filesInputRef}
            type="file"
            multiple
            accept=".urdf,.xacro,.stl,.dae,.obj,.zip,.png,.jpg,.jpeg"
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
      ) : (
        <div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your URDF XML here..."
            rows={10}
            className="w-full rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          />
          <p className="mt-1 text-xs text-neutral-500">Mesh files referenced by filename won&apos;t be found this way &mdash; primitive geometry (box/cylinder/sphere) will still render.</p>
          <button
            type="button"
            disabled={!pasteText.trim() || busy}
            onClick={() => onPasteText('pasted.urdf', pasteText)}
            className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Visualize
          </button>
        </div>
      )}
    </div>
  );
}
