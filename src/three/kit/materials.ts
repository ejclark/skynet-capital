import { Effect } from "@babylonjs/core/Materials/effect";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { CustomProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/customProceduralTexture";
import { Color3 } from "@babylonjs/core/Maths/math";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Shaders/procedural.vertex";

/**
 * The MATERIAL atoms. Everything here is PBR (metallic/roughness) — the previous spike used
 * `StandardMaterial`, which is why it read flat no matter how much geometry got thrown at it:
 * Standard has no energy conservation and no environment response, so stone looked like painted
 * cardboard. PBR + the IBL from env.ts is the actual fidelity jump.
 *
 * All texture detail is PROCEDURAL — no image assets to fetch, so the scene stays self-contained
 * and deterministic for screenshot verification.
 */

/**
 * Tangent-space NORMAL map, generated procedurally.
 *
 * `bumpTexture` is a normal map — Babylon decodes RGB as the XYZ of a surface normal. We were feeding
 * it a GREYSCALE `NoiseProceduralTexture`, so every texel decoded to R=G=B, i.e. a normal pointing on
 * the constant diagonal (1,1,1) with only its length wobbling. That is not relief: it tilts the whole
 * surface one way and jitters the specular term, which is why the masonry read as fine sparkle rather
 * than as rock. A height field has to be DIFFERENTIATED before it can act as a normal.
 *
 * So: sample fbm at the texel and at one step in u and v, and emit the gradient. Central differences
 * would be marginally better; forward differences are half the taps and the error is invisible at this
 * amplitude. Kept procedural (no image assets) so the scene stays self-contained and deterministic for
 * screenshot verification.
 */
const STONE_NORMAL_FRAGMENT = [
  "precision highp float;",
  "varying vec2 vUV;",
  "uniform float uStrength;",
  "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }",
  "float noise(vec2 p){",
  "  vec2 i = floor(p); vec2 f = fract(p);",
  "  vec2 u = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
  "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
  "}",
  // Persistence BELOW 1 so octaves actually decay. The old texture ran persistence 0.94 over 8
  // octaves, which is near-white-noise — every octave contributed almost equally and the fine
  // detail buried the coarse shapes instead of sitting on top of them.
  "float fbm(vec2 p){",
  "  float v = 0.0; float a = 0.5;",
  "  for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }",
  "  return v;",
  "}",
  "void main(void) {",
  "  float e = 1.0 / 512.0;",
  "  vec2 p = vUV * 18.0;",
  "  float h  = fbm(p);",
  "  float hx = fbm(p + vec2(e * 18.0, 0.0));",
  "  float hy = fbm(p + vec2(0.0, e * 18.0));",
  // Gradient -> tangent-space normal. Negated because a rise in height tilts the normal AWAY.
  "  vec3 n = normalize(vec3(-(hx - h) * uStrength, -(hy - h) * uStrength, 1.0));",
  "  gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);",
  "}",
].join("\n");

Effect.ShadersStore.stoneNormalPixelShader = STONE_NORMAL_FRAGMENT;

function stoneNormal(scene: Scene): CustomProceduralTexture {
  const t = new CustomProceduralTexture("stoneNormal", "stoneNormal", 512, scene);
  t.setFloat("uStrength", 42.0);
  t.refreshRate = 0; // static: the rock must not shimmer between frames
  return t;
}

let cachedNoise: CustomProceduralTexture | undefined;
function sharedNoise(scene: Scene): CustomProceduralTexture {
  if (!cachedNoise || cachedNoise.getScene() !== scene) cachedNoise = stoneNormal(scene);
  return cachedNoise;
}

/** Weathered basalt — the fortress bulk. Rough, near-dielectric, faintly iridescent at grazing angles. */
export function basaltMaterial(scene: Scene, tint?: Color3): PBRMaterial {
  const m = new PBRMaterial("basalt", scene);
  // Albedo has a legal range: nothing real reflects less than ~4% diffuse, and fresh charcoal — the
  // darkest natural material there is — sits near 0.04. We were at 0.03, darker than anything that
  // exists, which is why the tower read as a hole in the frame rather than as stone at night. 0.055
  // is dark volcanic rock, and it finally has a value the night can be separated FROM.
  m.albedoColor = tint ?? new Color3(0.055, 0.058, 0.068);
  m.metallic = 0.12;
  m.roughness = 0.94;
  m.bumpTexture = sharedNoise(scene);
  m.bumpTexture.level = 1.05;
  // Slight sheen at grazing angles reads as wet/volcanic glass rather than dry concrete — which is
  // what the old `metallicF0Factor = 0.06` here CLAIMED to do and did the exact opposite of. Babylon
  // defines `F90 = metallicF0Factor` (and F0 = defaultF0 * factor), so 0.06 crushed grazing-angle
  // reflectance to 6% and normal-incidence to 0.24%. It deleted the sheen it was commented as adding.
  // The sheen belongs in the IOR instead: 1.6 is volcanic glass, and F90 stays where physics puts it.
  m.indexOfRefraction = 1.6;
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
