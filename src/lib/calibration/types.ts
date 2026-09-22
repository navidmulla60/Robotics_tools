export type PatternType = 'checkerboard' | 'circlesSymmetric';

export interface PatternConfig {
  type: PatternType;
  /** Internal corners for a checkerboard (OpenCV's convention), or circle columns for a grid. */
  cols: number;
  /** Internal corners for a checkerboard, or circle rows for a grid. */
  rows: number;
  /** Checkerboard: edge length of one square, mm. Circle grid: spacing between circle centers, mm. */
  squareSizeMm: number;
  /** Circle grid only: circle diameter, mm. */
  circleDiameterMm: number;
  /** White margin around the pattern, mm — gives print/mounting tolerance and helps corner detection near the board edge. */
  marginMm: number;
}
