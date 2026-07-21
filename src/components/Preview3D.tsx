"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import earcut from "earcut";
import { useStudio } from "@/lib/client/store";
import type { MultiPolygon } from "@/lib/geometry/types";

// הדמיה תלת-ממדית — סעיף 9: טריאנגולציה של ה-material (earcut עם חורים),
// אקסטרוזיה לעובי, כיפוף לקשת R=(L+gap)/(2π), חומר בגוון פליז.

export function Preview3D() {
  const s = useStudio();
  const design = s.design;
  const geometry = s.geometry;
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    mesh: THREE.Mesh | null;
  } | null>(null);

  // הקמת הסצנה פעם אחת
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f4);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(40, 1, 1, 2000);
    camera.position.set(0, 40, 110);

    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(50, 80, 60);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });

    const resize = () => {
      const r = mount.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    sceneRef.current = { renderer, scene, camera, controls, mesh: null };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  // עדכון המודל בכל שינוי גרסה/גיאומטריה
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx || !design || !geometry) return;
    if (ctx.mesh) {
      ctx.scene.remove(ctx.mesh);
      ctx.mesh.geometry.dispose();
      (ctx.mesh.material as THREE.Material).dispose();
      ctx.mesh = null;
    }
    const L = Number(design.length_mm);
    const gap = Number(design.gap_mm);
    const t = Number(design.thickness_mm);
    const W = Number(design.width_mm);
    const geo = buildBentGeometry(geometry.material, L, W, gap, t);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc9a227,
      metalness: 0.95,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    ctx.scene.add(mesh);
    ctx.mesh = mesh;

    // מיקום מצלמה יחסי לגודל
    const R = (L + gap) / (2 * Math.PI);
    ctx.controls.target.set(0, 0, 0);
    ctx.camera.position.set(0, R * 1.6, R * 4.2);
    ctx.controls.update();
  }, [design, geometry]);

  return (
    <div ref={mountRef} className="h-full w-full" style={{ direction: "ltr" }}>
      {!geometry && (
        <div className="flex h-full items-center justify-center text-sm text-stone-400">…</div>
      )}
    </div>
  );
}

/**
 * בניית BufferGeometry: משטח עליון+תחתון מטריאנגולציית earcut, דפנות לאורך
 * כל הטבעות (חיצוניות ופנימיות), ואז כיפוף כל vertex לקשת.
 */
function buildBentGeometry(
  material: MultiPolygon,
  L: number,
  W: number,
  gap: number,
  thickness: number,
): THREE.BufferGeometry {
  const positions: number[] = [];

  const pushTri = (a: number[], b: number[], c: number[]) => {
    positions.push(...a, ...b, ...c);
  };

  for (const poly of material) {
    // earcut: מערך שטוח + אינדקסי חורים
    const flat: number[] = [];
    const holeIdx: number[] = [];
    for (const [ri, ring] of poly.entries()) {
      if (ri > 0) holeIdx.push(flat.length / 2);
      for (const [x, y] of ring) flat.push(x, y);
    }
    const tris = earcut(flat, holeIdx.length ? holeIdx : undefined);
    const v = (i: number, z: number) => [flat[i * 2], flat[i * 2 + 1], z];
    // משטח עליון (z=t) ותחתון (z=0), כיווני winding הפוכים
    for (let i = 0; i < tris.length; i += 3) {
      pushTri(v(tris[i], thickness), v(tris[i + 1], thickness), v(tris[i + 2], thickness));
      pushTri(v(tris[i], 0), v(tris[i + 2], 0), v(tris[i + 1], 0));
    }
    // דפנות
    for (const ring of poly) {
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i];
        const q = ring[(i + 1) % ring.length];
        const a = [p[0], p[1], 0], b = [q[0], q[1], 0];
        const a2 = [p[0], p[1], thickness], b2 = [q[0], q[1], thickness];
        pushTri(a, b, b2);
        pushTri(a, b2, a2);
      }
    }
  }

  // כיפוף: θ=(x−L/2)/R, מיקום ((R+z)·sinθ, y, (R+z)·cosθ−R) — הפער מול המצלמה
  const R = (L + gap) / (2 * Math.PI);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    const theta = (x - L / 2) / R;
    positions[i] = (R + z) * Math.sin(theta);
    positions[i + 1] = W / 2 - y; // ציר Y של SVG כלפי מטה → הפוך לתצוגה
    positions[i + 2] = (R + z) * Math.cos(theta) - R;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}
