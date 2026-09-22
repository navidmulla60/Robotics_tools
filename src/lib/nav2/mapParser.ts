import type { MapYaml, OccupancyGrid } from './types';

export interface GrayscaleImage {
  width: number;
  height: number;
  /** Row-major, top-to-bottom, one byte per pixel, 0-255. */
  data: Uint8Array;
}

/**
 * Parses a PGM (P2 ASCII or P5 binary) grayscale image — the classic ROS map_server format.
 * Comments (`#...` to end of line) are allowed between whitespace-separated header tokens,
 * per the NetPBM spec.
 */
export function parsePgm(buffer: ArrayBuffer): GrayscaleImage {
  const bytes = new Uint8Array(buffer);

  let pos = 0;
  const readToken = (): string => {
    // Skip whitespace and comments.
    for (;;) {
      while (pos < bytes.length && isWhitespace(bytes[pos])) pos++;
      if (bytes[pos] === 0x23 /* '#' */) {
        while (pos < bytes.length && bytes[pos] !== 0x0a) pos++;
        continue;
      }
      break;
    }
    const start = pos;
    while (pos < bytes.length && !isWhitespace(bytes[pos])) pos++;
    return String.fromCharCode(...bytes.subarray(start, pos));
  };

  const magic = readToken();
  if (magic !== 'P2' && magic !== 'P5') {
    throw new Error(`Not a PGM file (expected P2 or P5 magic number, got "${magic}")`);
  }
  const width = parseInt(readToken(), 10);
  const height = parseInt(readToken(), 10);
  const maxval = parseInt(readToken(), 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid PGM header dimensions');
  }

  const data = new Uint8Array(width * height);
  const scale = maxval > 0 ? 255 / maxval : 1;

  if (magic === 'P5') {
    // Exactly one whitespace byte separates the header from binary data.
    pos += 1;
    for (let i = 0; i < width * height; i++) {
      data[i] = Math.round((bytes[pos + i] ?? 0) * scale);
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      data[i] = Math.round(parseInt(readToken(), 10) * scale);
    }
  }

  return { width, height, data };
}

function isWhitespace(byte: number): boolean {
  return byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d;
}

/** Decodes any browser-supported raster image (PNG, BMP, etc.) to grayscale by averaging the
 * RGB channels, matching map_server's "average over all channels" rule. */
export async function decodeRasterImageToGrayscale(blob: Blob): Promise<GrayscaleImage> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0);
    const { data: rgba } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gray = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = Math.round((rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2]) / 3);
    }
    return { width: canvas.width, height: canvas.height, data: gray };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * A minimal parser for ROS map .yaml files — these are always a flat set of `key: value`
 * lines plus one `origin: [x, y, yaw]` array, never deeply nested, so a small targeted parser
 * is more predictable here than pulling in a general YAML library.
 */
