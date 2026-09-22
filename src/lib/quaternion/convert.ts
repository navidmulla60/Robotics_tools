export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Roll (X), pitch (Y), yaw (Z), in radians. */
export interface Euler {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface AxisAngle {
  axis: [number, number, number];
  angleRad: number;
}

export type Matrix3 = [[number, number, number], [number, number, number], [number, number, number]];

const HALF_PI = Math.PI / 2;

export function quaternionMagnitude(q: Quaternion): number {
  return Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
}

export function normalizeQuaternion(q: Quaternion): Quaternion {
  const mag = quaternionMagnitude(q);
  if (mag < 1e-12) return { x: 0, y: 0, z: 0, w: 1 };
  return { x: q.x / mag, y: q.y / mag, z: q.z / mag, w: q.w / mag };
}

/**
 * Quaternion -> roll/pitch/yaw, using the ROS/URDF/tf2 convention: fixed-axis (extrinsic)
 * X-Y-Z rotation, equivalently R = Rz(yaw) * Ry(pitch) * Rx(roll). Matches
 * geometry_msgs/Quaternion <-> tf2::getEulerYPR / <origin rpy="r p y"/> in URDF.
 */
export function quaternionToEuler(qIn: Quaternion): Euler {
  const q = normalizeQuaternion(qIn);

  const sinrCosp = 2 * (q.w * q.x + q.y * q.z);
  const cosrCosp = 1 - 2 * (q.x * q.x + q.y * q.y);
  const roll = Math.atan2(sinrCosp, cosrCosp);

  const sinp = 2 * (q.w * q.y - q.z * q.x);
  const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * HALF_PI : Math.asin(sinp);

  const sinyCosp = 2 * (q.w * q.z + q.x * q.y);
  const cosyCosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  const yaw = Math.atan2(sinyCosp, cosyCosp);

  return { roll, pitch, yaw };
}

/** Inverse of quaternionToEuler — same ROS/URDF fixed-axis X-Y-Z convention. */
export function eulerToQuaternion({ roll, pitch, yaw }: Euler): Quaternion {
  const cr = Math.cos(roll / 2);
  const sr = Math.sin(roll / 2);
  const cp = Math.cos(pitch / 2);
  const sp = Math.sin(pitch / 2);
  const cy = Math.cos(yaw / 2);
  const sy = Math.sin(yaw / 2);

  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
  };
}

/** True when pitch is close enough to +-90 deg that roll and yaw become coupled
 * (a single remaining degree of freedom split arbitrarily between them). */
export function isNearGimbalLock(euler: Euler, toleranceRad = 0.001): boolean {
  return Math.abs(Math.abs(euler.pitch) - HALF_PI) < toleranceRad;
}

export function quaternionToAxisAngle(qIn: Quaternion): AxisAngle {
  const q = normalizeQuaternion(qIn);
  const w = Math.min(1, Math.max(-1, q.w));
  const angleRad = 2 * Math.acos(w);
  const s = Math.sqrt(1 - w * w);
  if (s < 1e-6) return { axis: [1, 0, 0], angleRad };
  return { axis: [q.x / s, q.y / s, q.z / s], angleRad };
}

export function quaternionToMatrix3(qIn: Quaternion): Matrix3 {
  const q = normalizeQuaternion(qIn);
  const { x, y, z, w } = q;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;

  return [
    [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
    [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
    [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)],
  ];
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
