/**
 * Shared GLSL noise for the Eye — value-noise fbm (2D) and its 3D counterpart, used for fire churn,
 * rim tongues and fibre irregularity in `eye-shader.ts` (art direction: `docs/art/EYE.md`). Split out
 * of that file purely to stay under Biome's file-length budget; this block is otherwise unchanged and
 * has no independent behavior of its own — it exists to be spliced verbatim into `GLOBE_FRAGMENT`.
 */
export const NOISE = [
  "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }",
  "float noise(vec2 p){",
  "  vec2 i = floor(p); vec2 f = fract(p);",
  "  vec2 u = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
  "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
  "}",
  "float fbm(vec2 p){",
  "  float v = 0.0; float a = 0.5;",
  "  for(int i = 0; i < 6; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }",
  "  return v;",
  "}",
  // 3D counterparts for the raymarch — the volume is sampled at real 3D points, not a 2D iris
  // parametrization, so the turbulence driving it needs a genuine 3D field. Kept to 3 octaves (vs the
  // 2D fbm's 6): this runs once per MARCH STEP, not once per fragment, so the cost multiplies fast.
  "float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }",
  "float noise3(vec3 p){",
  "  vec3 i = floor(p); vec3 f = fract(p);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  float n000 = hash3(i + vec3(0.0, 0.0, 0.0)); float n100 = hash3(i + vec3(1.0, 0.0, 0.0));",
  "  float n010 = hash3(i + vec3(0.0, 1.0, 0.0)); float n110 = hash3(i + vec3(1.0, 1.0, 0.0));",
  "  float n001 = hash3(i + vec3(0.0, 0.0, 1.0)); float n101 = hash3(i + vec3(1.0, 0.0, 1.0));",
  "  float n011 = hash3(i + vec3(0.0, 1.0, 1.0)); float n111 = hash3(i + vec3(1.0, 1.0, 1.0));",
  "  float nx00 = mix(n000, n100, f.x); float nx10 = mix(n010, n110, f.x);",
  "  float nx01 = mix(n001, n101, f.x); float nx11 = mix(n011, n111, f.x);",
  "  float nxy0 = mix(nx00, nx10, f.y); float nxy1 = mix(nx01, nx11, f.y);",
  "  return mix(nxy0, nxy1, f.z);",
  "}",
  "float fbm3(vec3 p){",
  "  float v = 0.0; float a = 0.5;",
  "  for(int i = 0; i < 3; i++){ v += a * noise3(p); p *= 2.05; a *= 0.5; }",
  "  return v;",
  "}",
].join("\n");
