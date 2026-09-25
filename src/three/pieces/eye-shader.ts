/**
 * The Eye's fragment bodies — spliced into stock materials by `fireMaterial` (kit/fire-glsl.ts),
 * which supplies `vP`/`vN`/`vV`, `uTime`, `fbm`, `vn`, `flow` and `ramp`. Art direction:
 * `docs/art/EYE.md` (see "The fire-first rebuild"); numbers: the Barad-dûr design handoff §6–7.
 *
 * FIRE FIRST. Six earlier attempts (EYE.md) tried to make an eyeball that burned — a card, a stone
 * shell, a raymarched sphere with an iris overlay. This inverts it: the body is a fire that happens to
 * hold an almond's shape. Three layers carry the read, and each is cheap on its own:
 *   1. the BODY — an almond mesh whose surface is flowing, domain-warped fire with radial fibres;
 *   2. the CORONA — a camera-facing plane that paints flame tongues outside the almond's PROJECTED
 *      outline, so the silhouette licks from every angle without any geometry moving;
 *   3. the BEAM — two faint additive cones along the gaze.
 */

/**
 * The almond body, in object space (unit almond, x ∈ [−1, 1]). `r = |vP.xy|` is radial distance from
 * the pupil. Outward-flowing warped fbm (`n`) plus radial fibres (`fib`) set the heat `v`; a glow
 * hugs the slit and a hot ring rides the rim. A faint electric undertone — thin iso-lines of a
 * second fbm, gated by a slow flicker and kept to the outer rim — is the "lightning is what it
 * means" line from EYE.md, deliberately quieter than the fire.
 */
export const BODY = `
  vec2 d = vP.xy; float r = length(d); vec2 dir = d / (r + 1e-4);
  vec3 w = vec3(dir*2.2, r*2.0) + vec3(0.,0.,vP.z*1.2);
  w += (vec3(fbm(w*1.7 + uTime*0.21), fbm(w*1.7 - uTime*0.17 + 4.1), 0.) - 0.5) * 0.9;
  float n = flow(w, vec3(0.,0.,1.), 0.16, 2.4);
  float fib = fbm(vec3(dir*7.0, r*2.2 - uTime*0.3));
  float v = 0.66 - r*0.36 + (n-0.5)*2.0 + (fib-0.5)*0.8;
  v += exp(-abs(vP.x)*12.0)*0.42*(1.0-smoothstep(0.6,1.0,abs(vP.y)));
  v += smoothstep(0.8,0.97,r)*0.45;
  vec3 col = ramp(clamp(v,0.,0.93)) * 1.25;
  float e = fbm(vP*4.5 + vec3(0., uTime*0.35, uTime*0.12));
  float line = 1.0 - smoothstep(0.0, 0.014, abs(e-0.5));
  float flick = smoothstep(0.62, 0.85, vn(vec3(uTime*2.3, 3.1, 0.)));
  col += vec3(1.0,0.90,0.68) * line * flick * smoothstep(0.45,0.95,r) * 0.9;
  diffuseColor = vec4(col, 1.0);`;

/**
 * The corona, on a camera-facing plane of half-size `uHalf` in units of EW. `uW`/`uH` are the
 * almond's PROJECTED half-extents (set per frame on the CPU from the gaze and camera), so distance
 * `dist` is to the outline the viewer actually sees — edge-on, the flames hug a thin sliver.
 * Tongues reach further upward (`up`), because fire rises; a soft halo sits under everything.
 * `uReach` is TowerParams.eyeIntensity: a stronger standing burns taller.
 */
export const CORONA = `
  vec2 q = vP.xy / uEW;
  vec2 e = vec2(q.x / uW, q.y / uH);
  float ex = clamp(abs(e.x), 0.0, 1.0);
  float dy = abs(e.y) - (1.0 - ex*ex);
  float dx = max(abs(e.x) - 1.0, 0.0);
  float dist = length(vec2(max(dy, 0.0) * uH, dx * uW));
  float inside = step(dy, 0.0) * step(abs(e.x), 1.0);
  float r = length(q); vec2 dir = q / (r + 1e-4);
  float n = flow(vec3(dir*4.2, r*1.6) + vec3(0., -uTime*0.3, 0.), vec3(0.,0.,1.), 0.3, 2.2);
  float lick = vn(vec3(dir*11.0, r*3.0 - uTime*3.2));
  n = (n - 0.5) * 2.6 + 0.5 + (lick - 0.5) * 0.6;
  float up = 1.0 + max(dir.y, 0.0) * 0.8;
  float reach = 0.42 * uReach * up * (0.45 + n) * (1.0 + 0.06*sin(uTime*6.1));
  float body = (1.0 - smoothstep(0.0, reach, dist)) * (1.0 - inside * 0.35);
  float halo = exp(-dist * 3.2) * 0.22;
  float a = clamp(body * smoothstep(0.4, 0.75, n) + halo, 0.0, 1.0);
  float heat = clamp(1.0 - dist / (reach + 1e-3), 0.0, 1.0);
  diffuseColor = vec4(ramp(0.36 + heat * 0.42 * n) * 1.7, a);`;

/**
 * One beam cone (open, double-sided, additive). `u` is distance along the beam as a fraction of its
 * length `uLen`. Brightest where the surface faces the viewer (fresnel^2.2 — a solid-looking cone
 * edge would read as a lampshade), fading out with `e^(−2.6u)`, faded IN over the first 3% so it
 * never starts as a hard ring, and broken by streaks sliding outward and slow dust.
 */
export const BEAM = `
  float u = vP.z / uLen;
  float ang = atan(vP.y, vP.x);
  float fr = abs(dot(normalize(vN), normalize(vV)));
  float streak = vn(vec3(cos(ang)*uStreak, sin(ang)*uStreak, vP.z*0.012 - uTime*1.4));
  float dust = vn(vec3(vP.xy*0.05, vP.z*0.02 - uTime*0.6));
  float a = uStrength * pow(fr, 2.2) * exp(-u*2.6) * smoothstep(0.0, 0.03, u) * (0.45 + 0.55*streak) * (0.7 + 0.5*dust);
  diffuseColor = vec4(mix(vec3(1.0,0.34,0.047), vec3(1.0,0.54,0.074), 1.0 - u) * 1.6, a);`;
