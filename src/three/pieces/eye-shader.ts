/**
 * GLSL for the Eye. The art direction is `docs/art/EYE.md`; this file is its implementation, and the
 * translation table there is the contract each block below answers to.
 *
 * The governing constraint: **the Eye is NAKED.** No lid, no brow, no socket, no stone. Two earlier
 * attempts failed on exactly this — first a billboarded card (flat, and it turned to face the viewer),
 * then a stone shell with the almond cut out of it (dimensional, but it *housed* a thing that must not
 * be housed, so it read as an eyeball under an opaque cover).
 *
 * A THIRD attempt also failed, more subtly (`docs/art/EYE.md` § "The walk-around addendum"): a flame
 * silhouette carved from a sphere by `discard`, which bought real parallax and a real tangent frame —
 * but the far hemisphere was thrown away unconditionally (`if(P.z < 0.0){ discard; }`, a fixed local-
 * space cut, not view-dependent culling), so orbiting behind it found nothing but bloom bleeding
 * through empty air. A skin painted on the front of a sphere is still a skin.
 *
 * A FOURTH attempt overcorrected on the third's own fix (`docs/art/EYE.md` § "the eyeball correction",
 * itself later corrected): it blended the almond into a plain sphere away from the gaze direction, so
 * the eye vanished into a formless round blob outside a narrow front cone — solving 'the body should be
 * round' by breaking 'visible in all directions', which was never supposed to be up for trade. Reverted:
 * the almond stays a full solid of revolution, unconditionally, at every azimuth. Sweeping a wide, short
 * lens 360° around Y already gives it real volume — a plain sphere blend was never required to make it
 * read as dimensional; the raymarch was doing that work the whole time.
 *
 * A fifth attempt (the corona addendum's spikes) also regressed the read — a jagged mandala competing
 * with the eye instead of framing it. Removed outright, not re-tuned a third time; EYE.md's own
 * governing rule is "no lid, no brow, no mercy of stone," and a spike burst is exactly the kind of
 * added housing that rule exists to keep out. The collar (a tight rim at the boundary) and the thin
 * electric filaments — both original, pre-corona elements — stay.
 *
 * THIS version is a **raymarched volume**: for every fragment, a ray is cast from the camera through
 * the bounding sphere's own surface and marched through a real 3D density field — the flame's shape is
 * a solid of revolution (the old 2D vesica swept 360° around the vertical axis), so every horizontal
 * viewing angle sees the identical almond profile, and the back half genuinely keeps burning (duller,
 * slit-less) rather than not existing. Nothing is thrown away by which side of the mesh you're looking
 * at; only by how far a ray actually travels through occupied space.
 *
 * Four things carry the read, in order:
 *  1. **A moving boundary.** The lens-of-revolution's surface is perturbed by animated 3D fbm sampled
 *     at each march step, so tongues peel off while the underlying solid holds its shape — the
 *     volumetric equivalent of the old 2D rim-lick.
 *  2. **Real depth, not faked parallax.** Because this is an actual raymarch through a 3D density
 *     field, the pupil socket, the throat glow and the boundary lip all have genuine depth — no offset
 *     trick is needed to fake a curved cornea; the camera simply sees further or less far into the fire
 *     as it orbits.
 *  3. **An azimuth-gated pupil on an always-present body.** The almond itself never disappears — only
 *     the SLIT is gated to the gaze direction (`frontGate`), so the front reads as an eye and the back
 *     reads as the same eye-shaped fire with no slit — never a hole, and never a shape that stops being
 *     an eye.
 *  4. **The electric affinity at the flame tips.** Thin, near-straight blue-white filaments living only
 *     in the outer fringe, flashing on a quantised clock, plus a second phase-offset layer that
 *     occasionally reads as a branch. Fire is the body; the lightning is the will behind it — so if the
 *     lightning reads as loudly as the flame, the balance is wrong.
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
  // The distance field, shared between the raymarch (evaluated per step) and the outer collar/filament
  // overlay (evaluated at the ray's closest approach). A pure vesica-of-revolution — the old 2D almond
  // swept a full 360° around Y — UNCONDITIONALLY, at every azimuth. A prior pass blended this toward a
  // plain sphere away from the gaze direction (`docs/art/EYE.md` § the eyeball correction) on the
  // reasoning that 'an eyeball is round first' — but that broke the standing, load-bearing requirement
  // that the eye be visible in every direction, trading it for a different property (roundness) nobody
  // asked to trade it for. Reverted: sweeping a wide, short lens 360° around Y is ALREADY volumetric —
  // real depth via the raymarch, real self-occlusion, a real 3D solid — without ever needing a second
  // shape to blend toward. Round and always-visible were never in tension.
  //
  // LENS_SCALE is a deliberately-checked no-op, kept as a named knob rather than removed. First
  // instinct was that this needed rescaling — Q is constrained to |Q| <= 1 while the old P.x/P.y were
  // free flat coordinates — but solving the vesica's ACTUAL near boundary (not the far root of the
  // max()'s other branch, which is a different, irrelevant crossing) gives a horizontal reach of only
  // rho ~= 0.67 and a polar reach of only y ~= 0.26: a wide, short lens that already fits comfortably
  // inside the unit ball at its original proportions — the same proportions the shipped 2D version
  // used, at the same sphere radius, which is exactly why that version read correctly. No rescaling
  // needed. (The real bug behind the first raymarch's teal latitude arcs was the corona/collar/filament
  // overlay being evaluated at the bounding sphere's entry point instead of the ray's actual closest
  // approach to the lens — fixed below via minD/minAng, not via this constant.)",
  "  const float LENS_SCALE = 1.0;",
  "float lensDist(vec3 Q){",
  "  const float SX = 0.70, SY = 0.455, OFF = 0.882, RV = 1.0;",
  "  vec3 Qs = Q * LENS_SCALE;",
  "  float rho = length(Qs.xz);",
  "  vec2 u = vec2(rho * SX, Qs.y * SY);",
  "  return max(length(vec2(u.x, u.y - OFF)), length(vec2(u.x, u.y + OFF))) - RV;",
  "}",
  "void main(void){",
  "  vec3 P = vPosO / iRadius;",
  "  vec3 C = iCamO / iRadius;",
  "  vec3 N = normalize(vNormO);",
  "  vec3 V = normalize(C - P);",
  "  float ndv = max(dot(N, V), 0.0);",
  // ---- THE MARCH: cast the ray from the bounding sphere's own surface, all the way through --------
  // P is already the near intersection (the rendered fragment IS on the sphere); the far root falls out
  // of Vieta's formula for free (tNear*tFar = |C|^2 - 1), no quadratic solve needed.
  "  vec3 rd = normalize(P - C);",
  "  float tNear = length(P - C);",
  "  float tFar = (dot(C, C) - 1.0) / max(tNear, 0.0001);",
  "  float marchLen = max(tFar - tNear, 0.0);",
  "  const int STEPS = 18;",
  "  float dt = marchLen / float(STEPS);",
  "  vec3 accumColor = vec3(0.0);",
  "  float accumAlpha = 0.0;",
  // The corona/collar/spikes are a NEAR-SURFACE phenomenon, but the lens sits well inside the (much
  // larger) bounding sphere used for the march — so "near the surface" cannot be evaluated at the ray's
  // entry point P (that was the bug the first render caught: edgeP at the bounding sphere was uniformly
  // large, so the corona's every gate read true almost everywhere, drawing full latitude arcs). Instead
  // track the ray's CLOSEST APPROACH to the real lens surface from outside, during the same march —
  // the standard raymarched-glow trick — and anchor the corona there instead.
  "  float minD = 999.0;",
  "  float minAng = 0.0;",
  "  for(int i = 0; i < STEPS; i++){",
  "    if(accumAlpha > 0.97){ break; }",
  "    float s = (float(i) + 0.5) * dt;",
  "    vec3 Q = P + rd * s;",
  "    vec3 Qs = Q * LENS_SCALE;",
  "    float core = lensDist(Q);",
  // Boundary turbulence: tongues peel off the lens's own surface, drifting upward — the volumetric
  // twin of the old 2D rim-lick. Sampled in the SAME scaled space as the SDF (Qs, not raw Q) — the
  // 2.4 frequency was tuned against the eye's own [-1,1]-ish extent, which is what Qs represents; at
  // raw Q's compressed scale the same frequency would barely vary across the whole lens. One fbm3 call
  // per step; this is the expensive line, deliberately kept to a single sample.
  "    float turb = fbm3(Qs * 2.4 + vec3(0.0, -iTime * 0.35, 0.0)) - 0.5;",
  "    float d = core - turb * 0.10;",
  "    float dens = smoothstep(0.05, -0.03, d);",
  // ---- THE PUPIL: an absence of density along the gaze plane, gated to the front only -------------
  // `ang` is the true azimuth around Y (0 = the gaze direction). The ALMOND ITSELF is never gated —
  // it's the full solid of revolution from `lensDist` — only the slit is. `frontGate` keeps it off the
  // back half; the eye-shaped fire is present everywhere, but only the front has a socket in it.
  "    float rho = length(Qs.xz);",
  "    float ang = atan(-Qs.x, Qs.z);",
  "    float pupilU = rho * sin(ang);",
  "    float frontGate = smoothstep(-0.15, 0.15, cos(ang));",
  "    float pupilCut = smoothstep(0.115, 0.085, abs(pupilU) * (1.0 + abs(Qs.y) * 0.55)) * frontGate;",
  "    dens *= (1.0 - pupilCut);",
  "    if(d > 0.0 && d < minD){ minD = d; minAng = ang; }",
  "    if(dens > 0.001){",
  // Fine radial grain (the fibre detail), cheap 2D noise keyed off azimuth+height — not a physically
  // separate pass, just texture on the density's brightness. A second, much higher-frequency pass on
  // top is the macro-photo cue: fine capillary-scale grain riding on the coarser fibre pattern, the way
  // a close macro shot of a real iris shows structure at two very different scales at once. Both are
  // 2D `noise()` calls (cheap) — the expense stays in the one fbm3 turbulence sample above.
  "      float grain = noise(vec2(ang * 9.0, Qs.y * 6.0)) - 0.5;",
  "      float microGrain = noise(vec2(ang * 42.0 + Qs.y * 5.0, Qs.y * 34.0 - ang * 3.0)) - 0.5;",
  "      float plasma = clamp(0.55 + 0.85 * turb + grain * 0.12 + microGrain * 0.05, 0.0, 1.0);",
  "      float axisGlow = 1.0 - smoothstep(0.0, 0.34, rho);",
  "      float heat = clamp(plasma * 0.75 + axisGlow * 0.55, 0.0, 1.0);",
  "      vec3 core_c = vec3(1.0, 0.90, 0.72);",
  "      vec3 hot  = vec3(0.98, 0.19, 0.015);",
  "      vec3 scab = vec3(0.66, 0.055, 0.006);",
  "      vec3 deep = vec3(0.34, 0.030, 0.004);",
  "      vec3 sampleCol = mix(deep, scab, smoothstep(0.08, 0.42, heat));",
  "      sampleCol = mix(sampleCol, hot, smoothstep(0.56, 0.88, heat));",
  "      sampleCol += core_c * pow(axisGlow, 3.0) * (0.30 + iPower * 0.34);",
  // The lip: brightest right at the boundary, same as the old 2D version's rim glow.
  "      float lip = exp(-abs(d) / 0.035);",
  "      sampleCol += vec3(1.0, 0.32, 0.05) * lip * 0.65;",
  // Duller round the back: the passage's "banked like coals" — a straight key-light-facing term, no
  // special-cased branch, so it falls naturally out of the existing palette math.
  "      float backDim = mix(0.55, 1.0, frontGate);",
  "      sampleCol *= backDim * (0.55 + iPower * 0.5);",
  "      float a = clamp(dens, 0.0, 1.0) * 0.55;",
  "      accumColor += (1.0 - accumAlpha) * a * sampleCol;",
  "      accumAlpha += (1.0 - accumAlpha) * a;",
  "    }",
  "  }",
  // ---- THE CORONA: collar + azimuthal spikes, anchored to the ray's closest approach ---------------
  // The spike system that used to live here (a mandala of straight rays around the collar) is REMOVED,
  // not re-tuned — it was tuned twice already and still read as clutter competing with the eye rather
  // than framing it, a direct regression against EYE.md's own governing rule ("no lid, no brow, no
  // mercy of stone" — a spike burst is exactly the kind of added housing that rule exists to keep out).
  // What remains are the two original, pre-corona elements: the collar (a tight rim right at the
  // boundary) and the electric filaments below. Anchored at (minD, minAng) — the march's own closest-
  // approach tracker above — NOT at the bounding sphere's entry point; that was a real bug the first
  // raymarch caught (see the comment above the loop).
  "  vec3 coronaColor = vec3(0.0);",
  "  float coronaAlpha = 0.0;",
  "  float collarT = minD / 0.020;",
  "  float collar = exp(-collarT * collarT);",
  "  coronaColor += vec3(1.0, 0.92, 0.80) * collar * (0.55 + iPower * 0.35);",
  "  coronaAlpha += collar;",
  // ---- THE ELECTRIC AFFINITY: current off the mass, branching, tightly bounded -------------------
  // Reframed in-lore as the field a mass this dense drags out of the air around it — gravity well as
  // excuse, EM discharge as consequence (`docs/art/EYE.md` § the gravity-current addendum) — but the
  // mechanism stays the same balance rule as always: two THIN layers at different frequencies and
  // phases, not one thick one, so it reads as a branching arc rather than a single wire, while still
  // losing to the flame on area and colour. Unlike the old surface-evaluated `edge` (near-zero BY
  // CONSTRUCTION on a discarded flame fragment), minD ranges further since it's a genuine closest-
  // approach search — so this needs an explicit upper bound, not just a lower one, or it saturates to 1
  // for any ray passing anywhere near the lens at all. Confined to roughly the collar's own band.
  "  float fringe = 1.0 - smoothstep(-0.02, 0.16, minD);",
  "  float cell = floor(iTime * 8.0);",
  "  float flash = step(0.62, hash(vec2(cell, floor(minAng * 5.0))));",
  "  float fil = pow(max(0.0, 1.0 - abs(noise(vec2(minAng * 9.0, iTime * 2.6)) - 0.5) * 5.0), 10.0);",
  // A second, higher-frequency branch offset in phase and angle — where it happens to cross the first,
  // the two thin ridges read as a fork, the cheap fake for a real Lichtenberg branch.
  "  float branchCell = floor(iTime * 11.0 + 3.7);",
  "  float branchFlash = step(0.74, hash(vec2(branchCell, floor(minAng * 8.0 + 2.0))));",
  "  float branch = pow(max(0.0, 1.0 - abs(noise(vec2(minAng * 17.0 + 5.0, iTime * 3.4)) - 0.5) * 7.0), 12.0);",
  "  float filamentA = clamp(fil * flash + branch * branchFlash * 0.7, 0.0, 1.0) * fringe;",
  "  coronaColor += vec3(0.58, 1.0, 0.94) * filamentA * (0.35 + iPower * 0.30);",
  "  coronaAlpha = max(coronaAlpha, filamentA);",
  // ---- COMPOSITE: the raymarched solid, then the corona over whatever's left ----------------------
  "  vec3 col = accumColor + coronaColor * (1.0 - accumAlpha);",
  "  float alpha = accumAlpha + coronaAlpha * (1.0 - accumAlpha);",
  "  if(alpha < 0.003){ discard; }",
  // One-time Fresnel at the entry point — the cheap stand-in for the old travelling chatoyant sheen
  // (descoped this pass; see the file header). A tighter, brighter second lobe on top reads as the
  // wet-cornea highlight a macro photo of a real eye always shows; noise-broken so it's a highlight,
  // not a uniform plastic sheen.
  "  float fres = pow(1.0 - ndv, 4.0);",
  "  col += vec3(1.0, 0.52, 0.20) * fres * 0.22 * accumAlpha;",
  "  float wetSpec = pow(1.0 - ndv, 9.0) * (0.7 + 0.3 * noise(vPosO.xy * 0.6 + iTime * 0.02));",
  "  col += vec3(1.0, 0.95, 0.88) * wetSpec * 0.5 * accumAlpha;",
  "  gl_FragColor = vec4(min(col, vec3(1.05)), clamp(alpha, 0.0, 1.0));",
  "}",
].join("\n");
