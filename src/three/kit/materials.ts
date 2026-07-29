import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { NoiseProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/noiseProceduralTexture";
import { Color3 } from "@babylonjs/core/Maths/math";
import type { Scene } from "@babylonjs/core/scene";

/**
 * The MATERIAL atoms. Everything here is PBR (metallic/roughness) — the previous spike used
 * `StandardMaterial`, which is why it read flat no matter how much geometry got thrown at it:
 * Standard has no energy conservation and no environment response, so stone looked like painted
 * cardboard. PBR + the IBL from env.ts is the actual fidelity jump.
 *
 * All texture detail is PROCEDURAL — no image assets to fetch, so the scene stays self-contained
 * and deterministic for screenshot verification.
 */

/** Multi-octave noise, reused as a bump/detail source across materials (built once per scene). */
function stoneNoise(scene: Scene): NoiseProceduralTexture {
  const n = new NoiseProceduralTexture("stoneNoise", 512, scene);
  n.octaves = 8;
  n.persistence = 0.94;
  n.brightness = 0.5;
  n.animationSpeedFactor = 0; // static: the rock must not shimmer between frames
  return n;
}

let cachedNoise: NoiseProceduralTexture | undefined;
function sharedNoise(scene: Scene): NoiseProceduralTexture {
  if (!cachedNoise || cachedNoise.getScene() !== scene) cachedNoise = stoneNoise(scene);
  return cachedNoise;
}

/** Weathered basalt — the fortress bulk. Rough, near-dielectric, faintly iridescent at grazing angles. */
export function basaltMaterial(scene: Scene, tint?: Color3): PBRMaterial {
  const m = new PBRMaterial("basalt", scene);
  m.albedoColor = tint ?? new Color3(0.03, 0.034, 0.042);
  m.metallic = 0.12;
  m.roughness = 0.94;
  m.bumpTexture = sharedNoise(scene);
  m.bumpTexture.level = 1.05;
  // Slight sheen at grazing angles reads as wet/volcanic glass rather than dry concrete.
  m.metallicF0Factor = 0.06;
  m.environmentIntensity = 0.45;
  return m;
}

/** Blackened iron for the crown, horns and turret caps — catches the key light hard. */
export function ironMaterial(scene: Scene): PBRMaterial {
  const m = new PBRMaterial("iron", scene);
  m.albedoColor = new Color3(0.04, 0.045, 0.055);
  m.metallic = 0.88;
  m.roughness = 0.42;
  m.bumpTexture = sharedNoise(scene);
  m.bumpTexture.level = 0.55;
  m.environmentIntensity = 1.25; // metal lives or dies on its reflections
  return m;
}

/**
 * Self-lit accent (tracer rings, arrow-slit windows). Unlit + emissive so it survives the ACES
 * curve as a crisp line instead of being tone-mapped into the fog.
 */
export function emissiveMaterial(scene: Scene, color: Color3, strength = 1): PBRMaterial {
  const m = new PBRMaterial("emissive", scene);
  m.albedoColor = new Color3(0, 0, 0);
  m.metallic = 0;
  m.roughness = 1;
  m.emissiveColor = color;
  m.emissiveIntensity = strength;
  m.unlit = false;
  m.disableLighting = true;
  return m;
}

/** Molten rock at the fortress root — the forge seen through cracks in the mountain. */
export function moltenMaterial(scene: Scene, heat: number): PBRMaterial {
  const m = new PBRMaterial("molten", scene);
  m.albedoColor = new Color3(0.14, 0.03, 0.01);
  m.metallic = 0.05;
  m.roughness = 0.65;
  m.emissiveColor = new Color3(1.0, 0.32, 0.07).scale(Math.max(0.05, heat));
  m.emissiveIntensity = 1.4;
  m.bumpTexture = sharedNoise(scene);
  m.bumpTexture.level = 1.4;
  return m;
}
