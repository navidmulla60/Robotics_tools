'use client';

import { useState } from 'react';
import type { TfNode } from '@/lib/urdf/types';
import { countNodes, tfTreeToJson, tfTreeToText } from '@/lib/urdf/tfTree';

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TreeNode({ node, depth }: { node: TfNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-neutral-200 pl-3 dark:border-neutral-700' : ''}>
      <div className="flex items-center gap-1.5 py-0.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}
        {node.joint && (
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {node.joint.type}
          </span>
        )}
        <span className="font-mono text-sm text-neutral-800 dark:text-neutral-200">{node.link}</span>
        {node.joint && <span className="truncate text-xs text-neutral-400">via {node.joint.name}</span>}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={`${child.joint?.name ?? 'root'}-${child.link}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  tree: TfNode | null;
  robotName?: string;
}

export default function TfTreePanel({ tree, robotName }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!tree) {
    return <p className="text-sm text-neutral-500">Load a URDF to see its TF tree.</p>;
  }

  const baseName = (robotName || 'robot').replace(/[^a-z0-9_-]+/gi, '_');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <span className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}>{'▸'}</span>
          {expanded ? 'Hide' : 'Show'} TF tree ({countNodes(tree)} frames)
        </button>
        {expanded && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadText(`${baseName}_tf_tree.txt`, tfTreeToText(tree), 'text/plain')}
              className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Download .txt
            </button>
            <button
              type="button"
              onClick={() => downloadText(`${baseName}_tf_tree.json`, tfTreeToJson(tree), 'application/json')}
              className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Download .json
            </button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="mt-3 max-h-[28rem] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <TreeNode node={tree} depth={0} />
        </div>
      )}
    </div>
  );
}
