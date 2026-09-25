import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * The STAGE — renderer, camera, orbit and lights. Straight from the Barad-dûr design handoff's
 * viewer shell, so what Claude Design rendered is what `/tower` renders: same engine (three.js
 * 0.184), same grade, same lights. Tooling parity is the point — a port between engines was where
 * fidelity leaked (mirrored handedness, reversed winding, different light units).
 *
 * The look, in the order it matters:
 *   1. a night background (#0B0F14) with matching exponential fog, so distance reads as air;
 *   2. ACES filmic tone mapping at exposure 1.15 — the fire's HDR values roll off instead of clipping;
 *   3. a cold hemisphere wash over a warm ground bounce, a shadow-casting moon key, and a warm fill
 *      from behind so the silhouette never goes dead black.
 */

export const BACKGROUND = 0x0b0f14;

export interface Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly key: THREE.DirectionalLight;
}

export function createStage(canvas: HTMLCanvasElement): Stage {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  scene.fog = new THREE.FogExp2(BACKGROUND, 0.00035);
  scene.add(new THREE.HemisphereLight(0x8a9bb4, 0x3a1c0c, 1.5));

  const key = new THREE.DirectionalLight(0xc6d0e0, 2.3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0002;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0xff7a2e, 1.8);
  fill.position.set(-5, 3, -4);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 6000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 20;
  controls.maxDistance = 1600;

  const fit = (): void => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  fit();
  window.addEventListener("resize", fit);

  return { renderer, scene, camera, controls, key };
}

/**
 * Aim the key light and its shadow frustum at the model, and add a ground plane that only catches
 * shadow. Mirrors the reference shell's `setObject`, which derives all of this from the bounds.
 */
export function frameLights(stage: Stage, object: THREE.Object3D): THREE.Sphere {
  const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  const R = sphere.radius;
  const { key } = stage;
  key.position.copy(sphere.center).add(new THREE.Vector3(0.9, 1.1, 0.7).multiplyScalar(R * 1.6));
  key.target.position.copy(sphere.center);
  key.target.updateMatrixWorld();
  const cam = key.shadow.camera;
  cam.near = R * 0.2;
  cam.far = R * 5;
  cam.left = cam.bottom = -R * 1.4;
  cam.right = cam.top = R * 1.4;
  cam.updateProjectionMatrix();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(R * 5, R * 5),
    new THREE.ShadowMaterial({ opacity: 0.45 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  stage.scene.add(ground);
  return sphere;
}
