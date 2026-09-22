import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { Rgba } from './visualColors';

type OnMeshLoadComplete = (mesh: THREE.Object3D | null, err?: Error) => void;
type MeshLoadFunc = (url: string, manager: THREE.LoadingManager, material: THREE.Material, onLoad: OnMeshLoadComplete) => void;

/** Neutral "unpainted aluminum" look for links the URDF doesn't assign a color to.
 * urdf-loader's own fallback is a plain white MeshPhongMaterial, which blows out to flat
 * white under the viewer's physically-based light rig instead of showing shading. */
const DEFAULT_MESH_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xb0b4b8, metalness: 0.2, roughness: 0.6 });

function materialFromRgba(rgba: Rgba): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(rgba[0], rgba[1], rgba[2]),
    opacity: rgba[3],
    transparent: rgba[3] < 1,
    metalness: 0.1,
    roughness: 0.7,
  });
}

function applyColorOverride(object: THREE.Object3D, rgba: Rgba) {
  const material = materialFromRgba(rgba);
  object.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = material;
  });
}

function basenameOf(path: string): string {
  return path.split('?')[0].split('#')[0].split('/').pop() || path;
}

export const MISSING_MESH_MARKER_NAME = 'missing-mesh-placeholder';

/** An invisible marker left where a URDF referenced a mesh file that wasn't uploaded.
 * The actual stand-in shape (a "bone" cylinder toward the next joint, or a small marker
 * for a leaf link) is built afterwards in skeletonPlaceholders.ts, once the full robot
 * tree — and therefore each link's real neighbors — is known. */
function createPlaceholderMesh(): THREE.Object3D {
  const marker = new THREE.Object3D();
  marker.name = MISSING_MESH_MARKER_NAME;
  return marker;
}

/**
 * Resolves mesh filenames referenced in a URDF (which may use package:// URIs or
 * relative paths we can't fetch) against a map of uploaded files, matched by basename
 * since we don't have the original ROS package directory structure in the browser.
 */
export function createMeshResolver(
  meshMap: { get(key: string): string | undefined },
  colorOverrides: { get(key: string): Rgba | undefined },
  onMissing: (basename: string) => void,
): MeshLoadFunc {
  return function loadMeshFunc(path, manager, material, done) {
    const basename = basenameOf(path);
    const blobUrl = meshMap.get(basename.toLowerCase());
    const override = colorOverrides.get(basename.toLowerCase());

    if (!blobUrl) {
      onMissing(basename);
      manager.itemStart(path);
      manager.itemEnd(path);
      done(createPlaceholderMesh());
      return;
    }

    if (/\.stl$/i.test(basename)) {
      const loader = new STLLoader(manager);
      loader.load(
        blobUrl,
        (geometry) => done(new THREE.Mesh(geometry, override ? materialFromRgba(override) : DEFAULT_MESH_MATERIAL)),
        undefined,
        (err) => done(null, err as Error),
      );
    } else if (/\.dae$/i.test(basename)) {
      const loader = new ColladaLoader(manager);
      loader.load(
        blobUrl,
        (dae) => {
          const scene = dae?.scene ?? null;
          if (scene && override) applyColorOverride(scene, override);
          done(scene);
        },
        undefined,
        (err) => done(null, err as Error),
      );
    } else if (/\.obj$/i.test(basename)) {
      const loader = new OBJLoader(manager);
      loader.load(
        blobUrl,
        (obj) => {
          if (override) applyColorOverride(obj, override);
          done(obj);
        },
        undefined,
        (err) => done(null, err as Error),
      );
    } else {
      manager.itemStart(path);
      manager.itemEnd(path);
      done(null, new Error(`Unsupported mesh format: ${basename}`));
    }
  };
}
