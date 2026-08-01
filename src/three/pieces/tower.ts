import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateIcoSphere } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder";
import { CreateTube } from "@babylonjs/core/Meshes/Builders/tubeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { TOKENS } from "../kit/env.js";
import { arrowSlits, ledge, slatRing, spikeRing } from "../kit/greebles.js";
import {
  basaltMaterial,
  emissiveMaterial,
  ironMaterial,
  moltenMaterial,
} from "../kit/materials.js";
import type { TowerParams } from "../kit/params.js";
import { DEFAULT_PROFILE, layoutRings, radiusAt, scaleProfile } from "../kit/profile.js";
import { createRng } from "../kit/rng.js";

/**
 * The Barad-dûr ORGANISM — the mountain, the shaft, the turrets and the crown, assembled from the
 * masonry molecules in kit/greebles.ts.
 *
 * It takes `TowerParams` (derived from real standing — see kit/params.ts), so this is a game piece
 * that levels up rather than a fixed prop: power drives height, detail passes and the forge's heat.
 */

export interface TowerBuild {
  readonly root: TransformNode;
  /** World-space Y of the crown, where the Eye is seated. */
  readonly crownY: number;
  /** Radius at the crown, so callers can size what sits on top. */
  readonly crownRadius: number;
  readonly meshes: readonly Mesh[];
}

/** Push the mountain's vertices around so the base reads as geology, not a sphere. */
function displaceMountain(mesh: Mesh, rng: ReturnType<typeof createRng>): void {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  if (!positions) return;
  for (let i = 0; i < positions.length; i += 3) {
    // noUncheckedIndexedAccess: the buffer is a flat xyz triple stream, so these always exist.
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;
    const z = positions[i + 2] ?? 0;
    // Ridged noise-ish displacement, stronger low down so the summit stays a plinth.
    // Layered ridges at several frequencies — a smooth blob reads as a saucer, crags read as rock.
    const ridge =
      Math.sin(x * 0.19) * Math.cos(z * 0.23) * 3.4 +
      Math.sin(x * 0.51 + z * 0.37) * 1.5 +
      Math.cos(x * 0.87 - z * 0.71) * 0.7 +
      rng.jitter(1.1);
    const falloff = Math.max(0.15, 1 - Math.abs(y) / 34);
    positions[i] = x + ridge * falloff * 0.55;
    positions[i + 1] = y + ridge * falloff * 0.55;
    positions[i + 2] = z + ridge * falloff * 0.55;
  }
  mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
  mesh.createNormals(true);
}

