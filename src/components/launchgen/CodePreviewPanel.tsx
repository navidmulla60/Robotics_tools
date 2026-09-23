'use client';

import { useState } from 'react';

interface Props {
  bringupCode: string;
  controllerCode: string;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CopyButton({ getText }: { getText: () => string }) {
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
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function CodePreviewPanel({ bringupCode, controllerCode }: Props) {
  const [tab, setTab] = useState<'bringup' | 'controller'>('bringup');
  const code = tab === 'bringup' ? bringupCode : controllerCode;
  const filename = tab === 'bringup' ? 'bringup.launch.py' : 'controller.launch.py';

  const downloadZip = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('bringup.launch.py', bringupCode);
    zip.file('controller.launch.py', controllerCode);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'launch_files.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        <div className="flex overflow-hidden rounded-md border border-neutral-700 text-xs">
          <button
            type="button"
            onClick={() => setTab('bringup')}
            className={`px-2.5 py-1 font-mono font-medium ${tab === 'bringup' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}
          >
            bringup.launch.py
          </button>
          <button
            type="button"
            onClick={() => setTab('controller')}
            className={`px-2.5 py-1 font-mono font-medium ${tab === 'controller' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}
          >
            controller.launch.py
          </button>
        </div>
        <div className="flex gap-2">
          <CopyButton getText={() => code} />
          <button
            type="button"
            onClick={() => downloadText(code, filename)}
            className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
          >
            Download
          </button>
          <button type="button" onClick={() => void downloadZip()} className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700">
            Download both (.zip)
          </button>
        </div>
      </div>
      <pre className="max-h-[40rem] overflow-auto p-4 text-xs leading-relaxed text-neutral-200">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
