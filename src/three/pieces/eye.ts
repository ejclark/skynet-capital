import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { TowerParams } from "../kit/params.js";

/**
 * THE EYE — a vertical cat-eye of translucent fire, and the piece the whole tower exists to carry.
 *
 * It's a custom GLSL shader on a billboarded plane rather than geometry, because the look wanted is
 * volumetric plasma (domain-warped fbm through a vesica mask), which no material system gives you.
 * The gaze beam is parented to a node UNDER the eye root so it can never detach from the eyeball —
 * a bug we've already fixed once and don't intend to reintroduce.
 */

const EYE_VERTEX = [
  "precision highp float;",
  "attribute vec3 position;",
  "attribute vec2 uv;",
  "uniform mat4 worldViewProjection;",
  "varying vec2 vUV;",
  "void main(void){",
  "  vUV = uv;",
  "  gl_Position = worldViewProjection * vec4(position, 1.0);",
  "}",
].join("\n");

const EYE_FRAGMENT = [
  "precision highp float;",
  "varying vec2 vUV;",
  "uniform float iTime;",
  "uniform float iPower;",
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
  "void main(void){",
  "  vec2 uv = vUV * 2.0 - 1.0;",
  // HORIZONTAL vesica: two circles offset VERTICALLY, intersected. This is the film's eye — a wide
  // lens pointed at each corner — not a vertical flame. Getting this axis right is most of the read.
  "  const float R = 1.28, OFF = 0.86;",
  "  float d1 = length(vec2(uv.x, uv.y - OFF));",
  "  float d2 = length(vec2(uv.x, uv.y + OFF));",
  "  float dm = max(d1, d2);",
  "  float almond = 1.0 - smoothstep(R - 0.10, R, dm);",
  "  if(almond <= 0.001){ discard; }",
  // Normalized coords inside the lens, so the plasma fills the aperture rather than a circle.
  "  vec2 q = vec2(uv.x * 1.05, uv.y * 2.1);",
  "  float d = length(q);",
  // Domain-warped plasma iris — churning fire, dragged outward from the slit.
  "  vec2 w = vec2(fbm(q * 3.1 + iTime * 0.18), fbm(q * 2.7 - iTime * 0.14));",
  "  float plasma = fbm(q * 4.6 + w * 2.4 + vec2(0.0, iTime * 0.5));",
  "  float radial = 1.0 - smoothstep(0.0, 1.25, d);",
  // Vertical slit pupil — narrow, tapering to points top and bottom.
  "  float slit = smoothstep(0.155, 0.045, abs(uv.x) * (1.0 + abs(uv.y * 1.55)));",
  "  float heat = clamp(plasma * 1.3 * radial + radial * 0.6, 0.0, 1.0);",
  "  vec3 core = vec3(1.0, 0.88, 0.55);",
  "  vec3 hot  = vec3(1.0, 0.46, 0.06);",
  "  vec3 mid  = vec3(0.86, 0.15, 0.01);",
  "  vec3 rim  = vec3(0.42, 0.06, 0.01);",
  "  vec3 col = mix(rim, mid, smoothstep(0.12, 0.45, heat));",
  "  col = mix(col, hot, smoothstep(0.42, 0.74, heat));",
  "  col = mix(col, core, smoothstep(0.76, 0.97, heat));",
  "  col = mix(col, vec3(0.015, 0.005, 0.0), slit * 0.99);",
  // Hot rim right at the aperture edge so the eye looks lit from inside.
  "  float edge = smoothstep(0.55, 0.98, d) * (1.0 - smoothstep(0.98, 1.02, d));",
  "  col += vec3(1.0, 0.45, 0.12) * edge * 1.5;",
  "  float alpha = almond * clamp(heat * 1.5 + edge * 1.2, 0.0, 1.0) * (1.0 - slit * 0.55);",
  "  gl_FragColor = vec4(col * (0.75 + iPower * 0.9), alpha);",
  "}",
].join("\n");

export interface EyeBuild {
  readonly root: TransformNode;
  /** Node the gaze beam hangs from — rotate this to aim; it can never detach from the eye. */
  readonly gaze: TransformNode;
  readonly light: PointLight;
  readonly material: ShaderMaterial;
}

/** Register the shader source once per page. */
function registerShaders(): void {
  if (!Effect.ShadersStore.skynetEyeVertexShader) {
    Effect.ShadersStore.skynetEyeVertexShader = EYE_VERTEX;
    Effect.ShadersStore.skynetEyeFragmentShader = EYE_FRAGMENT;
  }
}

export function buildEye(scene: Scene, y: number, params: TowerParams): EyeBuild {
  registerShaders();
  const root = new TransformNode("eyeRoot", scene);
  root.position.y = y;

  const material = new ShaderMaterial(
    "eyeMat",
    scene,
    { vertex: "skynetEye", fragment: "skynetEye" },
    {
      attributes: ["position", "uv"],
      uniforms: ["worldViewProjection", "iTime", "iPower"],
      needAlphaBlending: true,
    },
  );
  material.backFaceCulling = false;
  material.setFloat("iTime", 0);
  material.setFloat("iPower", params.eyeIntensity);

  const plane = CreatePlane("eye", { width: 30, height: 17 }, scene);
  plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
  plane.material = material;
  plane.parent = root;

  // The eye lights its own tower — this is what makes the crown feel radioactive.
  const light = new PointLight("eyeGlow", Vector3.Zero(), scene);
  light.diffuse = new Color3(1.0, 0.46, 0.12);
  light.intensity = params.eyeIntensity * 1.8;
  light.range = 120;
  light.parent = root;

  // ---- Gaze beam, parented under the eye so it tracks the eyeball exactly ----
  const gaze = new TransformNode("gaze", scene);
  gaze.parent = root;

  const beamMat = new StandardMaterial("beamMat", scene);
  beamMat.emissiveColor = new Color3(1.0, 0.44, 0.12);
  beamMat.disableLighting = true;
  beamMat.alpha = 0.035;

  const coreMat = new StandardMaterial("beamCoreMat", scene);
  coreMat.emissiveColor = new Color3(1.0, 0.78, 0.42);
  coreMat.disableLighting = true;
  coreMat.alpha = 0.07;

  const reach = params.gazeReach;
  const beam = CreateCylinder(
    "beam",
    { diameterTop: 1.6, diameterBottom: reach * 0.11, height: reach, tessellation: 24 },
    scene,
  );
  beam.material = beamMat;
  beam.rotation.x = Math.PI / 2;
  beam.position.z = reach / 2;
  beam.parent = gaze;
  beam.isPickable = false;

  const core = CreateCylinder(
    "beamCore",
    { diameterTop: 0.5, diameterBottom: reach * 0.04, height: reach, tessellation: 20 },
    scene,
  );
  core.material = coreMat;
  core.rotation.x = Math.PI / 2;
  core.position.z = reach / 2;
  core.parent = gaze;
  core.isPickable = false;

  return { root, gaze, light, material };
}