/** Build the whole tower. Everything static is merged down to a few draw calls at the end. */
export function buildTower(scene: Scene, params: TowerParams): TowerBuild {
  const rng = createRng(1337);
  const profile = scaleProfile(DEFAULT_PROFILE, params.power);
  const root = new TransformNode("tower", scene);

  const stone = basaltMaterial(scene);
  const iron = ironMaterial(scene);
  const molten = moltenMaterial(scene, (params.health + 1) / 2);
  const tracer = emissiveMaterial(scene, TOKENS.accent, 0.9);
  const windowMat = emissiveMaterial(scene, new Color3(1.0, 0.52, 0.16), 1.6);

  const stoneParts: Mesh[] = [];
  const ironParts: Mesh[] = [];
  const tracerParts: Mesh[] = [];
  const windowParts: Mesh[] = [];

  // ---- The mountain the fortress is driven into ----
  const mountain = CreateIcoSphere("mountain", { radius: 34, subdivisions: 7 }, scene);
  // Flatten hard: a sphere reads as a ball, a squashed sphere reads as a massif the tower is
  // driven into. Sunk deep so only the upper crags surface.
  mountain.scaling.set(1.15, 0.92, 1.15);
  mountain.position.y = -26;
  displaceMountain(mountain, rng);
  stoneParts.push(mountain);

  // Molten cracks at the root — the forge, seen from outside.
  for (let i = 0; i < 7; i++) {
    const a = rng.range(0, Math.PI * 2);
    const crack = CreateCylinder(
      "crack",
      { diameterTop: 0.2, diameterBottom: 2.4, height: rng.range(5, 12), tessellation: 6 },
      scene,
    );
    crack.position.set(
      Math.cos(a) * rng.range(12, 21),
      rng.range(1, 6),
      Math.sin(a) * rng.range(12, 21),
    );
    crack.rotation.z = rng.jitter(0.9);
    crack.material = molten;
  }

  // ---- The shaft ----
  const rings = layoutRings(profile);
  for (const ring of rings) {
    // Solid drum so you never see through the slats.
    const drum = CreateCylinder(
      "drum",
      {
        diameterTop: radiusAt(profile, ring.t + 1 / profile.rings) * 1.82,
        diameterBottom: ring.radius * 1.86,
        height: ring.height * 1.02,
        tessellation: 6,
      },
      scene,
    );
    drum.position.y = ring.y + ring.height / 2;
    drum.rotation.y = ring.index * 0.13;
    stoneParts.push(drum);

    stoneParts.push(
      ...slatRing(scene, rng, {
        y: ring.y,
        radius: ring.radius,
        height: ring.height,
        count: ring.slats,
        jag: 0.34 + ring.t * 0.3,
      }),
    );

    if (ring.buttressed) {
      stoneParts.push(
        ...spikeRing(scene, rng, {
          y: ring.y + ring.height * 0.3,
          radius: ring.radius * 1.04,
          count: Math.max(5, Math.round(ring.slats * 0.4)),
          length: 5.5 - ring.t * 2.4,
          tilt: 0.5,
        }),
      );
    }

    // A ledge every third ring gives the eye a scale reference up the shaft.
    if (ring.index % 3 === 2) {
      stoneParts.push(ledge(scene, { y: ring.y + ring.height, radius: ring.radius }));
      const ringTorus = CreateTorus(
        "tracer",
        { diameter: ring.radius * 2.1, thickness: 0.16, tessellation: 40 },
        scene,
      );
      ringTorus.position.y = ring.y + ring.height + 0.5;
      tracerParts.push(ringTorus);
    }

    // Lit windows in the mid-body only — a lit base would kill the sense of a dark foundation.
    if (params.detailPasses > 0 && ring.t > 0.25 && ring.t < 0.85) {
      windowParts.push(
        ...arrowSlits(scene, rng, {
          y: ring.y,
          radius: ring.radius,
          count: Math.round(ring.slats * 0.5),
          height: ring.height,
        }),
      );
    }
  }

  // ---- Subsidiary turrets clustered at the shoulders ----
  const turretCount = 5 + params.detailPasses;
  for (let i = 0; i < turretCount; i++) {
    const a = (i / turretCount) * Math.PI * 2 + 0.4;
    const tBase = 0.16 + rng.next() * 0.12;
    const r = radiusAt(profile, tBase) * 0.92;
    const h = profile.height * rng.range(0.2, 0.34);
    const y = profile.height * tBase;
    const shaft = CreateCylinder(
      "turret",
      { diameterTop: 2.1, diameterBottom: 4.4, height: h, tessellation: 6 },
      scene,
    );
    shaft.position.set(Math.cos(a) * r, y + h / 2, Math.sin(a) * r);
    stoneParts.push(shaft);
    const crown = CreateCylinder(
      "turretCrown",
      { diameterTop: 0, diameterBottom: 3.1, height: 4.6, tessellation: 5 },
      scene,
    );
    crown.position.set(Math.cos(a) * r, y + h + 2.1, Math.sin(a) * r);
    ironParts.push(crown);
  }

  // ---- The crown: iron horns cradling the Eye ----
  const crownY = profile.height;
  const crownRadius = radiusAt(profile, 1);
  // The film's crown is TWO great curved blades that cradle the Eye between them (plus a bowl of
  // smaller teeth below) — not a radial ring of spikes. That silhouette is most of the recognition.
  // Each horn is ONE continuous tube swept along a curve, not a stack of cylinders. The stack was
  // the most obviously low-budget thing left at close range: nine discrete segments at discrete
  // angles produce visible stair-steps down the blade's spine, and no amount of shading hides a
  // silhouette that is literally notched. A tube built from a sampled path is both smoother and
  // fewer draw calls.
  const HORN_SAMPLES = 44;
  for (const side of [-1, 1]) {
    const path: Vector3[] = [];
    for (let i = 0; i < HORN_SAMPLES; i++) {
      const f = i / (HORN_SAMPLES - 1); // 0 at the root, 1 at the tip
      // Sweep out then up: the blade leans away from the eye, then curls back vertical.
      const lean = Math.sin(f * 1.25) * 9.2;
      const rise = f * 33;
      path.push(new Vector3(side * (crownRadius * 0.55 + lean), crownY + rise, 0));
    }
    const horn = CreateTube(
      "horn",
      {
        path,
        // Tapering to a near-point: a blade, not a post. The floor keeps the tip from degenerating
        // into a zero-radius ring, which renders as a pinch artefact.
        radiusFunction: (i) => {
          const f = i / (HORN_SAMPLES - 1);
          return Math.max(0.12, 1.55 * (1 - f) ** 1.35);
        },
        tessellation: 14,
        cap: 3,
      },
      scene,
    );
    ironParts.push(horn);
  }
  // The bowl of teeth beneath the Eye.
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.5 + (i / 8) * Math.PI;
    const tooth = CreateCylinder(
      "tooth",
      { diameterTop: 0, diameterBottom: 1.5, height: 7 + rng.range(0, 4), tessellation: 5 },
      scene,
    );
    tooth.position.set(
      Math.cos(a) * (crownRadius + 1.6),
      crownY + 3.4,
      Math.sin(a) * (crownRadius + 1.6),
    );
    tooth.rotation.z = Math.cos(a) * -0.5;
    tooth.rotation.x = Math.sin(a) * 0.5;
    ironParts.push(tooth);
  }

  // ---- Merge for draw-call sanity, then light them ----
  const merged: Mesh[] = [];
  const finish = (parts: Mesh[], name: string, material: Mesh["material"]): void => {
    if (parts.length === 0) return;
    const m =
      parts.length === 1 ? parts[0] : Mesh.MergeMeshes(parts, true, true, undefined, false, true);
    if (!m) return;
    m.name = name;
    m.material = material;
    m.parent = root;
    m.receiveShadows = true;
    merged.push(m);
  };

  finish(stoneParts, "stone", stone);
  finish(ironParts, "iron", iron);
  finish(tracerParts, "tracers", tracer);
  finish(windowParts, "windows", windowMat);

  return { root, crownY, crownRadius, meshes: merged };
}
