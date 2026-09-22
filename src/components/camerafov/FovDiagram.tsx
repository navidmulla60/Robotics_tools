interface Props {
  distanceM: number;
  coverageWidthM: number;
  hFovDeg: number;
}

const VIEW_W = 440;
const VIEW_H = 240;
const APEX_X = 24;
const APEX_Y = VIEW_H / 2;
const MAX_X_PX = VIEW_W - APEX_X - 16;
const MAX_Y_PX = APEX_Y - 20;

/** A to-scale bird's-eye view of the camera's horizontal field of view: the apex is the
 * camera, the two rays are the edges of the frame, and the bar at the far end is the imaged
 * width at the working distance. Scaled to always fit the viewBox regardless of how wide or
 * narrow the FOV or distance is. */
export default function FovDiagram({ distanceM, coverageWidthM, hFovDeg }: Props) {
  const safeDistance = Math.max(distanceM, 1e-6);
  const safeHalfWidth = Math.max(coverageWidthM / 2, 1e-6);
  const scale = Math.min(MAX_X_PX / safeDistance, MAX_Y_PX / safeHalfWidth);

  const endX = APEX_X + distanceM * scale;
  const halfWidthPx = (coverageWidthM / 2) * scale;
  const topY = APEX_Y - halfWidthPx;
  const botY = APEX_Y + halfWidthPx;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full">
      <line x1={APEX_X} y1={APEX_Y} x2={endX} y2={APEX_Y} stroke="#525252" strokeDasharray="4 4" strokeWidth={1} />
      <line x1={APEX_X} y1={APEX_Y} x2={endX} y2={topY} stroke="#5b8def" strokeWidth={2} />
      <line x1={APEX_X} y1={APEX_Y} x2={endX} y2={botY} stroke="#5b8def" strokeWidth={2} />
      <line x1={endX} y1={topY} x2={endX} y2={botY} stroke="#22c55e" strokeWidth={2.5} />
      <line x1={endX - 6} y1={topY} x2={endX + 6} y2={topY} stroke="#22c55e" strokeWidth={2} />
      <line x1={endX - 6} y1={botY} x2={endX + 6} y2={botY} stroke="#22c55e" strokeWidth={2} />
      <circle cx={APEX_X} cy={APEX_Y} r={4} fill="#e5e5e5" />

      <text x={APEX_X + 6} y={APEX_Y - 8} fill="#a3a3a3" fontSize={12}>
        {hFovDeg.toFixed(1)}&deg;
      </text>
      <text x={(APEX_X + endX) / 2} y={APEX_Y - 8} fill="#737373" fontSize={11} textAnchor="middle">
        {distanceM.toFixed(2)} m
      </text>
      <text x={endX + 10} y={APEX_Y} fill="#4ade80" fontSize={12} dominantBaseline="middle">
        {coverageWidthM.toFixed(2)} m
      </text>
    </svg>
  );
}
