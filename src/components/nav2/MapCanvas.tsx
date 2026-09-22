'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { OccupancyGrid, RobotFootprint } from '@/lib/nav2/types';
import { LETHAL_OBSTACLE, INSCRIBED_INFLATED_OBSTACLE } from '@/lib/nav2/inflate';
import { computeExploredBounds } from '@/lib/nav2/mapParser';

interface Props {
  grid: OccupancyGrid;
  inflationCost: Uint8Array | null;
  showInflation: boolean;
  footprint: RobotFootprint;
  testPoint: { xM: number; yM: number };
  onTestPointChange: (p: { xM: number; yM: number }) => void;
}

/** RViz-style costmap heat colormap: transparent at 0, through blue/cyan/yellow/orange, to
 * red at LETHAL_OBSTACLE. */
function costToColor(cost: number): [number, number, number, number] {
  if (cost === 0) return [0, 0, 0, 0];
  if (cost >= LETHAL_OBSTACLE) return [255, 0, 0, 230];
  if (cost >= INSCRIBED_INFLATED_OBSTACLE) return [255, 60, 0, 210];
  const t = cost / (INSCRIBED_INFLATED_OBSTACLE - 1); // 0..1
  // blue -> cyan -> yellow -> orange
  const stops: Array<[number, [number, number, number]]> = [
    [0, [30, 30, 140]],
    [0.35, [30, 160, 220]],
    [0.7, [250, 220, 40]],
    [1, [255, 120, 20]],
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const f = (t - lo[0]) / span;
  const r = lo[1][0] + (hi[1][0] - lo[1][0]) * f;
  const g = lo[1][1] + (hi[1][1] - lo[1][1]) * f;
  const b = lo[1][2] + (hi[1][2] - lo[1][2]) * f;
  const alpha = 60 + t * 140;
  return [r, g, b, alpha];
}

export default function MapCanvas({ grid, inflationCost, showInflation, footprint, testPoint, onTestPointChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState({ scale: 1, offsetX: 0, offsetY: 0, sx: 0, sy: 0 });

  // Only depends on the grid itself (not the frequently-changing inflation/footprint props),
  // so a slider drag doesn't re-scan the whole grid on every tick.
  const exploredBounds = useMemo(() => computeExploredBounds(grid), [grid]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const off = document.createElement('canvas');
    off.width = grid.width;
    off.height = grid.height;
    const offCtx = off.getContext('2d');
    if (!offCtx) return;
    const imageData = offCtx.createImageData(grid.width, grid.height);
    const pixels = imageData.data;

    for (let row = 0; row < grid.height; row++) {
      // imageData row 0 is the top of the display; grid row 0 is the bottom of the map.
      const gridRow = grid.height - 1 - row;
      for (let col = 0; col < grid.width; col++) {
        const gridIdx = gridRow * grid.width + col;
        const occ = grid.data[gridIdx];
        let r: number, g: number, b: number;
        const a = 255;
        if (occ === -1) {
          r = g = b = 180; // unknown: mid gray
        } else {
          const shade = 255 - Math.round((occ / 100) * 255);
          r = g = b = shade; // 0 (free) -> white, 100 (occupied) -> black
        }

        if (showInflation && inflationCost) {
          const cost = inflationCost[gridIdx];
          const [cr, cg, cb, ca] = costToColor(cost);
          if (ca > 0) {
            const alpha = ca / 255;
            r = Math.round(cr * alpha + r * (1 - alpha));
            g = Math.round(cg * alpha + g * (1 - alpha));
            b = Math.round(cb * alpha + b * (1 - alpha));
          }
        }

        const pIdx = (row * grid.width + col) * 4;
        pixels[pIdx] = r;
        pixels[pIdx + 1] = g;
        pixels[pIdx + 2] = b;
        pixels[pIdx + 3] = a;
      }
    }
    offCtx.putImageData(imageData, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    if (containerW === 0 || containerH === 0) return;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = `${containerW}px`;
    canvas.style.height = `${containerH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    // A distinct dark blue-gray for the letterbox area outside the map, so it can't be
    // mistaken for occupied (pure black) cells when the map's aspect ratio doesn't match the
    // container's.
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, containerW, containerH);

    // Fit the view to the explored (non-unknown) region rather than the full declared map —
    // many real maps declare a much larger canvas than what's actually been explored, which
    // otherwise renders as a speck in a huge unknown field. Falls back to the full grid if
    // nothing is explored.
    const bounds = exploredBounds;
    let sx = 0;
    let sy = 0;
    let sw = grid.width;
    let sh = grid.height;
    if (bounds) {
      const rowTopMin = grid.height - 1 - bounds.maxRow;
      const rowTopMax = grid.height - 1 - bounds.minRow;
      const boxW = bounds.maxCol - bounds.minCol + 1;
      const boxH = rowTopMax - rowTopMin + 1;
      const pad = Math.ceil(Math.max(boxW, boxH) * 0.12) + 4;
      sx = Math.max(0, bounds.minCol - pad);
      sy = Math.max(0, rowTopMin - pad);
      const exEnd = Math.min(grid.width, bounds.maxCol + pad + 1);
      const eyEnd = Math.min(grid.height, rowTopMax + pad + 1);
      sw = exEnd - sx;
      sh = eyEnd - sy;
    }

    const scale = Math.min(containerW / sw, containerH / sh);
    const drawW = sw * scale;
    const drawH = sh * scale;
    const offsetX = (containerW - drawW) / 2;
    const offsetY = (containerH - drawH) / 2;
    ctx.drawImage(off, sx, sy, sw, sh, offsetX, offsetY, drawW, drawH);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, drawW - 1, drawH - 1);
    setLayout({ scale, offsetX, offsetY, sx, sy });

    // Robot footprint at the test point (world meters -> display pixels).
    const metersPerCellX = grid.resolution;
    const originX = grid.origin[0];
    const originY = grid.origin[1];
    const cellX = (testPoint.xM - originX) / metersPerCellX;
    const cellYFromBottom = (testPoint.yM - originY) / metersPerCellX;
    const cellYFromTop = grid.height - cellYFromBottom;
    const px = offsetX + (cellX - sx) * scale;
    const py = offsetY + (cellYFromTop - sy) * scale;

    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = 'rgba(34,197,94,0.15)';
    ctx.lineWidth = 2;
    if (footprint.type === 'circular') {
      const rPx = (footprint.radiusM / metersPerCellX) * scale;
      ctx.beginPath();
      ctx.arc(px, py, rPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      const wPx = (footprint.sideAM / metersPerCellX) * scale;
      const hPx = (footprint.sideBM / metersPerCellX) * scale;
      ctx.beginPath();
      ctx.rect(px - wPx / 2, py - hPx / 2, wPx, hPx);
      ctx.fill();
      ctx.stroke();
    }
    // Heading tick so orientation is visible for the rectangular footprint.
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.min(20, scale * 3), py);
    ctx.stroke();
    ctx.restore();
  }, [grid, exploredBounds, inflationCost, showInflation, footprint, testPoint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resize = () => {
      // Trigger the main effect's layout recompute by forcing a no-op state update on resize.
      setLayout((l) => ({ ...l }));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const { scale, offsetX, offsetY, sx, sy } = layout;
    if (scale <= 0) return;
    const cellX = (clickX - offsetX) / scale + sx;
    const cellYFromTop = (clickY - offsetY) / scale + sy;
    const cellYFromBottom = grid.height - cellYFromTop;
    const xM = grid.origin[0] + cellX * grid.resolution;
    const yM = grid.origin[1] + cellYFromBottom * grid.resolution;
    onTestPointChange({ xM, yM });
  };

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} onClick={handleClick} className="h-full w-full cursor-crosshair" />
    </div>
  );
}