export function parseMapYaml(text: string): MapYaml {
  const result: Partial<MapYaml> = { mode: 'trinary', negate: 0 };
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    switch (key) {
      case 'image':
        result.image = value.replace(/^['"]|['"]$/g, '');
        break;
      case 'resolution':
        result.resolution = parseFloat(value);
        break;
      case 'origin': {
        const nums = value
          .replace(/[[\]]/g, '')
          .split(',')
          .map((s) => parseFloat(s.trim()));
        result.origin = [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0];
        break;
      }
      case 'negate':
        result.negate = parseInt(value, 10) === 1 ? 1 : 0;
        break;
      case 'occupied_thresh':
        result.occupied_thresh = parseFloat(value);
        break;
      case 'free_thresh':
        result.free_thresh = parseFloat(value);
        break;
      case 'mode':
        if (value === 'trinary' || value === 'scale' || value === 'raw') result.mode = value;
        break;
      default:
        break;
    }
  }

  if (!result.image || result.resolution === undefined || result.occupied_thresh === undefined || result.free_thresh === undefined) {
    throw new Error('map.yaml is missing required fields (image, resolution, occupied_thresh, free_thresh)');
  }
  return {
    image: result.image,
    resolution: result.resolution,
    origin: result.origin ?? [0, 0, 0],
    negate: result.negate ?? 0,
    occupied_thresh: result.occupied_thresh,
    free_thresh: result.free_thresh,
    mode: result.mode ?? 'trinary',
  };
}

/**
 * Converts a decoded grayscale image into an occupancy grid, following map_server's exact
 * algorithm (nav2_map_server/src/map_io.cpp loadMapFromFile): normalize to [0,1], invert
 * unless `negate`, then threshold (trinary/scale) or pass through directly (raw). The image is
 * stored top-to-bottom but OccupancyGrid row 0 is the map's bottom row, so rows are flipped.
 */
export function imageToOccupancyGrid(image: GrayscaleImage, yaml: MapYaml): OccupancyGrid {
  const { width, height } = image;
  const data = new Int16Array(width * height);

  for (let row = 0; row < height; row++) {
    const srcRow = height - 1 - row; // flip: image row 0 (top) -> grid's last row
    for (let col = 0; col < width; col++) {
      const p = image.data[srcRow * width + col];
      let normalized = p / 255.0;
      if (!yaml.negate) normalized = 1.0 - normalized;

      const dstIdx = row * width + col;
      if (yaml.mode === 'raw') {
        data[dstIdx] = Math.max(-1, Math.min(100, Math.round(normalized * 255) - 1));
        continue;
      }

      if (normalized >= yaml.occupied_thresh) {
        data[dstIdx] = 100;
      } else if (normalized <= yaml.free_thresh) {
        data[dstIdx] = 0;
      } else if (yaml.mode === 'scale') {
        data[dstIdx] = Math.round(((normalized - yaml.free_thresh) / (yaml.occupied_thresh - yaml.free_thresh)) * 100);
      } else {
        data[dstIdx] = -1; // trinary: unknown
      }
    }
  }

  return { width, height, resolution: yaml.resolution, origin: yaml.origin, data };
}

export interface GridStats {
  freePct: number;
  occupiedPct: number;
  unknownPct: number;
}

/** Free/occupied/unknown cell breakdown — used to warn when a map looks like its
 * occupied_thresh/free_thresh/negate don't suit the source image (e.g. almost everything
 * landed in one bucket, which usually means a threshold/negate mismatch rather than a real
 * map that's genuinely that sparse). */
export function computeGridStats(grid: OccupancyGrid): GridStats {
  let free = 0;
  let occupied = 0;
  let unknown = 0;
  for (let i = 0; i < grid.data.length; i++) {
    const v = grid.data[i];
    if (v === -1) unknown++;
    else if (v >= 65) occupied++;
    else free++;
  }
  const total = grid.data.length || 1;
  return { freePct: (free / total) * 100, occupiedPct: (occupied / total) * 100, unknownPct: (unknown / total) * 100 };
}

export interface CellBounds {
  minCol: number;
  maxCol: number;
  /** Grid-space rows (row 0 = bottom of map, matching OccupancyGrid's own convention). */
  minRow: number;
  maxRow: number;
}

/**
 * Bounding box (in grid cells) of every non-unknown cell — the "explored" region. Many real
 * maps declare a much larger canvas than what's actually been explored (SLAM maps especially),
 * so fitting the view to this box instead of the full grid keeps small explored areas legible
 * instead of rendering as a speck in a huge unknown field. Returns null if nothing is explored.
 */
export function computeExploredBounds(grid: OccupancyGrid): CellBounds | null {
  let minCol = Infinity;
  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      if (grid.data[row * grid.width + col] === -1) continue;
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
      if (row < minRow) minRow = row;
      if (row > maxRow) maxRow = row;
    }
  }
  if (!Number.isFinite(minCol)) return null;
  return { minCol, maxCol, minRow, maxRow };
}
