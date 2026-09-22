'use client';

import PatternGenerator from './PatternGenerator';
import RgbdAlignmentInfo from './RgbdAlignmentInfo';

export default function CameraCalibrationApp() {
  return (
    <div className="space-y-8">
      <PatternGenerator />
      <RgbdAlignmentInfo />
    </div>
  );
}
