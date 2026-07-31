/**
 * GLSL for the Eye. Two shaders, because the Eye is now two real objects rather than one flat card:
 *
 *  - GLOBE — the fiery eyeball itself, an OPAQUE SPHERE. Every bit of dimensionality comes from that
 *    choice: a real surface normal (so light and view direction mean something), real depth writes
 *    (so the stone in front of it genuinely occludes it), and a real tangent frame (so the iris can
 *    be refracted *into* the ball and the fibres can catch light anisotropically).
 *  - SOCKET — a stone SHELL wrapped concentrically around the globe, with the almond aperture cut out
 *    of it by `discard`. A shell rather than a faceplate because a flat plate only works from
 *    head-on: swing the camera and you see its slab silhouette and the eyeball bulging past its
 *    edge. Wrapping the stone means the fire is visible ONLY through the opening, from every angle,
 *    and the aperture rim lands on a curved surface — which is where its sense of thickness comes
 *    from. The shell is fixed to the tower while the globe rotates behind it, so the eye looks
 *    around instead of the whole assembly swinging to face the camera (the old billboard, and the
 *    reason the physics read wrong).
 *
 * The three effects that read as "real eye", in order of how much they carry:
 *  1. **Parallax refraction.** The iris is sampled at an offset along the view direction's tangential
 *     component, so the pupil sits *behind* a curved cornea and slides as the camera orbits. This is
 *     the single strongest depth cue an eye has, and no flat card can fake it.
 *  2. **Chatoyancy** (the cat's-eye). Fibres radiate from the pupil; an anisotropic Kajiya-Kay lobe
 *     puts a bright band PERPENDICULAR to them — a slash across the eye that travels with the light
 *     and the viewer, exactly like a cabochon of tiger's-eye. It is view-dependent by construction,
 *     which is the whole point: a painted-on highlight doesn't move, so it never convinces.
 *  3. **Corneal fresnel + limbal ring.** A glassy grazing-angle sheen and a dark ring where the
 *     sclera turns away: the two cues that say "wet sphere" rather than "disc".
 */

/** Shared noise — value-noise fbm, used for fire churn and fibre irregularity. */
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
  // ---- 1. PARALLAX REFRACTION -------------------------------------------------------------------
  // Project the sphere onto the iris plane, then push the sample point along the view direction's
  // tangential part. Depth scales with how obliquely we're looking (1-ndv), so the pupil swings
  // inside the eye as the camera orbits — the cue that sells a curved cornea over a sunken iris.
  "  vec3 Vt = V - N * dot(V, N);",
  "  float depth = 0.34 * (1.0 - ndv * 0.55);",
  "  vec2 iris = P.xy - Vt.xy * depth;",
  "  float r = length(iris);",
  "  float ang = atan(iris.y, iris.x);",
  // ---- 2. THE FIRE ------------------------------------------------------------------------------
  // Domain-warped fbm in refracted iris coords, so the churn lives *inside* the ball.
  "  vec2 q = iris * 2.6;",
  "  vec2 w = vec2(fbm(q * 1.9 + iTime * 0.17), fbm(q * 1.7 - iTime * 0.13));",
  "  float plasma = fbm(q * 3.1 + w * 2.2 + vec2(0.0, iTime * 0.46));",
  "  float radial = 1.0 - smoothstep(0.05, 1.02, r);",
  "  float heat = clamp(plasma * 1.45 * radial + radial * 0.26, 0.0, 1.0);",
  // ---- The slit pupil, deep in the refracted frame ----------------------------------------------
  "  float slit = smoothstep(0.135, 0.055, abs(iris.x) * (1.0 + abs(iris.y) * 0.55));",
  // ---- 3. CHATOYANCY ---------------------------------------------------------------------------
  // Fibres run radially out of the pupil. T is that direction on the surface; the Kajiya-Kay lobe
  // peaks where the half-vector is PERPENDICULAR to T, which lays a bright band across the fibres.
  // Broken up by fbm along the angle so it shimmers like stone rather than glowing like plastic.
  "  vec3 T = normalize(vec3(iris / max(r, 0.001), 0.0) - N * dot(vec3(iris / max(r, 0.001), 0.0), N));",
  "  vec3 H = normalize(V + normalize(iLightO));",
  "  float tdh = dot(T, H);",
  "  float sinTH = sqrt(max(0.0, 1.0 - tdh * tdh));",
  "  float fibre = 0.68 + 0.62 * fbm(vec2(ang * 9.0, r * 4.0 + iTime * 0.05));",
  "  float sheen = pow(sinTH, 34.0) * 2.1 + pow(sinTH, 5.0) * 0.30;",
  "  sheen *= fibre * (1.0 - slit * 0.9) * smoothstep(0.02, 0.5, r);",
  // ---- Palette ---------------------------------------------------------------------------------
  "  vec3 core = vec3(1.0, 0.74, 0.34);",
  "  vec3 hot  = vec3(1.0, 0.40, 0.05);",
  "  vec3 mid  = vec3(0.80, 0.12, 0.01);",
  "  vec3 rim  = vec3(0.30, 0.04, 0.005);",
  "  vec3 col = mix(rim, mid, smoothstep(0.10, 0.44, heat));",
  "  col = mix(col, hot, smoothstep(0.40, 0.73, heat));",
  "  col = mix(col, core, smoothstep(0.93, 1.0, heat));",
  // The pupil is a hard black void, as in the reference — the fire must not leak into it.
  "  col = mix(col, vec3(0.004, 0.001, 0.0), slit);",
  // Chatoyant band, warm-white so it reads as reflected light rather than more fire.
  "  col += vec3(1.0, 0.66, 0.30) * sheen * (0.42 + iPower * 0.45);",
  // ---- Limbal ring + corneal fresnel: the sphere's shoulders --------------------------------------
  "  col *= 1.0 - smoothstep(0.62, 1.0, r) * 0.72;",
  "  float fres = pow(1.0 - ndv, 4.0);",
  "  col += vec3(1.0, 0.52, 0.20) * fres * 0.34;",
  "  col *= 0.34 + iPower * 0.26;",
  "  gl_FragColor = vec4(min(col, vec3(1.05)), 1.0);",
  "}",
].join("\n");

