import type { PatternConfig } from './types';

/** Physical size of the pattern itself (corners/circles), excluding the white margin. */
export function boardSizeMm(config: PatternConfig): { widthMm: number; heightMm: number } {
  if (config.type === 'checkerboard') {
    // `cols`/`rows` are internal corners (OpenCV's convention), so there's one more square
    // than corners in each direction.
    const squaresX = config.cols + 1;
    const squaresY = config.rows + 1;
    return { widthMm: squaresX * config.squareSizeMm, heightMm: squaresY * config.squareSizeMm };
  }
  const widthMm = (config.cols - 1) * config.squareSizeMm + config.circleDiameterMm;
  const heightMm = (config.rows - 1) * config.squareSizeMm + config.circleDiameterMm;
  return { widthMm, heightMm };
}

/** Total sheet size including the white margin — matches the SVG's own width/height. */
export function totalSizeMm(config: PatternConfig): { widthMm: number; heightMm: number } {
  const { widthMm, heightMm } = boardSizeMm(config);
  return { widthMm: widthMm + config.marginMm * 2, heightMm: heightMm + config.marginMm * 2 };
}

/**
 * Builds a print-accurate SVG: the root element's width/height are set in millimeters and the
 * viewBox spans the same numeric range, so 1 viewBox unit == 1mm. Printing/exporting at 100%
 * scale ("actual size", not "fit to page") reproduces the requested physical dimensions.
 */
export function buildSvgMarkup(config: PatternConfig): string {
  const { widthMm, heightMm } = boardSizeMm(config);
  const totalW = widthMm + config.marginMm * 2;
  const totalH = heightMm + config.marginMm * 2;

  let shapes = '';
  if (config.type === 'checkerboard') {
    const squaresX = config.cols + 1;
    const squaresY = config.rows + 1;
    for (let j = 0; j < squaresY; j++) {
      for (let i = 0; i < squaresX; i++) {
        if ((i + j) % 2 !== 0) continue; // alternate squares; the rest is the white background
        const x = config.marginMm + i * config.squareSizeMm;
        const y = config.marginMm + j * config.squareSizeMm;
        shapes += `<rect x="${x}" y="${y}" width="${config.squareSizeMm}" height="${config.squareSizeMm}" fill="#000"/>\n`;
      }
    }
  } else {
    const r = config.circleDiameterMm / 2;
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const cx = config.marginMm + r + col * config.squareSizeMm;
        const cy = config.marginMm + r + row * config.squareSizeMm;
        shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/>\n`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}mm" height="${totalH}mm" viewBox="0 0 ${totalW} ${totalH}">\n<rect x="0" y="0" width="${totalW}" height="${totalH}" fill="#fff"/>\n${shapes}</svg>`;
}
