'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { URDFRobot } from 'urdf-loader';
import { ensureUrdfViewerRegistered } from '@/lib/urdf/registerUrdfViewerElement';
import { createMeshResolver } from '@/lib/urdf/meshResolver';
import { buildVisualColorOverrides } from '@/lib/urdf/visualColors';
import { addSkeletonPlaceholders } from '@/lib/urdf/skeletonPlaceholders';

export interface UrdfViewerHandle {
  setJointValue: (name: string, value: number) => void;
  setJointValues: (values: Record<string, number>) => void;
  recenter: () => void;
  getRobot: () => URDFRobot | null;
}

interface UrdfViewerElement extends HTMLElement {
  urdf: string;
  up: string;
  displayShadow: boolean;
  showCollision: boolean;
  loadMeshFunc: ReturnType<typeof createMeshResolver>;
  robot: URDFRobot | null;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  world: THREE.Object3D;
  renderer: THREE.WebGLRenderer;
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.HemisphereLight;
  setJointValue: (name: string, ...values: number[]) => void;
  setJointValues: (values: Record<string, number | number[]>) => void;
  recenter: () => void;
  redraw: () => void;
}

/** The element uses physically-based light intensities (e.g. DirectionalLight at
 * Math.PI) but never sets tone mapping, so plain/white materials blow straight out to
 * flat white under the default light rig instead of showing shaded gradients. */
function tuneRendering(el: UrdfViewerElement) {
  el.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  el.renderer.toneMappingExposure = 1.1;
  el.directionalLight.intensity = 1.6;
  el.ambientLight.intensity = 0.9;
  el.redraw();
}

function isFiniteVector(v: THREE.Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/** The <urdf-viewer> element only recenters its target; it never dollies the camera in
 * to fit the model. Without this, a sub-meter robot renders as a barely-visible speck at
 * the element's fixed default camera distance.
 *
 * Returns false if the robot's geometry is unusable (e.g. NaN vertex positions from an
 * unexpanded xacro `${...}` expression parsed as a plain number) — the caller then reports
 * an error instead of leaving the camera pointed at NaN, which renders as a silent blank
 * canvas with no on-screen indication anything went wrong. */
function fitCameraToRobot(el: UrdfViewerElement, robot: URDFRobot): boolean {
  el.world.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(robot);
  if (box.isEmpty()) return true;
  if (!isFiniteVector(box.min) || !isFiniteVector(box.max)) return false;

  // A bounding-sphere fit (rather than sizing off the box's largest axis) guarantees the
  // whole model stays in frame regardless of viewing angle — important for tall/thin
  // shapes like a skeleton-placeholder chain, where an axis-aligned box's longest side
  // can point mostly away from the camera and still get clipped at this angle.
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const center = sphere.center;
  const radius = sphere.radius || 0.5;
  const maxDim = radius * 2;

  const fovRad = (el.camera.fov * Math.PI) / 180;
  const fitDistance = (radius / Math.sin(fovRad / 2)) * 1.25;
  const direction = new THREE.Vector3(0.6, 0.45, -1).normalize();

  el.camera.position.copy(center.clone().addScaledVector(direction, fitDistance));
  el.camera.near = Math.max(fitDistance / 1000, 0.001);
  el.camera.far = fitDistance * 100;
  el.camera.updateProjectionMatrix();

  el.controls.target.copy(center);
  el.controls.minDistance = maxDim * 0.05;
  el.controls.maxDistance = fitDistance * 20;
  el.controls.update();

  el.redraw();
  return true;
}

interface Props {
  urdfText: string | null;
  meshMap: Map<string, string>;
  showCollision: boolean;
  onLoaded: (robot: URDFRobot) => void;
  onError: (message: string) => void;
  onMissingMesh: (basename: string) => void;
}

const UrdfViewerCanvas = forwardRef<UrdfViewerHandle, Props>(function UrdfViewerCanvas(
  { urdfText, meshMap, showCollision, onLoaded, onError, onMissingMesh },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<UrdfViewerElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const meshMapRef = useRef(meshMap);
  meshMapRef.current = meshMap;
  const colorOverrides = useMemo(() => buildVisualColorOverrides(urdfText ?? ''), [urdfText]);
  const colorOverridesRef = useRef(colorOverrides);
  colorOverridesRef.current = colorOverrides;
  const onMissingMeshRef = useRef(onMissingMesh);
  onMissingMeshRef.current = onMissingMesh;
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    ensureUrdfViewerRegistered().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const el = document.createElement('urdf-viewer') as unknown as UrdfViewerElement;
    el.style.width = '100%';
    el.style.height = '100%';
    el.up = '+Z';
    el.displayShadow = true;
    el.loadMeshFunc = createMeshResolver(
      { get: (k: string) => meshMapRef.current.get(k) },
      { get: (k: string) => colorOverridesRef.current.get(k) },
      (basename) => onMissingMeshRef.current(basename),
    );

    const handleProcessed = () => {
      if (el.robot) {
        addSkeletonPlaceholders(el.robot);
        const ok = fitCameraToRobot(el, el.robot);
        if (!ok) {
          onErrorRef.current(
            'This file has non-numeric geometry (e.g. an unresolved ${...} xacro expression parsed as a dimension), so nothing can be positioned on screen. If this is a xacro file, expand it first — e.g. `xacro your_file.xacro > your_file.urdf` — then upload the plain URDF.',
          );
        }
        onLoadedRef.current(el.robot);
      }
    };
    const handleError = () => onErrorRef.current('Failed to load or parse this URDF.');

    el.addEventListener('urdf-processed', handleProcessed);
    el.addEventListener('error', handleError);

    containerRef.current.appendChild(el);
    elRef.current = el;
    tuneRendering(el);

    return () => {
      el.removeEventListener('urdf-processed', handleProcessed);
      el.removeEventListener('error', handleError);
      el.remove();
      elRef.current = null;
    };
  }, [ready]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.showCollision = showCollision;
  }, [showCollision, ready]);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !ready) return;

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!urdfText) {
      return;
    }

    const blob = new Blob([urdfText], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    el.urdf = url;

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [urdfText, ready]);

  useImperativeHandle(ref, () => ({
    setJointValue: (name, value) => elRef.current?.setJointValue(name, value),
    setJointValues: (values) => elRef.current?.setJointValues(values),
    recenter: () => elRef.current?.recenter(),
    getRobot: () => elRef.current?.robot ?? null,
  }));

  return <div ref={containerRef} className="h-full w-full" />;
});

export default UrdfViewerCanvas;
