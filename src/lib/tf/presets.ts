import type { FrameDef } from './types';

/**
 * Frame ids here are static string literals, not generated at call time (e.g. from
 * `Date.now()`). These presets seed a `useState` initializer, which runs during SSR *and*
 * again during client hydration — a non-deterministic id would differ between the two,
 * causing a hydration mismatch that corrupts every <select> bound to a frame id on the page.
 */
export const PRESETS: Record<string, () => FrameDef[]> = {
  'Mobile robot with sensors': () => [
    { id: 'base_link', name: 'base_link', parentId: null, x: 0, y: 0, z: 0.1, rollDeg: 0, pitchDeg: 0, yawDeg: 0 },
    { id: 'lidar_link', name: 'lidar_link', parentId: 'base_link', x: 0.1, y: 0, z: 0.2, rollDeg: 0, pitchDeg: 0, yawDeg: 0 },
    { id: 'camera_link', name: 'camera_link', parentId: 'base_link', x: 0.2, y: 0, z: 0.15, rollDeg: 0, pitchDeg: 0, yawDeg: 0 },
    // ROS optical-frame convention (REP 103): camera_link -> camera_optical_frame is a fixed
    // roll=-90, yaw=-90 to go from ROS's x-forward/z-up to the optical z-forward/y-down axes.
    {
      id: 'camera_optical_frame',
      name: 'camera_optical_frame',
      parentId: 'camera_link',
      x: 0,
      y: 0,
      z: 0,
      rollDeg: -90,
      pitchDeg: 0,
      yawDeg: -90,
    },
  ],
  '2-link arm on a table': () => [
    { id: 'shoulder_link', name: 'shoulder_link', parentId: null, x: 0, y: 0, z: 0.5, rollDeg: 0, pitchDeg: 0, yawDeg: 0 },
    { id: 'elbow_link', name: 'elbow_link', parentId: 'shoulder_link', x: 0.4, y: 0, z: 0, rollDeg: 0, pitchDeg: 0, yawDeg: 30 },
    { id: 'wrist_link', name: 'wrist_link', parentId: 'elbow_link', x: 0.3, y: 0, z: 0, rollDeg: 0, pitchDeg: 0, yawDeg: -20 },
  ],
};

export const DEFAULT_PRESET = 'Mobile robot with sensors';
