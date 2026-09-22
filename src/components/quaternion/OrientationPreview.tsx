'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Quaternion } from '@/lib/quaternion/convert';

interface Props {
  quaternion: Quaternion;
}

/** A small live 3D preview of the current orientation: a faint world-frame triad plus a
 * bright body-frame triad (with a nose cone along +X) that rotates with the quaternion, so
 * the numbers translate into something visually intuitive. */
export default function OrientationPreview({ quaternion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2.2, 1.8, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 4, 2);
    scene.add(dirLight);

    scene.add(new THREE.GridHelper(2, 8, 0x3a3a3a, 0x262626));

    const worldAxes = new THREE.AxesHelper(1);
    (worldAxes.material as THREE.Material).transparent = true;
    (worldAxes.material as THREE.Material).opacity = 0.25;
    scene.add(worldAxes);

    const body = new THREE.Group();
    const bodyAxes = new THREE.AxesHelper(0.85);
    body.add(bodyAxes);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.5, metalness: 0.1 }),
    );
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(0.95, 0, 0);
    body.add(nose);

    scene.add(body);
    bodyRef.current = body;

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
      bodyRef.current = null;
    };
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    if (body.quaternion.length() > 1e-9) body.quaternion.normalize();
  }, [quaternion]);

  return <div ref={containerRef} className="h-full w-full" />;
}
