'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { WorldFrame } from '@/lib/tf/compute';
import { WORLD_ID } from '@/lib/tf/types';

interface Props {
  frames: WorldFrame[];
  sourceId: string;
  targetId: string;
}

/** Same Z-up (ROS/tf convention) -> Y-up (Three.js) remap used by the DH chain preview and
 * the URDF viewer's `up="+Z"` — otherwise the tree renders sideways relative to the grid. */
const UP_REMAP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

function toRenderSpace(position: THREE.Vector3, quaternion: THREE.Quaternion) {
  return {
    position: position.clone().applyQuaternion(UP_REMAP),
    quaternion: UP_REMAP.clone().multiply(quaternion),
  };
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    } else if (child instanceof THREE.LineSegments || child instanceof THREE.Line) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    } else if (child instanceof THREE.Sprite) {
      child.material.map?.dispose();
      child.material.dispose();
    }
  });
}

/** A billboarded text label (canvas texture on a Sprite) sized in world units so it scales
 * with the rest of the scene, matching the marker/axes sizing. `maxWidth` keeps long frame
 * names from dominating the view (or each other, for closely-spaced frames) — the sprite
 * shrinks below `desiredHeight` if needed to stay under it. */
function makeLabelSprite(text: string, desiredHeight: number, maxWidth: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 56;
  ctx.font = `${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const paddingX = 16;
  canvas.width = Math.ceil(textWidth + paddingX * 2);
  canvas.height = Math.ceil(fontSize * 1.4);
  // Setting canvas.width/height resets the 2D context, so font must be re-applied.
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(10, 10, 10, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f5f5f5';
  ctx.fillText(text, paddingX, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.width / canvas.height;
  let height = desiredHeight;
  let width = height * aspect;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspect;
  }
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = 999;
  return sprite;
}

export default function TfTreePreview({ frames, sourceId, targetId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    camera.position.set(2.5, 2, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x0a0a0a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 4, 2);
    scene.add(dirLight);

    scene.add(new THREE.GridHelper(4, 16, 0x3a3a3a, 0x262626));

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let frameId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      groupRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!group || !camera || !controls) return;

    while (group.children.length > 0) {
      disposeObject(group.children.pop()!);
    }

    const worldRender = toRenderSpace(new THREE.Vector3(0, 0, 0), new THREE.Quaternion());
    const renderById = new Map<string, { position: THREE.Vector3; quaternion: THREE.Quaternion }>();
    renderById.set(WORLD_ID, worldRender);
    frames.forEach((f) => renderById.set(f.id, toRenderSpace(f.position, f.quaternion)));

    const box = new THREE.Box3();
    renderById.forEach((f) => box.expandByPoint(f.position));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.05);
    const axisSize = Math.max(radius * 0.15, 0.025);

    // Lines from each frame to its parent (or world if it has none).
    frames.forEach((f) => {
      const parentRender = renderById.get(f.parentId ?? WORLD_ID);
      const childRender = renderById.get(f.id);
      if (!parentRender || !childRender) return;
      const geo = new THREE.BufferGeometry().setFromPoints([parentRender.position, childRender.position]);
      const mat = new THREE.LineBasicMaterial({ color: 0x5b8def, transparent: true, opacity: 0.7 });
      group.add(new THREE.Line(geo, mat));
    });

    // World origin marker.
    const worldMarker = new THREE.Mesh(
      new THREE.SphereGeometry(axisSize * 0.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.4 }),
    );
    worldMarker.position.copy(worldRender.position);
    group.add(worldMarker);
    const worldAxes = new THREE.AxesHelper(axisSize * 2);
    worldAxes.position.copy(worldRender.position);
    group.add(worldAxes);
    const worldLabel = makeLabelSprite('world', axisSize * 0.9, radius * 0.3);
    worldLabel.position.copy(worldRender.position).add(new THREE.Vector3(0, axisSize * 1.8, 0));
    group.add(worldLabel);

    frames.forEach((f) => {
      const render = renderById.get(f.id);
      if (!render) return;
      const isSource = f.id === sourceId;
      const isTarget = f.id === targetId;
      const color = isSource ? 0x22c55e : isTarget ? 0xff5252 : 0xdddddd;
      const markerRadius = isSource || isTarget ? axisSize * 0.65 : axisSize * 0.4;

      const marker = new THREE.Mesh(new THREE.SphereGeometry(markerRadius, 16, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
      marker.position.copy(render.position);
      group.add(marker);

      const axes = new THREE.AxesHelper(isSource || isTarget ? axisSize * 2.6 : axisSize * 1.6);
      axes.position.copy(render.position);
      axes.quaternion.copy(render.quaternion);
      group.add(axes);

      const label = makeLabelSprite(f.name, axisSize * 0.9, radius * 0.3);
      label.position.copy(render.position).add(new THREE.Vector3(0, axisSize * 1.8, 0));
      group.add(label);
    });

    const fovRad = (camera.fov * Math.PI) / 180;
    const fitDistance = (radius / Math.sin(fovRad / 2)) * 1.6 || 1;
    const center = sphere.center;
    const dir = new THREE.Vector3(1, 0.8, 1).normalize().multiplyScalar(fitDistance);
    camera.position.copy(center.clone().add(dir));
    camera.near = Math.max(fitDistance / 100, 0.01);
    camera.far = fitDistance * 100 + 10;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
  }, [frames, sourceId, targetId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
