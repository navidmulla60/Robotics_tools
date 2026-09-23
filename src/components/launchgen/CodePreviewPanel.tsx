'use client';

import { useState } from 'react';
import { tokenizeLine, TOKEN_COLORS } from '@/lib/launchgen/pythonHighlight';

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
      className="rounded-md border border-neutral-600 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function HighlightedCode({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="min-h-[1.25rem]">
          {line.length === 0
            ? ' '
            : tokenizeLine(line).map((tok, j) => (
                <span key={j} style={{ color: TOKEN_COLORS[tok.type] }}>
                  {tok.text}
                </span>
              ))}
        </div>
      ))}
    </>
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
    <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-700" style={{ backgroundColor: '#1e1e1e' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-700 px-3 py-2" style={{ backgroundColor: '#252526' }}>
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
        <div className="flex flex-wrap gap-2">
          <CopyButton getText={() => code} />
          <button type="button" onClick={() => downloadText(code, filename)} className="rounded-md border border-neutral-600 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-800">
            Download
          </button>
          <button type="button" onClick={() => void downloadZip()} className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700">
            Download both (.zip)
          </button>
        </div>
      </div>
      <div className="max-h-[40rem] min-w-0 overflow-auto">
        <pre className="w-max min-w-full p-4 text-xs leading-relaxed">
          <code className="block font-mono">
            <HighlightedCode code={code} />
          </code>
        </pre>
      </div>
    </div>
  );
}
