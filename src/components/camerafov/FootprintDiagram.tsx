interface Props {
  coverageWidthM: number;
  coverageHeightM: number;
}

const VIEW_W = 440;
const VIEW_H = 240;
const PAD = 30;

/** A to-scale rectangle showing what fits inside the frame at the working distance — the
 * imaged footprint, as if looking straight at the target plane. */
export default function FootprintDiagram({ coverageWidthM, coverageHeightM }: Props) {
  const availW = VIEW_W - PAD * 2;
  const availH = VIEW_H - PAD * 2;
  const safeW = Math.max(coverageWidthM, 1e-6);
  const safeH = Math.max(coverageHeightM, 1e-6);
  const scale = Math.min(availW / safeW, availH / safeH);

  const w = coverageWidthM * scale;
  const h = coverageHeightM * scale;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full">
      <rect x={x} y={y} width={w} height={h} fill="rgba(91,141,239,0.15)" stroke="#5b8def" strokeWidth={2} />
      <line x1={VIEW_W / 2} y1={y - 8} x2={VIEW_W / 2} y2={y} stroke="#525252" strokeWidth={1} />
      <line x1={x - 8} y1={VIEW_H / 2} x2={x} y2={VIEW_H / 2} stroke="#525252" strokeWidth={1} />

      <text x={VIEW_W / 2} y={y - 12} fill="#a3a3a3" fontSize={12} textAnchor="middle">
        {coverageWidthM.toFixed(2)} m
      </text>
      <text
        x={x - 12}
        y={VIEW_H / 2}
        fill="#a3a3a3"
        fontSize={12}
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(-90, ${x - 12}, ${VIEW_H / 2})`}
      >
        {coverageHeightM.toFixed(2)} m
      </text>
    </svg>
  );
}
