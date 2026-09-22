/** Diagonal of a full 35mm ("full frame") sensor, in mm: sqrt(36^2 + 24^2). Used for the
 * conventional "35mm equivalent focal length" figure. */
const FULL_FRAME_DIAGONAL_MM = Math.sqrt(36 * 36 + 24 * 24);

export interface FovResult {
  hFovDeg: number;
  vFovDeg: number;
  dFovDeg: number;
  /** Coverage of the imaged area at the given working distance, in meters. */
  coverageWidthM: number;
  coverageHeightM: number;
  coverageDiagonalM: number;
  equivalentFocalLengthMm: number;
  /** Ground sample distance (size of one pixel at the working distance), in mm/px — null if
   * image resolution wasn't provided. */
  gsdWidthMmPerPx: number | null;
  gsdHeightMmPerPx: number | null;
}

/** Full angle of view for a sensor dimension and focal length: 2*atan(d / (2f)). */
export function fovDeg(sensorDimMm: number, focalLengthMm: number): number {
  if (focalLengthMm <= 0) return 0;
  return (2 * Math.atan(sensorDimMm / (2 * focalLengthMm)) * 180) / Math.PI;
}

/** Linear coverage (in the same unit as `distance`) imaged across a sensor dimension at a
 * given working distance, via similar triangles: coverage/distance = sensorDim/focalLength. */
export function coverageAtDistance(sensorDimMm: number, focalLengthMm: number, distance: number): number {
  if (focalLengthMm <= 0) return 0;
  return (distance * sensorDimMm) / focalLengthMm;
}

export function computeFov(
  sensorWidthMm: number,
  sensorHeightMm: number,
  focalLengthMm: number,
  distanceM: number,
  imageWidthPx: number | null,
  imageHeightPx: number | null,
): FovResult {
  const diagonalMm = Math.sqrt(sensorWidthMm * sensorWidthMm + sensorHeightMm * sensorHeightMm);
  const coverageWidthM = coverageAtDistance(sensorWidthMm, focalLengthMm, distanceM);
  const coverageHeightM = coverageAtDistance(sensorHeightMm, focalLengthMm, distanceM);

  return {
    hFovDeg: fovDeg(sensorWidthMm, focalLengthMm),
    vFovDeg: fovDeg(sensorHeightMm, focalLengthMm),
    dFovDeg: fovDeg(diagonalMm, focalLengthMm),
    coverageWidthM,
    coverageHeightM,
    coverageDiagonalM: Math.sqrt(coverageWidthM * coverageWidthM + coverageHeightM * coverageHeightM),
    equivalentFocalLengthMm: diagonalMm > 0 ? (focalLengthMm * FULL_FRAME_DIAGONAL_MM) / diagonalMm : 0,
    gsdWidthMmPerPx: imageWidthPx && imageWidthPx > 0 ? (coverageWidthM * 1000) / imageWidthPx : null,
    gsdHeightMmPerPx: imageHeightPx && imageHeightPx > 0 ? (coverageHeightM * 1000) / imageHeightPx : null,
  };
}
