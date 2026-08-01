import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Color3 } from "@babylonjs/core/Maths/math";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/**
 * THE SKY — a gradient dome: near-black at the zenith, ember at the horizon.
 *
 * This exists because of a tension the flat storm-grey background could not resolve. A LIGHT sky
 * makes the tower read as a clean black silhouette, which is why it was chosen; but a glowing thing
 * cannot read as a *light source* against a background brighter than itself, which capped how good
 * the Eye could ever look. Every extra unit of fire just made it flatter.
 *
 * The reference resolves it the way the films do: the sky is dark, but lit from BELOW by the
 * volcano. So the tower still silhouettes — against the ember band near the horizon — while the
 * upper field goes black and the Eye becomes the brightest thing in the frame, which is what it is
 * supposed to be.
 *
 * Rendered as an inside-out sphere with `infiniteDistance`, so it never clips and never moves with
 * the camera. Unlit and fog-exempt by construction: it IS the horizon the fog fades into.
 */

const SKY_VERTEX = [
  "precision highp float;",
  "attribute vec3 position;",
  "uniform mat4 worldViewProjection;",
  "varying vec3 vPos;",
  "void main(void){",
  "  vPos = position;",
  "  gl_Position = worldViewProjection * vec4(position, 1.0);",
  "}",
].join("\n");

const SKY_FRAGMENT = [
  "precision highp float;",
  "varying vec3 vPos;",
  "uniform vec3 iZenith;",
  "uniform vec3 iHorizon;",
  "uniform vec3 iEmber;",
  "void main(void){",
  "  float h = normalize(vPos).y;",
  // Two stacked ramps rather than one: zenith→horizon over the upper hemisphere, then a much
  // tighter horizon→ember ramp just below the skyline. A single lerp puts too much light too high
  // and the night stops reading as night.
  "  vec3 col = mix(iHorizon, iZenith, smoothstep(-0.02, 0.62, h));",
  "  col = mix(col, iEmber, smoothstep(-0.01, -0.20, h));",
  // A slow vertical banding keeps the gradient from looking like a CSS background — cloud, not paper.
  "  float band = sin(h * 26.0) * 0.5 + 0.5;",
  "  col *= 0.94 + 0.06 * band;",
  "  gl_FragColor = vec4(col, 1.0);",
  "}",
].join("\n");

interface SkyColors {
  readonly zenith: Color3;
  readonly horizon: Color3;
  readonly ember: Color3;
}

/** Night under a volcano: black overhead, smoke at the skyline, forge-light beneath it. */
const DEFAULT_SKY: SkyColors = {
  zenith: new Color3(0.012, 0.014, 0.022),
  horizon: new Color3(0.048, 0.04, 0.046),
  ember: new Color3(0.155, 0.042, 0.014),
};

/** Add the gradient dome to a scene. Returns the mesh so callers can dispose or retint it. */
export function createSky(scene: Scene, colors: SkyColors = DEFAULT_SKY): Mesh {
  if (!Effect.ShadersStore.skynetSkyVertexShader) {
    Effect.ShadersStore.skynetSkyVertexShader = SKY_VERTEX;
    Effect.ShadersStore.skynetSkyFragmentShader = SKY_FRAGMENT;
  }

  const material = new ShaderMaterial(
    "skyMat",
    scene,
    { vertex: "skynetSky", fragment: "skynetSky" },
    {
      attributes: ["position"],
      uniforms: ["worldViewProjection", "iZenith", "iHorizon", "iEmber"],
    },
  );
  material.setColor3("iZenith", colors.zenith);
  material.setColor3("iHorizon", colors.horizon);
  material.setColor3("iEmber", colors.ember);
  // Seen from the inside, and never written to depth — everything in the world is in front of it.
  material.backFaceCulling = false;
  material.disableDepthWrite = true;
  material.fogEnabled = false;

  const dome = CreateSphere("sky", { diameter: 2000, segments: 24 }, scene);
  dome.material = material;
  dome.infiniteDistance = true;
  dome.isPickable = false;
  dome.applyFog = false;
  // Render first, so it can never overdraw the scene.
  dome.renderingGroupId = 0;
  return dome;
}
