import * as THREE from "three";
import type { MatKey } from "./bucket.js";

/**
 * The MATERIAL atoms — the tower's four surfaces, straight from the Barad-dûr design handoff's
 * token table. Rock and basalt are flat-shaded: facets carry the detail, and they keep a low-poly
 * massif reading as hewn rather than melted.
 */

/** Emissive strength of the lit slits at full heat — the scene flickers it ±8%. */
export const EMBER_EMISSIVE = 1.7;

/**
 * @param heat scales the lit slits (TowerParams.forgeIntensity) — a bleeding account's fortress
 *   burns lower; it never goes dark.
 */
export function towerMaterials(heat: number): Record<MatKey, THREE.MeshStandardMaterial> {
  return {
    rock: new THREE.MeshStandardMaterial({
      name: "rock",
      color: 0x2a2725,
      roughness: 0.97,
      metalness: 0,
      flatShading: true,
    }),
    basalt: new THREE.MeshStandardMaterial({
      name: "basalt",
      color: 0x17191d,
      roughness: 0.8,
      metalness: 0.18,
      flatShading: true,
    }),
    iron: new THREE.MeshStandardMaterial({
      name: "iron",
      color: 0x35302b,
      roughness: 0.48,
      metalness: 0.4,
    }),
    ember: new THREE.MeshStandardMaterial({
      name: "ember",
      color: 0x1a0600,
      emissive: 0xff7a2e,
      emissiveIntensity: EMBER_EMISSIVE * heat,
      roughness: 1,
    }),
  };
}
