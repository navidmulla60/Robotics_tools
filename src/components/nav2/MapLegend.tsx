import { costToColor, LETHAL_OBSTACLE, INSCRIBED_INFLATED_OBSTACLE } from '@/lib/nav2/inflate';

function rgba([r, g, b, a]: [number, number, number, number]): string {
  // Blend the (possibly translucent) cost color over the canvas's dark background, matching
  // how it actually looks composited on the map rather than showing it floating on white.
  const base = { r: 10, g: 10, b: 10 };
  const alpha = a / 255;
  const br = Math.round(r * alpha + base.r * (1 - alpha));
  const bg = Math.round(g * alpha + base.g * (1 - alpha));
  const bb = Math.round(b * alpha + base.b * (1 - alpha));
  return `rgb(${br}, ${bg}, ${bb})`;
}

/** Explains what every color on the map canvas means — the base occupancy shading, and the
 * inflation cost heat-map gradient (with the two special "always a collision" cost levels
 * called out), so it's legible to someone who hasn't used a costmap tool before. */
export default function MapLegend() {
  const gradientStops = Array.from({ length: 21 }, (_, i) => {
    const cost = Math.round((i / 20) * (INSCRIBED_INFLATED_OBSTACLE - 1));
    return `${rgba(costToColor(cost))} ${(i / 20) * 100}%`;
  }).join(', ');

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <p className="mb-1.5 font-medium text-neutral-600 dark:text-neutral-400">Base map</p>
        <div className="flex flex-wrap items-center gap-3 text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-neutral-400 bg-white" /> free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-black" /> occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-neutral-400" /> unknown (unexplored)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-green-500" /> robot footprint (test point)
          </span>
        </div>
      </div>

      <div>
        <p className="mb-1.5 font-medium text-neutral-600 dark:text-neutral-400">Inflation cost (overlaid on the map)</p>
        <div className="h-3 w-full rounded-sm" style={{ background: `linear-gradient(to right, ${gradientStops})` }} />
        <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
          <span>0 — no effect on planning</span>
          <span>253 — inscribed</span>
          <span>254 — lethal</span>
        </div>
        <p className="mt-2 text-neutral-500">
          Cost rises the closer a cell is to an obstacle. <span className="font-medium">Lethal</span> (
          {LETHAL_OBSTACLE}, solid red) means the robot&apos;s reference point being here guarantees a collision.{' '}
          <span className="font-medium">Inscribed</span> ({INSCRIBED_INFLATED_OBSTACLE}, red-orange) means the robot&apos;s own body
          would touch the obstacle even though its reference point hasn&apos;t reached it yet — this band&apos;s width is set by the
          footprint size. Below that, the blue→yellow gradient is cost decaying with distance out to{' '}
          <span className="font-mono">inflation_radius</span>; beyond it, cost is 0 and the layer has no effect.
        </p>
      </div>
    </div>
  );
}
