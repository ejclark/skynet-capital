import * as THREE from "three";
import { Bucket } from "../kit/bucket.js";
import { towerMaterials } from "../kit/materials.js";
import type { TowerParams } from "../kit/params.js";
import { crownY, DEFAULT_PROFILE, scaleProfile } from "../kit/profile.js";
import { createRng } from "../kit/rng.js";
import { buildCrown } from "./crown.js";
import { buildFortress } from "./fortress.js";
import { buildGround } from "./massif.js";
import { buildShaft } from "./shaft.js";

/**
 * The Barad-dûr ORGANISM, bottom → top: massif and crags, the stepped fortress, the shaft, the crown
 * and horns. Built from the Barad-dûr design handoff (three.js reference, ported 1:1 — same engine,
 * so the numbers carry over verbatim).
 *
 * It takes `TowerParams` (derived from real standing — see kit/params.ts), so this is a game piece
 * that levels up rather than a fixed prop: power stretches the shaft and lights more of the
 * fortress; health sets how hot the windows burn.
 */

export interface TowerBuild {
  readonly root: THREE.Group;
  /** World-space centre of the crown bowl — the Eye hangs 30 above it. */
  readonly crown: THREE.Vector3;
  readonly materials: ReturnType<typeof towerMaterials>;
}

/** The seed that reproduces the handoff's composition. Determinism is what makes shot diffs mean something. */
const SEED = 90210;

export function buildTower(params: TowerParams): TowerBuild {
  const rng = createRng(SEED);
  const profile = scaleProfile(DEFAULT_PROFILE, params.power);
  const root = new THREE.Group();
  root.name = "barad-dur";
  const materials = towerMaterials(params.forgeIntensity);
  const windowBoost = 1 + params.detailPasses * 0.15;

  const b = new Bucket();
  buildGround(b, rng);
  buildFortress(b, rng, windowBoost);
  const { ox, oz } = buildShaft(b, rng, profile, windowBoost);
  const cy = crownY(profile);
  buildCrown(b, rng, ox, cy, oz);
  b.flush(root, materials);

  return { root, crown: new THREE.Vector3(ox, cy, oz), materials };
}
