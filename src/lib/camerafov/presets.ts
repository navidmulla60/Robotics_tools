export interface SensorSize {
  widthMm: number;
  heightMm: number;
}

/** Common machine-vision / photography sensor optical formats and their standard imaging
 * area dimensions (width x height). These are the conventional industry values, not any one
 * vendor's exact silicon size (which varies slightly around them). */
export const SENSOR_PRESETS: Record<string, SensorSize> = {
  '1/4"': { widthMm: 3.6, heightMm: 2.7 },
  '1/3"': { widthMm: 4.8, heightMm: 3.6 },
  '1/2.5"': { widthMm: 5.76, heightMm: 4.29 },
  '1/2.3"': { widthMm: 6.17, heightMm: 4.55 },
  '1/2"': { widthMm: 6.4, heightMm: 4.8 },
  '1/1.8"': { widthMm: 7.18, heightMm: 5.32 },
  '2/3"': { widthMm: 8.8, heightMm: 6.6 },
  '1"': { widthMm: 13.2, heightMm: 8.8 },
  'Four Thirds': { widthMm: 17.3, heightMm: 13.0 },
  'APS-C': { widthMm: 23.5, heightMm: 15.6 },
  'Full Frame (35mm)': { widthMm: 36, heightMm: 24 },
};

export const DEFAULT_SENSOR_PRESET = '1/2.3"';
