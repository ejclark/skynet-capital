/**
 * GLSL for the Eye. The art direction is `docs/art/EYE.md`; this file is its implementation, and the
 * translation table there is the contract each block below answers to.
 *
 * The governing constraint: **the Eye is NAKED.** No lid, no brow, no socket, no stone. Two earlier
 * attempts failed on exactly this — first a billboarded card (flat, and it turned to face the viewer),
 * then a stone shell with the almond cut out of it (dimensional, but it *housed* a thing that must not
 * be housed, so it read as an eyeball under an opaque cover). The almond here is the FLAME'S OWN
 * SILHOUETTE, carved out of a sphere by `discard`. Nothing holds its edge.
 *
 * Keeping a sphere underneath is what buys the dimensionality a flat card cannot have — a real normal,
 * a real tangent frame, real parallax — while the discard means you never see the sphere *as* a sphere.
 * You see an almond of fire that happens to bulge toward you.
 *
 * Four things carry the read, in order:
 *  1. **A moving edge.** The vesica boundary is displaced by animated fbm, so tongues peel off the rim
 *     and gutter out while the underlying shape holds. A hard-edged almond reads as a decal; this is
 *     the largest single difference between "fire" and "a picture of fire".
 *  2. **Parallax refraction.** The iris samples at an offset along the view direction's tangential
 *     component, so the pupil sits behind a curved cornea and slides as the camera orbits.
 *  3. **Chatoyancy.** Radial fibres + an anisotropic Kajiya-Kay lobe put a bright band ACROSS them that
 *     travels with light and view — tiger's-eye, never where you left it. A static highlight fails the
 *     brief by definition.
 *  4. **The electric affinity at the flame tips.** Thin, near-straight blue-white filaments living only
 *     in the outer fringe, flashing on a quantised clock. Fire is the body; the lightning is the will
 *     behind it — so if the lightning reads as loudly as the flame, the balance is wrong.
 */

/** Shared noise — value-noise fbm, used for fire churn, rim tongues and fibre irregularity. */
const NOISE = [
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
].join("\n");

export const GLOBE_VERTEX = [
  "precision highp float;",
  "attribute vec3 position;",
  "attribute vec3 normal;",
  "uniform mat4 worldViewProjection;",
  // Object space is where all the eye math lives: the iris axis is +Z and the lid axis is +Y by
  // construction, so no basis has to be reconstructed per-fragment.
  "varying vec3 vPosO;",
  "varying vec3 vNormO;",
  "void main(void){",
  "  vPosO = position;",
  "  vNormO = normal;",
  "  gl_Position = worldViewProjection * vec4(position, 1.0);",
  "}",
].join("\n");

