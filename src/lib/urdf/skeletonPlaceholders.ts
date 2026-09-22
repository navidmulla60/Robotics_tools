import * as THREE from 'three';
import type { URDFRobot } from 'urdf-loader';
import { URDFVisual } from 'urdf-loader/src/URDFClasses.js';
import { MISSING_MESH_MARKER_NAME } from './meshResolver';

const PLACEHOLDER_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xff2bd6,
  transparent: true,
  opacity: 0.55,
  roughness: 0.6,
  metalness: 0.1,
});

function isJoint(obj: THREE.Object3D): boolean {
  return Boolean((obj as unknown as { isURDFJoint?: boolean }).isURDFJoint);
}

/** Collects missing-mesh markers that belong directly to this link (its own visual/collision
 * groups), without crossing into child joints — those belong to descendant links. */
function findOwnMarkers(node: THREE.Object3D, out: THREE.Object3D[]) {
  node.children.forEach((child) => {
    if (isJoint(child)) return;
    if (child.name === MISSING_MESH_MARKER_NAME) out.push(child);
    findOwnMarkers(child, out);
  });
}

/** A thin rod from this link's origin toward a child joint, standing in for the (missing)
 * real geometry that would normally connect the two. */
function createBoneToward(target: THREE.Vector3): THREE.Object3D | null {
  const length = target.length();
  if (length < 1e-6) return null;

  const radius = THREE.MathUtils.clamp(length * 0.07, 0.004, 0.035);
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 12);
  geometry.translate(0, length / 2, 0);

  const mesh = new THREE.Mesh(geometry, PLACEHOLDER_MATERIAL);
  mesh.name = `${MISSING_MESH_MARKER_NAME}-bone`;
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().normalize());
  return mesh;
}

function createLeafMarker(): THREE.Object3D {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), PLACEHOLDER_MATERIAL);
  mesh.name = `${MISSING_MESH_MARKER_NAME}-leaf`;
  return mesh;
}

/**
 * Turns the invisible "mesh missing" markers left by meshResolver into a readable stand-in
 * shape per link: a rod toward each child joint (so the kinematic chain still reads as a
 * connected skeleton) or a small marker for a leaf link with nothing downstream. Replaces
 * the earlier approach of dropping an identically-sized cube at every missing mesh
 * reference, which — for robots with many small/adjacent links — rendered as an unreadable
 * cluster of same-size boxes with no sense of the robot's actual structure.
 */
export function addSkeletonPlaceholders(robot: URDFRobot) {
  Object.values(robot.links).forEach((link) => {
    const markers: THREE.Object3D[] = [];
    findOwnMarkers(link, markers);
    if (markers.length === 0) return;

    markers.forEach((marker) => marker.parent?.remove(marker));

    // Wrapped in a URDFVisual (rather than added straight to the link) so the viewer's own
    // recenter/shadow-plane logic — which only scans nodes flagged isURDFVisual — sees this
    // geometry too. Skipping that wrapper leaves those groups empty, which collapses their
    // bounding box to empty and sends controls.target to NaN, silently undoing any camera fit.
    const visual = new URDFVisual();
    visual.name = `${MISSING_MESH_MARKER_NAME}-visual`;

    const childJoints = link.children.filter(isJoint);
    if (childJoints.length > 0) {
      childJoints.forEach((joint) => {
        const bone = createBoneToward(joint.position);
        if (bone) visual.add(bone);
      });
    } else {
      visual.add(createLeafMarker());
    }

    if (visual.children.length > 0) link.add(visual);
  });
}
