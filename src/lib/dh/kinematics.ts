import * as THREE from 'three';
import type { DHRow } from './types';

export interface Frame {
  /** Position of this frame's origin, expressed in the base frame. */
  position: THREE.Vector3;
  /** Orientation of this frame, expressed in the base frame (x, y, z, w). */
  quaternion: THREE.Quaternion;
  matrix: THREE.Matrix4;
}

/**
 * Standard (Denavit-Hartenberg, not "modified") link transform:
 * T = Rot_z(theta) * Trans_z(d) * Trans_x(a) * Rot_x(alpha)
 */
function dhLinkMatrix(a: number, alphaRad: number, d: number, thetaRad: number): THREE.Matrix4 {
  const ct = Math.cos(thetaRad);
  const st = Math.sin(thetaRad);
  const ca = Math.cos(alphaRad);
  const sa = Math.sin(alphaRad);

  const m = new THREE.Matrix4();
  // THREE.Matrix4.set() takes arguments in row-major order.
  m.set(
    ct, -st * ca, st * sa, a * ct,
    st, ct * ca, -ct * sa, a * st,
    0, sa, ca, d,
    0, 0, 0, 1,
  );
  return m;
}

function frameFromMatrix(m: THREE.Matrix4): Frame {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  m.decompose(position, quaternion, scale);
  return { position, quaternion, matrix: m };
}

/**
 * Forward kinematics for a chain of standard DH rows. Returns one frame per row, plus the
 * base frame at index 0 — so `frames.length === rows.length + 1` and `frames[i + 1]` is the
 * frame attached at the end of `rows[i]`'s link.
 */
export function computeChain(rows: DHRow[]): Frame[] {
  const frames: Frame[] = [frameFromMatrix(new THREE.Matrix4())];
  let T = new THREE.Matrix4();
  for (const row of rows) {
    const alphaRad = (row.alphaDeg * Math.PI) / 180;
    const thetaRad = (row.thetaDeg * Math.PI) / 180;
    const linkMatrix = dhLinkMatrix(row.a, alphaRad, row.d, thetaRad);
    T = T.clone().multiply(linkMatrix);
    frames.push(frameFromMatrix(T));
  }
  return frames;
}
