import type { OccupancyGrid } from './types';

/** A small synthetic map (a room with an interior wall and a couple of obstacles) so the tool
 * is usable immediately without requiring a real SLAM map upload. */
export function generateSampleMap(): OccupancyGrid {
  const width = 160;
  const height = 120;
  const resolution = 0.05; // 8m x 6m room
  const data = new Int16Array(width * height).fill(0);

  const setCell = (x: number, y: number, value: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    data[y * width + x] = value;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, value: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setCell(x, y, value);
  };

  // Outer walls.
  rect(0, 0, width - 1, 1, 100);
  rect(0, height - 2, width - 1, height - 1, 100);
  rect(0, 0, 1, height - 1, 100);
  rect(width - 2, 0, width - 1, height - 1, 100);

  // An interior dividing wall with a doorway gap.
  rect(70, 10, 72, 50, 100);
  rect(70, 60, 72, height - 10, 100);

  // A couple of freestanding obstacles (furniture/pillars).
  rect(30, 30, 40, 40, 100);
  rect(100, 70, 115, 80, 100);
  rect(110, 20, 118, 28, 100);

  // A patch of unknown/unexplored space near a corner.
  rect(width - 25, 10, width - 3, 35, -1);

  return { width, height, resolution, origin: [0, 0, 0], data };
}
