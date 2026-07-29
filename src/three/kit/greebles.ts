import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Rng } from "./rng.js";

/**
 * MASONRY MOLECULES — the repeatable stone details every fortress-like piece is assembled from.
 * Each returns plain meshes for the caller to merge; none of them pick materials or positions in
 * world space, so they compose into any organism (this tower today, a district of towers later).
 *
 * The detail that sells stone at close range is CHAMFER: a hard 90° edge reads as a render, a
 * broken/beveled one reads as carved rock. Every slat here is chamfered and jittered.
 */

/** A ring of vertical slats — the "organ-pipe" masonry that gives the tower its fibrous silhouette. */
export function slatRing(
  scene: Scene,
  rng: Rng,
  opts: {
    y: number;
    radius: number;
    height: number;
    count: number;
    /** 0..1 — how ragged the tops are. Higher = more war-damaged. */
    jag: number;
  },
): Mesh[] {
  const out: Mesh[] = [];
  const { y, radius, height, count, jag } = opts;
  const step = (Math.PI * 2) / count;
  // Slats slightly overlap so no seams show through at grazing angles.
  const width = radius * step * 1.16;

  for (let i = 0; i < count; i++) {
    const a = i * step + rng.jitter(step * 0.16);
    const h = height * (1 + rng.jitter(jag * 0.85));
    const depth = width * (0.62 + rng.next() * 0.5);

    const slat = CreateBox("slat", { width, height: h, depth }, scene);
    const r = radius + rng.jitter(radius * 0.035);
    slat.position.set(Math.cos(a) * r, y + h / 2, Math.sin(a) * r);
    slat.rotation.y = -a;
    out.push(slat);

    // Chamfer cap: a thin, slightly wider slab that breaks the top edge's hard line.
    if (rng.chance(0.72)) {
      const cap = CreateBox(
        "chamfer",
        { width: width * 1.08, height: h * 0.045, depth: depth * 1.1 },
        scene,
      );
      cap.position.set(Math.cos(a) * r, y + h, Math.sin(a) * r);
      cap.rotation.y = -a;
      out.push(cap);
    }

    // Merlon: a tapered tooth on some slats, eroded at random so the crown isn't a comb.
    if (rng.chance(0.55)) {
      const merlon = CreateCylinder(
        "merlon",
        {
          diameterTop: 0,
          diameterBottom: width * (0.5 + rng.next() * 0.32),
          height: height * (0.3 + rng.next() * 0.55),
          tessellation: 4,
        },
        scene,
      );
      merlon.position.set(Math.cos(a) * r, y + h + height * 0.16, Math.sin(a) * r);
      merlon.rotation.y = -a + rng.jitter(0.4);
      out.push(merlon);
    }
  }
  return out;
}

/** Angled buttress spikes — the thorny mass that makes the lower fortress read as fortified. */
export function spikeRing(
  scene: Scene,
  rng: Rng,
  opts: { y: number; radius: number; count: number; length: number; tilt: number },
): Mesh[] {
  const out: Mesh[] = [];
  const { y, radius, count, length, tilt } = opts;
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const a = i * step + rng.jitter(step * 0.3);
    const len = length * (0.72 + rng.next() * 0.62);
    const spike = CreateCylinder(
      "spike",
      { diameterTop: 0, diameterBottom: len * 0.3, height: len, tessellation: 5 },
      scene,
    );
    spike.position.set(Math.cos(a) * radius, y + rng.jitter(1.6), Math.sin(a) * radius);
    spike.rotation.z = Math.cos(a) * tilt;
    spike.rotation.x = -Math.sin(a) * tilt;
    spike.rotation.y = -a;
    out.push(spike);
  }
  return out;
}

/**
 * A projecting ledge/walkway. Horizontal breaks are what stop a tall tower reading as one extruded
 * shape — they catch the key light and give the eye a scale reference.
 */
export function ledge(
  scene: Scene,
  opts: { y: number; radius: number; thickness?: number; overhang?: number },
): Mesh {
  const { y, radius, thickness = 0.85, overhang = 1.5 } = opts;
  const m = CreateCylinder(
    "ledge",
    {
      diameterTop: (radius + overhang) * 2,
      diameterBottom: (radius + overhang * 0.55) * 2,
      height: thickness,
      tessellation: 24,
    },
    scene,
  );
  m.position.y = y;
  return m;
}

/** Emissive arrow-slit windows — the cue that reads instantly as "something lives in there". */
export function arrowSlits(
  scene: Scene,
  rng: Rng,
  opts: { y: number; radius: number; count: number; height: number },
): Mesh[] {
  const out: Mesh[] = [];
  const { y, radius, count, height } = opts;
  const step = (Math.PI * 2) / count;
  for (let i = 0; i < count; i++) {
    if (!rng.chance(0.62)) continue; // not every bay is lit — irregularity reads as inhabited
    const a = i * step;
    const slit = CreateBox(
      "slit",
      { width: 0.34, height: height * (0.3 + rng.next() * 0.34), depth: 0.16 },
      scene,
    );
    const r = radius * 1.006;
    slit.position.set(Math.cos(a) * r, y + height * 0.45, Math.sin(a) * r);
    slit.rotation.y = -a;
    out.push(slit);
  }
  return out;
}
