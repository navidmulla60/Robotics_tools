import { createFrame, type FrameDef } from './types';

export const PRESETS: Record<string, () => FrameDef[]> = {
  'Mobile robot with sensors': () => {
    const base = createFrame({ name: 'base_link', parentId: null, x: 0, y: 0, z: 0.1, rollDeg: 0, pitchDeg: 0, yawDeg: 0 });
    const lidar = createFrame({ name: 'lidar_link', parentId: base.id, x: 0.1, y: 0, z: 0.2, rollDeg: 0, pitchDeg: 0, yawDeg: 0 });
    // ROS optical-frame convention (REP 103): camera_link -> camera_optical_frame is a fixed
    // roll=-90, yaw=-90 to go from ROS's x-forward/z-up to the optical z-forward/y-down axes.
    const camera = createFrame({ name: 'camera_link', parentId: base.id, x: 0.2, y: 0, z: 0.15, rollDeg: 0, pitchDeg: 0, yawDeg: 0 });
    const cameraOptical = createFrame({
      name: 'camera_optical_frame',
      parentId: camera.id,
      x: 0,
      y: 0,
      z: 0,
      rollDeg: -90,
      pitchDeg: 0,
      yawDeg: -90,
    });
    return [base, lidar, camera, cameraOptical];
  },
  '2-link arm on a table': () => {
    const shoulder = createFrame({ name: 'shoulder_link', parentId: null, x: 0, y: 0, z: 0.5, rollDeg: 0, pitchDeg: 0, yawDeg: 0 });
    const elbow = createFrame({ name: 'elbow_link', parentId: shoulder.id, x: 0.4, y: 0, z: 0, rollDeg: 0, pitchDeg: 0, yawDeg: 30 });
    const wrist = createFrame({ name: 'wrist_link', parentId: elbow.id, x: 0.3, y: 0, z: 0, rollDeg: 0, pitchDeg: 0, yawDeg: -20 });
    return [shoulder, elbow, wrist];
  },
};

export const DEFAULT_PRESET = 'Mobile robot with sensors';
