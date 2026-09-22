'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Frame } from '@/lib/dh/kinematics';

interface Props {
  frames: Frame[];
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    } else if (child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });
}

/** A live 3D preview of the DH chain: link segments between consecutive joint origins, a
 * coordinate triad at each frame, and a highlighted end-effector frame. */
export default function DhChainPreview({ frames }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chainGroupRef = useRef<THREE.Group | null>(null);
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

    const chainGroup = new THREE.Group();
    scene.add(chainGroup);
    chainGroupRef.current = chainGroup;

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
      chainGroupRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chainGroup = chainGroupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!chainGroup || !camera || !controls) return;

    while (chainGroup.children.length > 0) {
      const child = chainGroup.children.pop()!;
      disposeObject(child);
    }

    if (frames.length === 0) return;

    const box = new THREE.Box3();
    frames.forEach((f) => box.expandByPoint(f.position));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.05);
    const axisSize = Math.max(radius * 0.18, 0.03);

    for (let i = 0; i < frames.length - 1; i++) {
      const start = frames[i].position;
      const end = frames[i + 1].position;
      const dist = start.distanceTo(end);
      if (dist < 1e-6) continue;
      const geo = new THREE.CylinderGeometry(axisSize * 0.35, axisSize * 0.35, dist, 12);
      const mat = new THREE.MeshStandardMaterial({ color: 0x5b8def, roughness: 0.5, metalness: 0.2 });
      const cyl = new THREE.Mesh(geo, mat);
      cyl.position.copy(start).lerp(end, 0.5);
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
      chainGroup.add(cyl);
    }

    frames.forEach((f, i) => {
      const isEnd = i === frames.length - 1;
      const isBase = i === 0;
      const sphereGeo = new THREE.SphereGeometry(isEnd ? axisSize * 0.6 : axisSize * 0.45, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: isEnd ? 0xff5252 : isBase ? 0x9ca3af : 0xdddddd,
        roughness: 0.4,
      });
      const marker = new THREE.Mesh(sphereGeo, sphereMat);
      marker.position.copy(f.position);
      chainGroup.add(marker);

      const axes = new THREE.AxesHelper(isEnd ? axisSize * 3 : axisSize * 1.8);
      axes.position.copy(f.position);
      axes.quaternion.copy(f.quaternion);
      chainGroup.add(axes);
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
  }, [frames]);

  return <div ref={containerRef} className="h-full w-full" />;
}
