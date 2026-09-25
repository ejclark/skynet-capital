import * as THREE from "three";

/**
 * The shared FIRE shader chunk — noise, the Eye's colour ramp and a two-phase flow field — plus the
 * helper that splices a fragment body into a stock three.js material. Straight from the design
 * handoff, so the Eye, its corona and the beam all burn from one palette and one clock.
 *
 * Why patch a stock material instead of a raw ShaderMaterial: `onBeforeCompile` keeps three's own
 * tone mapping, colour-space output and fog plumbing, so the fire goes through the SAME ACES curve as
 * the stone around it. A hand-rolled shader skips that and the Eye clips to flat orange.
 */

/** The one clock every fire shader reads. Set it; don't copy it. */
export const FIRE_TIME: THREE.IUniform<number> = { value: 0 };

/**
 * `ramp` is the brand Eye ramp in LINEAR light: #140300 → dark red → #F85149 → #FF7A2E → #FF9E3D →
 * #FFC24D → #FFF3D6, stops at 0 / .22 / .40 / .56 / .70 / .85 / 1. `flow` crossfades two noise
 * samples scrolling along `dir` half a period apart — endless motion with no visible loop seam.
 */
export const GLSL_NOISE = `
uniform float uTime;
varying vec3 vP; varying vec3 vN; varying vec3 vV;
float h3(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vn(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm(vec3 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
vec3 ramp(float v){
  vec3 c = vec3(0.0069,0.0003,0.0);
  c = mix(c, vec3(0.24,0.02,0.012), smoothstep(0.00,0.22,v));
  c = mix(c, vec3(0.94,0.084,0.067), smoothstep(0.22,0.40,v));
  c = mix(c, vec3(1.0,0.195,0.027), smoothstep(0.40,0.56,v));
  c = mix(c, vec3(1.0,0.34,0.047), smoothstep(0.56,0.70,v));
  c = mix(c, vec3(1.0,0.54,0.074), smoothstep(0.70,0.85,v));
  c = mix(c, vec3(1.0,0.90,0.68), smoothstep(0.85,1.00,v));
  return c;
}
float flow(vec3 base, vec3 dir, float speed, float span){
  float p1 = fract(uTime*speed), p2 = fract(uTime*speed+0.5);
  float w1 = 1.0 - abs(2.0*p1-1.0);
  float n1 = fbm(base - dir*p1*span);
  float n2 = fbm(base - dir*p2*span + vec3(5.2,1.3,7.7));
  return n1*w1 + n2*(1.0-w1);
}`;

/**
 * A `MeshBasicMaterial` whose diffuse colour is computed by `fragBody` (which must assign
 * `diffuseColor`). Exposes `vP` (object-space position), `vN` (view normal) and `vV` (view vector),
 * plus every float in `uniforms`.
 */
export function fireMaterial(
  name: string,
  fragBody: string,
  opts: THREE.MeshBasicMaterialParameters = {},
  uniforms: Record<string, THREE.IUniform<number>> = {},
): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ name, ...opts });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = FIRE_TIME;
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = `varying vec3 vP; varying vec3 vN; varying vec3 vV;\n${sh.vertexShader}`
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvP = position;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvV = -mvPosition.xyz; vN = normalMatrix * normal;",
      );
    const decls = Object.keys(uniforms)
      .map((k) => `uniform float ${k};`)
      .join("\n");
    sh.fragmentShader = `${GLSL_NOISE}\n${decls}\n${sh.fragmentShader}`.replace(
      "vec4 diffuseColor = vec4( diffuse, opacity );",
      `vec4 diffuseColor; { ${fragBody} }`,
    );
  };
  m.customProgramCacheKey = () => name;
  return m;
}
