import * as THREE from "three";
import { createRng } from "../kit/rng.js";
import { ED, EH, EW } from "./eye.js";

/**
 * EMBERS — sparks shed off the almond's rim that rise, drift and wink out. Design handoff §6: they
 * spawn on the rim, climb 6–16 u/s with a sideways sway, live 2.5–5.5 s and fade in and out on a
 * sine. 260 at the default standing; `TowerParams.stormDensity` scales the count.
 *
 * Seeded, so a fresh load always opens on the same spray. Under `prefers-reduced-motion` the caller
 * simply never steps them — they hold still as a faint halo of sparks.
 */

const BASE_COUNT = 260;

function dotTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "#FFF3D6");
    g.addColorStop(0.35, "#FF9E3D");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(c);
}

export interface Embers {
  readonly points: THREE.Points;
  /** Advance the simulation by `dt` seconds at wall-clock `now`. */
  step(dt: number, now: number): void;
}

export function createEmbers(at: THREE.Vector3, density: number): Embers {
  const n = Math.round(BASE_COUNT * density);
  const rng = createRng(4242);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const age = new Float32Array(n);
  const life = new Float32Array(n);

  const spawn = (i: number): void => {
    const a = rng.range(0, Math.PI * 2);
    const c = Math.cos(a);
    pos.set(
      [
        at.x + c * EW * rng.range(0.6, 1.1),
        at.y + Math.sin(a) * EH * rng.range(0.4, 1),
        at.z + rng.range(-ED, ED),
      ],
      i * 3,
    );
    vel.set([rng.range(-2, 2) + c * 3, rng.range(6, 16), rng.range(-2, 2)], i * 3);
    age[i] = 0;
    life[i] = rng.range(2.5, 5.5);
  };
  for (let i = 0; i < n; i++) {
    spawn(i);
    age[i] = rng.range(0, life[i] ?? 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 1.3,
      map: dotTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }),
  );
  points.name = "embers";
  points.frustumCulled = false;

  return {
    points,
    step(dt, now) {
      for (let i = 0; i < n; i++) {
        const a = (age[i] ?? 0) + dt;
        const l = life[i] ?? 1;
        if (a > l) {
          spawn(i);
          continue;
        }
        age[i] = a;
        const k3 = i * 3;
        pos[k3] = (pos[k3] ?? 0) + ((vel[k3] ?? 0) + Math.sin(now * 2 + i) * 1.5) * dt;
        pos[k3 + 1] = (pos[k3 + 1] ?? 0) + (vel[k3 + 1] ?? 0) * dt;
        pos[k3 + 2] = (pos[k3 + 2] ?? 0) + (vel[k3 + 2] ?? 0) * dt;
        const k = Math.sin((Math.PI * a) / l) * (0.6 + 0.4 * Math.sin(now * 17 + i));
        col[k3] = k;
        col[k3 + 1] = k * 0.75;
        col[k3 + 2] = k * 0.5;
      }
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    },
  };
}
