import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { TowerParams } from "../kit/params.js";
import { GLOBE_FRAGMENT, GLOBE_VERTEX } from "./eye-shader.js";

/**
 * THE EYE — a naked almond of fire hung between the tower's horns. Art direction: `docs/art/EYE.md`.
 *
 *   eyeRoot ─ pivot ─ globe   the Eye: a sphere whose visible surface is CUT to the almond by discard
 *                   └ gaze ─ beam   so the beam leaves from wherever the pupil is actually pointing
 *
 * There is deliberately no lid, brow, socket or faceplate — the reference has none, and both earlier
 * attempts died on that: a billboarded card (flat, and it swung to face the viewer) and then a stone
 * shell with the almond cut out of it (dimensional, but it housed a thing that must not be housed).
 * The shape now belongs to the flame; see the shader for how the silhouette is carved and licked.
 *
 * Nothing billboards. The Eye sweeps on its own schedule and never tracks the camera — being ignored
 * is the point.
 */

export interface EyeBuild {
  readonly root: TransformNode;
  /** Rotate to aim the eye. Globe and beam both hang from it, so they can never disagree. */
  readonly pivot: TransformNode;
  /** Node the gaze beam hangs from — under the pivot, so it follows the pupil. */
  readonly gaze: TransformNode;
  readonly light: PointLight;
  readonly material: ShaderMaterial;
  /** The flame mesh itself — the emitter volumetric scattering casts its shafts from. */
  readonly emitter: Mesh;
}

/** Register the shader sources once per page. */
function registerShaders(): void {
  if (!Effect.ShadersStore.skynetEyeGlobeVertexShader) {
    Effect.ShadersStore.skynetEyeGlobeVertexShader = GLOBE_VERTEX;
    Effect.ShadersStore.skynetEyeGlobeFragmentShader = GLOBE_FRAGMENT;
  }
}

/** Radius of the eyeball. The aperture is sized off this so the two can't drift apart. */
const GLOBE_R = 12.5;

export function buildEye(scene: Scene, y: number, params: TowerParams): EyeBuild {
  registerShaders();
  const root = new TransformNode("eyeRoot", scene);
  root.position.y = y;

  const pivot = new TransformNode("eyePivot", scene);
  pivot.parent = root;

  // ---- The Eye itself: a sphere, cut to an almond of flame in the fragment shader ----
  const material = new ShaderMaterial(
    "eyeGlobeMat",
    scene,
    { vertex: "skynetEyeGlobe", fragment: "skynetEyeGlobe" },
    {
      attributes: ["position", "normal"],
      uniforms: ["worldViewProjection", "iTime", "iPower", "iCamO", "iLightO", "iRadius"],
      needAlphaBlending: true,
    },
  );
  // The flame's outer tongues feather out, so the material blends — but the almond's interior is fully
  // opaque and must still occlude the crown behind it, hence depth writes stay on.
  material.forceDepthWrite = true;
  material.setFloat("iTime", 0);
  material.setFloat("iPower", params.eyeIntensity);
  material.setVector3("iCamO", new Vector3(0, 0, 20));
  // Key light in the eye's own frame — slightly up and to camera-left, so the chatoyant band sits
  // off-centre rather than symmetrically through the pupil (symmetry reads as decal, not stone).
  material.setVector3("iLightO", new Vector3(0.45, 0.7, 0.55));
  material.setFloat("iRadius", GLOBE_R);

  const globe = CreateSphere("eyeGlobe", { diameter: GLOBE_R * 2, segments: 48 }, scene);
  globe.material = material;
  globe.parent = pivot;
  globe.isPickable = false;

  // The eye math (iris axis = +Z, lid axis = +Y) lives in object space, so the camera has to be
  // expressed there too. Doing it on the CPU once per frame beats inverting a mat4 per-fragment:
  // GLSL ES 1.0 has no matrix inverse, and this is one 4x4 invert against thousands of pixels.
  const camO = new Vector3();
  const inv = new Matrix();
  globe.onBeforeRenderObservable.add(() => {
    const cam = scene.activeCamera;
    if (!cam) return;
    globe.getWorldMatrix().invertToRef(inv);
    Vector3.TransformCoordinatesToRef(cam.globalPosition, inv, camO);
    material.setVector3("iCamO", camO);
  });

  // The eye lights its own tower — this is what makes the crown feel radioactive.
  const light = new PointLight("eyeGlow", Vector3.Zero(), scene);
  light.diffuse = new Color3(1.0, 0.44, 0.11);
  light.intensity = params.eyeIntensity * 1.15;
  light.range = 120;
  light.parent = root;

  // ---- Gaze beam, under the pivot so it leaves from where the pupil actually points ----
  const gaze = new TransformNode("gaze", scene);
  gaze.parent = pivot;

  const beamMat = new StandardMaterial("beamMat", scene);
  beamMat.emissiveColor = new Color3(1.0, 0.44, 0.12);
  beamMat.disableLighting = true;
  beamMat.alpha = 0.035;

  const coreMat = new StandardMaterial("beamCoreMat", scene);
  coreMat.emissiveColor = new Color3(1.0, 0.78, 0.42);
  coreMat.disableLighting = true;
  coreMat.alpha = 0.07;

  const reach = params.gazeReach;
  // The beam starts OUTSIDE the eyeball, not at its centre. Spanning from the origin meant the
  // cylinder passed through the flame and washed whichever side faced the camera — the pupil went
  // grey and the almond lost a canthus. Light leaves a surface; it does not begin inside one.
  const beamStart = GLOBE_R * 1.05;
  const beamLen = reach - beamStart;

  const beam = CreateCylinder(
    "beam",
    { diameterTop: 2.2, diameterBottom: reach * 0.11, height: beamLen, tessellation: 24 },
    scene,
  );
  beam.material = beamMat;
  beam.rotation.x = Math.PI / 2;
  beam.position.z = beamStart + beamLen / 2;
  beam.parent = gaze;
  beam.isPickable = false;

  const core = CreateCylinder(
    "beamCore",
    { diameterTop: 0.7, diameterBottom: reach * 0.04, height: beamLen, tessellation: 20 },
    scene,
  );
  core.material = coreMat;
  core.rotation.x = Math.PI / 2;
  core.position.z = beamStart + beamLen / 2;
  core.parent = gaze;
  core.isPickable = false;

  return { root, pivot, gaze, light, material, emitter: globe };
}
