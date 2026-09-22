'use client';

import type { DHRow, JointType } from '@/lib/dh/types';

interface Props {
  rows: DHRow[];
  onChange: (rows: DHRow[]) => void;
}

function Cell({
  value,
  onChange,
  step = 0.01,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isNaN(v) ? 0 : v);
      }}
      className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    />
  );
}

export default function DhTable({ rows, onChange }: Props) {
  const update = (id: string, patch: Partial<DHRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));

  const addRow = () => {
    const n = rows.length + 1;
    onChange([
      ...rows,
      {
        id: `dh-custom-${Date.now()}-${n}`,
        name: `Joint ${n}`,
        jointType: 'revolute' as JointType,
        a: 0,
        alphaDeg: 0,
        d: 0,
        thetaDeg: 0,
      },
    ]);
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">DH parameters</h2>
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          + Add link
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-x-2 border-spacing-y-1.5">
          <thead>
            <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <th className="w-32">Name</th>
              <th className="w-24">Type</th>
              <th>a (m)</th>
              <th>&alpha; (deg)</th>
              <th>d (m)</th>
              <th>&theta; (deg)</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => update(row.id, { name: e.target.value })}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </td>
                <td>
                  <select
                    value={row.jointType}
                    onChange={(e) => update(row.id, { jointType: e.target.value as JointType })}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value="revolute">Revolute</option>
                    <option value="prismatic">Prismatic</option>
                  </select>
                </td>
                <td>
                  <Cell value={row.a} onChange={(v) => update(row.id, { a: v })} />
                </td>
                <td>
                  <Cell value={row.alphaDeg} onChange={(v) => update(row.id, { alphaDeg: v })} step={1} />
                </td>
                <td>
                  <Cell value={row.d} onChange={(v) => update(row.id, { d: v })} />
                </td>
                <td>
                  <Cell value={row.thetaDeg} onChange={(v) => update(row.id, { thetaDeg: v })} step={1} />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    title="Remove link"
                    className="rounded-md px-1.5 py-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-4 text-center text-sm text-neutral-500">No links yet — add one above.</p>}
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Standard DH convention: T<sub>i</sub> = Rot<sub>z</sub>(&theta;) &middot; Trans<sub>z</sub>(d) &middot; Trans<sub>x</sub>(a) &middot;
        Rot<sub>x</sub>(&alpha;). For a revolute joint &theta; is the joint variable; for a prismatic joint d is.
      </p>
    </div>
  );
}
