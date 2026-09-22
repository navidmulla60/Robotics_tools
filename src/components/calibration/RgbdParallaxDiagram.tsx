const VIEW_W = 480;
const VIEW_H = 280;

const DEPTH_X = 70;
const COLOR_X = 170;
const CAM_Y = 210;

const POINT_X = 380;
const POINT_Y = 70;

const PLANE_Y = 190;

function lineAt(fromX: number, fromY: number, toX: number, toY: number, atY: number) {
  const t = (atY - fromY) / (toY - fromY);
  return fromX + t * (toX - fromX);
}

/** A schematic top-down illustration of why a depth (IR) imager and a color imager mounted a
 * few centimeters apart see the same physical point at different pixel locations, until the
 * depth frame is reprojected into the color camera's viewpoint. Not to any particular camera's
 * real scale — illustrative only. */
export default function RgbdParallaxDiagram() {
  const depthPlaneX = lineAt(DEPTH_X, CAM_Y, POINT_X, POINT_Y, PLANE_Y);
  const colorPlaneX = lineAt(COLOR_X, CAM_Y, POINT_X, POINT_Y, PLANE_Y);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full">
      {/* image planes */}
      <line x1={20} y1={PLANE_Y} x2={VIEW_W - 20} y2={PLANE_Y} stroke="#404040" strokeWidth={1} strokeDasharray="3 4" />
      <text x={VIEW_W - 22} y={PLANE_Y - 6} fill="#737373" fontSize={10} textAnchor="end">
        image plane
      </text>

      {/* rays */}
      <line x1={DEPTH_X} y1={CAM_Y} x2={POINT_X} y2={POINT_Y} stroke="#5b8def" strokeWidth={1.5} />
      <line x1={COLOR_X} y1={CAM_Y} x2={POINT_X} y2={POINT_Y} stroke="#f59e0b" strokeWidth={1.5} />

      {/* projected pixel markers */}
      <circle cx={depthPlaneX} cy={PLANE_Y} r={4} fill="#5b8def" />
      <circle cx={colorPlaneX} cy={PLANE_Y} r={4} fill="#f59e0b" />
      <line x1={depthPlaneX} y1={PLANE_Y + 10} x2={depthPlaneX} y2={PLANE_Y + 24} stroke="#5b8def" strokeWidth={1} />
      <text x={depthPlaneX} y={PLANE_Y + 36} fill="#93c5fd" fontSize={10} textAnchor="middle">
        depth pixel
      </text>
      <line x1={colorPlaneX} y1={PLANE_Y + 10} x2={colorPlaneX} y2={PLANE_Y + 24} stroke="#f59e0b" strokeWidth={1} />
      <text x={colorPlaneX} y={PLANE_Y + 36} fill="#fbbf24" fontSize={10} textAnchor="middle">
        color pixel
      </text>

      {/* the shared physical point */}
      <circle cx={POINT_X} cy={POINT_Y} r={5} fill="#4ade80" />
      <text x={POINT_X + 10} y={POINT_Y + 4} fill="#86efac" fontSize={11}>
        same physical point
      </text>

      {/* cameras */}
      <rect x={DEPTH_X - 10} y={CAM_Y - 8} width={20} height={16} rx={2} fill="#3b3b3b" stroke="#5b8def" strokeWidth={1.5} />
      <text x={DEPTH_X} y={CAM_Y + 26} fill="#93c5fd" fontSize={11} textAnchor="middle">
        Depth (IR)
      </text>
      <rect x={COLOR_X - 10} y={CAM_Y - 8} width={20} height={16} rx={2} fill="#3b3b3b" stroke="#f59e0b" strokeWidth={1.5} />
      <text x={COLOR_X} y={CAM_Y + 26} fill="#fbbf24" fontSize={11} textAnchor="middle">
        Color
      </text>

      {/* baseline */}
      <line x1={DEPTH_X} y1={CAM_Y + 14} x2={COLOR_X} y2={CAM_Y + 14} stroke="#525252" strokeWidth={1} />
      <text x={(DEPTH_X + COLOR_X) / 2} y={CAM_Y + 42} fill="#737373" fontSize={10} textAnchor="middle">
        baseline (extrinsic offset)
      </text>
    </svg>
  );
}