export const GLOBE_FRAGMENT = [
  "precision highp float;",
  "varying vec3 vPosO;",
  "varying vec3 vNormO;",
  "uniform float iTime;",
  "uniform float iPower;",
  // Camera and key light in OBJECT space (computed on the CPU each frame — cheaper and far simpler
  // than inverting a mat4 in GLSL ES 1.0).
  "uniform vec3 iCamO;",
  "uniform vec3 iLightO;",
  // The eyeball's radius, so every length below is in UNIT sphere space. Working in raw object units
  // is what silently erased the fire once already: the iris radius ran to 7.6, every falloff keyed to
  // ~1.0 clamped out, and all that survived was the sheen — a pale wax ball.
  "uniform float iRadius;",
  NOISE,
  "void main(void){",
  "  vec3 P = vPosO / iRadius;",
  "  vec3 C = iCamO / iRadius;",
  "  vec3 N = normalize(vNormO);",
  "  vec3 V = normalize(C - P);",
  "  float ndv = max(dot(N, V), 0.0);",
  // The back of the sphere is never the Eye — kill it before spending anything on it.
  "  if(P.z < 0.0){ discard; }",
  // ---- THE ALMOND, cut from the flame itself -----------------------------------------------------
  // Vesica: two circles offset on Y and intersected, scaled anisotropically so it reads predator-wide
  // rather than round. SX widens, SY flattens; these two numbers ARE the eye's proportions.
  "  const float SX = 0.70, SY = 0.455, OFF = 0.882, RV = 1.0;",
  "  vec2 u = vec2(P.x * SX, P.y * SY);",
  "  float dm = max(length(vec2(u.x, u.y - OFF)), length(vec2(u.x, u.y + OFF)));",
  // The rim is DISPLACED by animated noise: tongues of flame peel off and gutter out while the
  // underlying almond holds its shape. Two octaves at different speeds, advected inward-and-around, so
  // the motion never reads as one pulsing outline.
  "  float ang = atan(P.y, P.x);",
  "  float lick = fbm(vec2(ang * 3.4, dm * 5.0 - iTime * 1.4)) - 0.5;",
  "  float lick2 = fbm(vec2(ang * 9.5 + 11.0, dm * 11.0 - iTime * 2.6)) - 0.5;",
  "  float edge = dm - (RV + lick * 0.055 + lick2 * 0.028);",
  // Past the tongues there is nothing. This is the naked silhouette — no stone, no lid, no plate.
  "  if(edge > 0.030){ discard; }",
  // ---- THE FIRE ---------------------------------------------------------------------------------
  // Parallax refraction first: push the sample point along the view direction's tangential part, by an
  // amount that grows with obliquity, so the iris sits behind a curved cornea.
  "  vec3 Vt = V - N * dot(V, N);",
  "  float depth = 0.32 * (1.0 - ndv * 0.55);",
  "  vec2 iris = P.xy - Vt.xy * depth;",
  "  float r = length(iris);",
  "  float airis = atan(iris.y, iris.x);",
  // Domain-warped fbm, dragged upward — churn that lives INSIDE the eye.
  "  vec2 q = iris * 2.6;",
  "  vec2 w = vec2(fbm(q * 1.9 + iTime * 0.21), fbm(q * 1.7 - iTime * 0.16));",
  "  float plasma = fbm(q * 3.1 + w * 2.3 + vec2(0.0, iTime * 0.55));",
  "  plasma = plasma * 0.82 + fbm(q * 9.5 + w * 3.0 + vec2(0.0, iTime * 1.1)) * 0.26;",
  "  float radial = 1.0 - smoothstep(0.42, 1.45, r);",
  "  float heat = clamp(plasma * 1.30 * radial + radial * 0.40, 0.0, 1.0);",
  // ---- THE SLIT: vertical, absolute, no fire in it at all ----------------------------------------
  "  float slit = smoothstep(0.125, 0.088, abs(iris.x) * (1.0 + abs(iris.y) * 0.60));",
  // ---- CHATOYANCY -------------------------------------------------------------------------------
  // Fibres run radially out of the pupil. T is that direction on the surface; the Kajiya-Kay lobe
  // peaks where the half-vector is PERPENDICULAR to T, laying a bright band across the fibres.
  "  vec3 Traw = vec3(iris / max(r, 0.001), 0.0);",
  "  vec3 T = normalize(Traw - N * dot(Traw, N));",
  "  vec3 H = normalize(V + normalize(iLightO));",
  "  float tdh = dot(T, H);",
  "  float sinTH = sqrt(max(0.0, 1.0 - tdh * tdh));",
  "  float fibre = 0.88 + 0.22 * noise(vec2(airis * 2.2, iTime * 0.06));",
  "  float sheen = pow(sinTH, 14.0) * 0.40 + pow(sinTH, 4.0) * 0.12;",
  "  sheen *= fibre * (1.0 - slit) * smoothstep(0.26, 0.60, r) * (1.0 - smoothstep(-0.40, -0.06, edge));",
  // ---- PALETTE: a forge at the hour the smith stops singing --------------------------------------
  "  vec3 core = vec3(1.0, 0.90, 0.72);",
  "  vec3 hot  = vec3(1.0, 0.30, 0.03);",
  "  vec3 scab = vec3(0.78, 0.085, 0.010);",
  "  vec3 deep = vec3(0.34, 0.030, 0.004);",
  "  vec3 col = mix(deep, scab, smoothstep(0.08, 0.42, heat));",
  "  col = mix(col, hot, smoothstep(0.44, 0.80, heat));",
  // The white throat: small, central, and gone the moment the pupil covers it.
  "  float throat = (1.0 - smoothstep(0.03, 0.30, r)) * (1.0 - slit);",
  "  col += core * pow(throat, 2.4) * (0.55 + iPower * 0.55);",
  "  col += vec3(1.0, 0.62, 0.26) * sheen * (0.42 + iPower * 0.45);",
  // Absolute. No glow in it anywhere.
  "  col *= 1.0 - slit;",
  // ---- THE LIP: hottest where the flame is thinnest ---------------------------------------------
  // A real flame is brightest at its boundary, not its middle. Doubles as cover for the discard edge.
  "  float lipT = edge / 0.075;",
  "  float lip = exp(-lipT * lipT);",
  "  col += vec3(1.0, 0.34, 0.06) * lip * 0.62;",
  // ---- THE ELECTRIC AFFINITY: filaments at the flame tips ----------------------------------------
  // Outer fringe only, and only sometimes. `flash` quantises time into ~8/s cells behind a random gate
  // so an arc is gone before the eye finds it; `fil` is a thin ridge of high-frequency noise, so it
  // reads as a filament rather than more flame. Brand-electric teal-white — the lore's secondary
  // affinity landing on the design system's accent.
  "  float fringe = smoothstep(-0.12, 0.01, edge);",
  "  float cell = floor(iTime * 8.0);",
  "  float flash = step(0.62, hash(vec2(cell, floor(ang * 5.0))));",
  "  float fil = pow(max(0.0, 1.0 - abs(noise(vec2(ang * 9.0, iTime * 2.6)) - 0.5) * 5.0), 10.0);",
  "  col += vec3(0.58, 1.0, 0.94) * fil * flash * fringe * (0.35 + iPower * 0.30);",
  // ---- Corneal fresnel: the wet-sphere cue -------------------------------------------------------
  "  float fres = pow(1.0 - ndv, 4.0);",
  "  col += vec3(1.0, 0.52, 0.20) * fres * 0.30;",
  "  col *= 0.36 + iPower * 0.28;",
  // Alpha feathers the last sliver of the tongues into the night, so the discard boundary is never a
  // visible cut. Everything inboard of the lip stays fully opaque, so the Eye still occludes properly.
  "  float alpha = 1.0 - smoothstep(-0.006, 0.030, edge);",
  "  gl_FragColor = vec4(min(col, vec3(1.05)), alpha);",
  "}",
].join("\n");