export const SOCKET_VERTEX = [
  "precision highp float;",
  "attribute vec3 position;",
  "uniform mat4 worldViewProjection;",
  "varying vec3 vPosO;",
  "void main(void){",
  "  vPosO = position;",
  "  gl_Position = worldViewProjection * vec4(position, 1.0);",
  "}",
].join("\n");

export const SOCKET_FRAGMENT = [
  "precision highp float;",
  "varying vec3 vPosO;",
  "uniform float iPower;",
  "uniform float iRadius;",
  NOISE,
  "void main(void){",
  "  vec3 P = vPosO / iRadius;",
  // Everything behind the eye is wasted fill — the opaque globe hides it.
  "  if(P.z < -0.25){ discard; }",
  // The vesica, cut into stone. Two circles offset vertically and intersected gives a wide lens
  // tapering to points at the canthi. The anisotropic scale sets the almond's proportions here in one
  // place: SX widens it, SY flattens it. Current values give a half-width of ~0.75 and a half-height
  // of ~0.30 of the eyeball — the reference's wide lens, not a circle and not a slot.
  "  const float SX = 0.68, SY = 0.467, OFF = 0.86, RV = 1.0;",
  "  vec2 u = vec2(P.x * SX, P.y * SY);",
  "  float dm = max(length(vec2(u.x, u.y - OFF)), length(vec2(u.x, u.y + OFF)));",
  "  if(dm < RV && P.z > 0.0){ discard; }",
  // Bevel: stone just outside the opening faces the fire and catches it, so the rim glows hottest and
  // falls off fast. This is what gives the aperture edge its thickness.
  "  float bevel = 1.0 - smoothstep(RV, RV + 0.17, dm);",
  "  float grain = fbm(P.xy * 11.0) * 0.30 + fbm(P.xy * 38.0) * 0.16;",
  "  vec3 stone = vec3(0.042, 0.040, 0.047) * (0.55 + grain);",
  "  stone += vec3(1.0, 0.30, 0.07) * bevel * bevel * (0.40 + iPower * 0.45);",
  // The shell's inner face (visible through the opening as the socket wall) stays near-black, lit
  // only by the fire it surrounds.
  "  if(P.z <= 0.0){ stone *= 0.35; }",
  "  gl_FragColor = vec4(stone, 1.0);",
  "}",
].join("\n");
