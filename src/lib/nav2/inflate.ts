import type { OccupancyGrid } from './types';

export const LETHAL_OBSTACLE = 254;
export const INSCRIBED_INFLATED_OBSTACLE = 253;
export const FREE_SPACE = 0;

/**
 * Computes Nav2's inflation-layer cost grid for an occupancy grid, matching
 * nav2_costmap_2d/plugins/inflation_layer.cpp exactly:
 *
 *   computeCost(distanceCells):
 *     distance == 0                                -> LETHAL_OBSTACLE (254)
 *     distance*resolution <= inscribedRadius        -> INSCRIBED_INFLATED_OBSTACLE (253)
 *     else                                          -> round(252 * exp(-costScalingFactor *
 *                                                       (distance*resolution - inscribedRadius)))
 *
 * Distance is the Euclidean distance (in cells) to the nearest lethal (fully-occupied) cell,
 * found via a multi-source expansion from every lethal cell out to `inflationRadiusM`, mirroring
 * the real implementation's precomputed sorted-offset cache.
 */
export function computeInflatedCostmap(
  grid: OccupancyGrid,
  inscribedRadiusM: number,
  inflationRadiusM: number,
  costScalingFactor: number,
  inflateUnknown: boolean,
): Uint8Array {
  const { width, height, resolution, data } = grid;
  const n = width * height;
  const cost = new Uint8Array(n);
  if (resolution <= 0 || inflationRadiusM <= 0) return cost;

  const cellRadius = Math.max(0, Math.ceil(inflationRadiusM / resolution));

  const offsets: Array<{ dx: number; dy: number; dist: number }> = [];
  for (let dy = -cellRadius; dy <= cellRadius; dy++) {
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= cellRadius) offsets.push({ dx, dy, dist });
    }
  }
  offsets.sort((a, b) => a.dist - b.dist);

  const distGrid = new Float32Array(n).fill(Infinity);
  const seeds: number[] = [];
  for (let i = 0; i < n; i++) {
    const occ = data[i];
    if (occ === 100 || (inflateUnknown && occ === -1)) {
      distGrid[i] = 0;
      seeds.push(i);
    }
  }

  for (const seedIdx of seeds) {
    const sx = seedIdx % width;
    const sy = (seedIdx / width) | 0;
    for (const { dx, dy, dist } of offsets) {
      const tx = sx + dx;
      const ty = sy + dy;
      if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
      const tIdx = ty * width + tx;
      if (dist < distGrid[tIdx]) distGrid[tIdx] = dist;
    }
  }

  for (let i = 0; i < n; i++) {
    const distanceCells = distGrid[i];
    if (!Number.isFinite(distanceCells)) continue;
    if (distanceCells === 0) {
      cost[i] = LETHAL_OBSTACLE;
    } else if (distanceCells * resolution <= inscribedRadiusM) {
      cost[i] = INSCRIBED_INFLATED_OBSTACLE;
    } else {
      const factor = Math.exp(-1.0 * costScalingFactor * (distanceCells * resolution - inscribedRadiusM));
      cost[i] = Math.round((INSCRIBED_INFLATED_OBSTACLE - 1) * factor);
    }
  }

  return cost;
}
