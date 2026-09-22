import * as THREE from 'three';
import { eulerToQuaternion, degToRad } from '@/lib/quaternion/convert';
import { WORLD_ID, WORLD_NAME, type FrameDef } from './types';

export interface WorldFrame {
  id: string;
  name: string;
  parentId: string | null;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  matrix: THREE.Matrix4;
}

export interface TreeResult {
  frames: Map<string, WorldFrame>;
  /** Frames whose parent was missing or formed a cycle; they were treated as attached to
   * the world frame instead so the rest of the tree can still be computed. */
  issues: string[];
}

function localMatrix(def: FrameDef): THREE.Matrix4 {
  const q = eulerToQuaternion({ roll: degToRad(def.rollDeg), pitch: degToRad(def.pitchDeg), yaw: degToRad(def.yawDeg) });
  return new THREE.Matrix4().compose(
    new THREE.Vector3(def.x, def.y, def.z),
    new THREE.Quaternion(q.x, q.y, q.z, q.w),
    new THREE.Vector3(1, 1, 1),
  );
}

function toWorldFrame(def: FrameDef, matrix: THREE.Matrix4): WorldFrame {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  return { id: def.id, name: def.name, parentId: def.parentId, position, quaternion, matrix };
}

/** Resolves every frame's pose in world space, following parent chains. Missing parents and
 * cycles are reported as issues and treated as if the frame were parented to the world. */
export function computeWorldFrames(defs: FrameDef[]): TreeResult {
  const byId = new Map(defs.map((f) => [f.id, f]));
  const world = new Map<string, WorldFrame>();
  const issues: string[] = [];

  function resolve(id: string, visiting: Set<string>): WorldFrame {
    const cached = world.get(id);
    if (cached) return cached;

    const def = byId.get(id)!;
    const own = localMatrix(def);

    if (def.parentId === null) {
      const wf = toWorldFrame(def, own);
      world.set(id, wf);
      return wf;
    }

    if (visiting.has(def.parentId) || !byId.has(def.parentId)) {
      if (!byId.has(def.parentId)) {
        issues.push(`"${def.name}" has no parent frame "${def.parentId}" — treating it as attached to world.`);
      } else {
        issues.push(`"${def.name}" is part of a parent cycle — treating it as attached to world.`);
      }
      const wf = toWorldFrame(def, own);
      world.set(id, wf);
      return wf;
    }

    const parentWorld = resolve(def.parentId, new Set(visiting).add(id));
    const combined = parentWorld.matrix.clone().multiply(own);
    const wf = toWorldFrame(def, combined);
    world.set(id, wf);
    return wf;
  }

  defs.forEach((f) => resolve(f.id, new Set()));
  return { frames: world, issues };
}

export interface Transform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  matrix: THREE.Matrix4;
}

function resolveFrame(world: Map<string, WorldFrame>, id: string): WorldFrame | null {
  if (id === WORLD_ID) {
    return { id: WORLD_ID, name: WORLD_NAME, parentId: null, position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), matrix: new THREE.Matrix4() };
  }
  return world.get(id) ?? null;
}

/**
 * Matches tf2's `lookupTransform(target_frame, source_frame)`: the returned transform maps a
 * point/pose expressed in `sourceId` into `targetId`'s frame, i.e. p_target = T * p_source.
 * Either id may be `WORLD_ID`, which resolves to the identity-rooted world frame.
 */
export function lookupTransform(world: Map<string, WorldFrame>, sourceId: string, targetId: string): Transform | null {
  const source = resolveFrame(world, sourceId);
  const target = resolveFrame(world, targetId);
  if (!source || !target) return null;

  const matrix = target.matrix.clone().invert().multiply(source.matrix);
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  return { position, quaternion, matrix };
}

export function transformPoint(transform: Transform, point: THREE.Vector3): THREE.Vector3 {
  return point.clone().applyMatrix4(transform.matrix);
}
