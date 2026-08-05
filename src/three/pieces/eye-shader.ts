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
 * round' by breaking 'visible in all directions', which was never supposed to be up for trade.
 *
 * A fifth attempt (the corona addendum's spikes) also regressed the read — a jagged mandala competing
 * with the eye instead of framing it.
 *
 * THIS (sixth) version resolves the actual tension the fourth attempt was reaching for, correctly:
 * **the SHAPE is an unconditional sphere; the eye is a texture, not a cut.** `lensDist` is now
 * `length(Q) - R` — nothing simpler, nothing that can go directional. That shape is *trivially* the
 * same from every angle, by construction, forever; there is no gate, blend, or azimuth term anywhere
 * that can make it vanish or distort. The iris/pupil/electric detail — the part that makes it read as
 * an EYE rather than a coal — is a colour/emission overlay keyed to `faceCos` (how directly a point
 * faces the gaze direction), never a change to the density field itself. Facing the gaze: full iris
 * detail, forge palette, pupil slit, a vein of current. Elsewhere: the same sphere, still burning,
 * plainer — an ember, not a blind spot. Round and eye-like were never actually in tension; conflating
 * "shape" with "surface decoration" was the mistake in the fourth attempt, corrected here by keeping
 * them in genuinely separate math (a density field vs. a colour term), not just separate variables.
 *
 * Four things carry the read, in order:
 *  1. **A moving boundary.** The sphere's surface is perturbed by animated 3D fbm sampled at each march
 *     step, so tongues peel off while the underlying solid holds its shape.
 *  2. **Real depth, not faked parallax.** A genuine raymarch through a 3D density field — the pupil
 *     socket, the throat glow and the boundary lip all have real depth; the camera simply sees further
 *     or less far into the fire as it orbits.
 *  3. **An iris that fades in facing the gaze, on a sphere that never changes shape.** `irisWeight`
 *     (a smooth function of `faceCos`) blends between rich iris detail (palette, grain, pupil slit) and
 *     plain ember sclera — texture only, the sphere's own silhouette is invariant under this blend.
 *  4. **The electric affinity.** Thin, near-straight blue-white filaments at the outer fringe (the
 *     collar/corona, anchored to the ray's closest approach — unchanged by the shape simplification),
 *     plus a vein of current inside the iris itself. Fire is the body; the lightning is the will behind
 *     it — so if the lightning reads as loudly as the flame, the balance is wrong.
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
  // overlay (evaluated at the ray's closest approach). A PLAIN SPHERE — deliberately the simplest
  // possible field, with nothing in it that can read as directional. R = 0.62 sits comfortably inside
  // the unit bounding sphere (P is always at |P| = 1, the bounding mesh's own surface), leaving margin
  // for real raymarch depth on the way in and room for the corona to extend past it on the way out.",
  "  const float R = 0.62;",
  "float lensDist(vec3 Q){",
  "  return length(Q) - R;",
  "}",
  "void main(void){",
  "  vec3 P = vPosO / iRadius;",
  "  vec3 C = iCamO / iRadius;",
  "  vec3 N = normalize(vNormO);",
  "  vec3 V = normalize(C - P);",
  "  float ndv = max(dot(N, V), 0.0);",
  // `T` wraps the raw uniform ONCE, here, and every animated term below reads T, never iTime
  // directly. iTime grows unboundedly for as long as the page stays open — this shader multiplies it
  // by up to 11x before feeding floor()/hash()/noise(), and `precision highp float` is NOT guaranteed
  // in the fragment shader on real hardware (the GLSL ES spec makes fragment highp optional; plenty of
  // mobile GPUs silently run it at mediump regardless of the declaration). Once a multiplied time value
  // outgrows mediump's precision — verified on a real Pixel 6, not just this repo's desktop/swiftshader
  // verification loop, which never catches this class of bug because software rasterizers don't
  // reproduce mobile precision downgrades — hash()/noise() go chaotic: the flame stops looking like
  // flame and reads as a spiralling coil. 300s is long enough that the wrap is imperceptible against
  // the turbulence, short enough to keep every multiplied use comfortably inside safe range.
  "  float T = mod(iTime, 300.0);",
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
  // The corona/collar is a NEAR-SURFACE phenomenon, but the fire sphere (R = 0.62) sits well inside
  // the (much larger, R = 1) bounding sphere used for the march — so "near the surface" cannot be
  // evaluated at the ray's entry point P (that was the bug the first render caught: edgeP at the
  // bounding sphere was uniformly large, so the corona's every gate read true almost everywhere,
  // drawing full latitude arcs). Instead track the ray's CLOSEST APPROACH to the real fire surface from
  // outside, during the same march — the standard raymarched-glow trick — and anchor the corona there.
  "  float minD = 999.0;",
  "  float minAng = 0.0;",
  // ---- STEP JITTER: why this shipped as an agate marble ------------------------------------------
  // Every ray used to sample at IDENTICAL depths — (i + 0.5) * dt — so neighbouring pixels crossed the
  // same density shells at the same distances, and those shells drew themselves as concentric rings.
  // That is march-step banding, and with a smooth radial falloff it reads as polished agate, which is
  // precisely the material agate IS: concentric deposition bands. Offsetting each ray's start by a
  // per-pixel hash breaks the correlation, converting a coherent ring into incoherent grain the eye
  // integrates away. Same step count, same cost, no rings. This is the standard fix and it is free.
  "  float jitter = hash(gl_FragCoord.xy * 0.017 + vec2(T * 0.31));",
  "  for(int i = 0; i < STEPS; i++){",
  "    if(accumAlpha > 0.97){ break; }",
  "    float s = (float(i) + jitter) * dt;",
  "    vec3 Q = P + rd * s;",
  "    float core = lensDist(Q);",
  // Boundary turbulence: tongues peel off the sphere's own surface, drifting upward — the volumetric
  // twin of the old 2D rim-lick. One fbm3 call per step; this is the expensive line, deliberately kept
  // to a single sample.
  "    float turb = fbm3(Q * 2.4 + vec3(0.0, -T * 0.35, 0.0)) - 0.5;",
  "    float d = core - turb * 0.10;",
  "    float dens = smoothstep(0.05, -0.03, d);",
  // ---- FACE GEOMETRY: how directly this point faces the gaze direction — TEXTURE, not shape --------
  // `faceCos` is a plain dot product against the gaze axis (local +Z, per the vertex shader's own
  // convention) — 1.0 dead-on, -1.0 at the antipode. `irisWeight` blends iris detail in/out; nothing
  // below this line ever touches `core`/`d`/the sphere's own radius, so the OUTER SILHOUETTE cannot be
  // affected by any of it, by construction — this is the actual fix for the fourth attempt's mistake.
  "    vec3 Qn = normalize(Q + vec3(0.0001));",
  "    float faceCos = dot(Qn, vec3(0.0, 0.0, 1.0));",
  "    float ang = atan(-Q.x, Q.z);",
  "    float irisWeight = smoothstep(0.15, 0.55, faceCos);",
  // ---- THE PUPIL: a genuine density carve, but confined to the sphere's INTERIOR — an interior socket
  // never affects the outer boundary that defines the silhouette, so this stays fine to be directional
  // where the outer shape may not be. Local coordinates near the front pole (Q.x/R, Q.y/R) give the
  // same vertical-slit shape the flat 2D version used, normalised back to the old tuned thresholds.
  "    float pupilU = Q.x / R;",
  "    float pupilV = Q.y / R;",
  "    float pupilCut = smoothstep(0.115, 0.085, abs(pupilU) * (1.0 + abs(pupilV) * 0.55)) * irisWeight;",
  "    dens *= (1.0 - pupilCut);",
  "    if(d > 0.0 && d < minD){ minD = d; minAng = ang; }",
  "    if(dens > 0.001){",
  // Fine radial grain (the fibre detail), cheap 2D noise keyed off azimuth+height. A second, much
  // higher-frequency pass on top is the macro-photo cue: two texture scales at once, structure riding
  // on structure, the way a close macro shot of a real iris reads. Both cheap 2D `noise()` calls.
  "      float rho = length(Q.xy);",
  "      float grain = noise(vec2(ang * 9.0, Q.y * 6.0)) - 0.5;",
  "      float microGrain = noise(vec2(ang * 42.0 + Q.y * 5.0, Q.y * 34.0 - ang * 3.0)) - 0.5;",
  "      float plasma = clamp(0.55 + 0.85 * turb + grain * 0.12 + microGrain * 0.05, 0.0, 1.0);",
  "      float axisGlow = 1.0 - smoothstep(0.0, 0.34, rho);",
  "      float heat = clamp(plasma * 0.75 + axisGlow * 0.55, 0.0, 1.0);",
  "      vec3 core_c = vec3(1.0, 0.90, 0.72);",
  "      vec3 hot  = vec3(0.98, 0.19, 0.015);",
  "      vec3 scab = vec3(0.66, 0.055, 0.006);",
  "      vec3 deep = vec3(0.34, 0.030, 0.004);",
  "      vec3 sampleCol = mix(deep, scab, smoothstep(0.08, 0.42, heat));",
  "      sampleCol = mix(sampleCol, hot, smoothstep(0.56, 0.88, heat));",
  // The throat glow is IRIS-ONLY (irisWeight-scaled) — the bright pupil-adjacent core is part of the
  // eye's own detail, not something the plain-ember sclera should show.
  "      sampleCol += core_c * pow(axisGlow, 3.0) * (0.30 + iPower * 0.34) * irisWeight;",
  // The lip: brightest right at the boundary — reads everywhere, the rim of the whole sphere, not
  // just the iris.
  "      float lip = exp(-abs(d) / 0.035);",
  "      sampleCol += vec3(1.0, 0.32, 0.05) * lip * 0.65;",
  // A vein of current inside the iris itself — 'electric textured pupil and iris', not just an outer
  // fringe effect. High-frequency noise thresholded to a thin ridge, teal-white, its own flicker clock,
  // strictly confined to the iris by `irisWeight` so it can never bleed onto the plain sclera and stays
  // clearly secondary to the fire (thin, rare, dim) per the standing balance rule.
  "      float veinNoise = noise(vec2(ang * 14.0, faceCos * 20.0 - T * 0.8));",
  "      float vein = pow(max(0.0, 1.0 - abs(veinNoise - 0.5) * 8.0), 14.0);",
  "      float veinCell = floor(T * 6.0);",
  "      float veinFlicker = step(0.55, hash(vec2(veinCell, floor(ang * 6.0))));",
  "      sampleCol += vec3(0.55, 0.95, 0.92) * vein * veinFlicker * irisWeight * (0.25 + iPower * 0.2);",
  // Plain ember sclera away from the iris — dimmer, the passage's "banked like coals," no special-cased
  // branch, just a brightness term keyed to the same irisWeight everything else above already uses.
  "      float scleraDim = mix(0.45, 1.0, irisWeight);",
  "      sampleCol *= scleraDim * (0.55 + iPower * 0.5);",
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
  "  float cell = floor(T * 8.0);",
  "  float flash = step(0.62, hash(vec2(cell, floor(minAng * 5.0))));",
  "  float fil = pow(max(0.0, 1.0 - abs(noise(vec2(minAng * 9.0, T * 2.6)) - 0.5) * 5.0), 10.0);",
  // A second, higher-frequency branch offset in phase and angle — where it happens to cross the first,
  // the two thin ridges read as a fork, the cheap fake for a real Lichtenberg branch.
  "  float branchCell = floor(T * 11.0 + 3.7);",
  "  float branchFlash = step(0.74, hash(vec2(branchCell, floor(minAng * 8.0 + 2.0))));",
  "  float branch = pow(max(0.0, 1.0 - abs(noise(vec2(minAng * 17.0 + 5.0, T * 3.4)) - 0.5) * 7.0), 12.0);",
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
  "  float wetSpec = pow(1.0 - ndv, 9.0) * (0.7 + 0.3 * noise(vPosO.xy * 0.6 + T * 0.02));",
  "  col += vec3(1.0, 0.95, 0.88) * wetSpec * 0.5 * accumAlpha;",
  // ---- HEADROOM: do not clamp the one signal the whole image pipeline was built to receive --------
  // This line used to read `min(col, vec3(1.05))`. The stage (kit/env.ts) runs ACES tone mapping and
  // thresholds bloom at 0.92 — machinery whose entire job is to take values ABOVE 1.0 and roll them
  // into a bright core with falloff. Capping at 1.05 meant nearly every lit texel of the Eye landed in
  // the narrow band 0.92..1.05, so bloom fired almost uniformly across the whole disc and haloed it
  // evenly instead of blooming a core. That is the "sticker pasted on the screen" read, and it made
  // "brighter" structurally impossible: there was no headroom left to be bright INTO.
  // Now the throat is allowed to run genuinely over-bright and ACES does what it is for. The only
  // remaining guard is against NaN/Inf poisoning the bloom buffer, not against brightness.
  "  col = clamp(col, vec3(0.0), vec3(64.0));",
  "  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));",
  "}",
].join("\n");
