export interface FrameDef {
  id: string;
  name: string;
  /** null = attached directly to the world/root frame. */
  parentId: string | null;
  /** Translation of this frame's origin relative to its parent, meters. */
  x: number;
  y: number;
  z: number;
  /** Rotation relative to parent, ROS/URDF fixed-axis X-Y-Z convention, degrees. */
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
}

export const WORLD_ID = '__world__';
export const WORLD_NAME = 'world';
