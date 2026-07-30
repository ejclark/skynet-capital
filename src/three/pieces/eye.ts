import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { TowerParams } from "../kit/params.js";
import { GLOBE_FRAGMENT, GLOBE_VERTEX, SOCKET_FRAGMENT, SOCKET_VERTEX } from "./eye-shader.js";

/**
 * THE EYE — a fiery sphere set behind an almond aperture cut in the crown's stone.
 *
 * The structure IS the design. Earlier the Eye was one billboarded plane: it always turned to face
 * the camera, so it had no fixed place in the tower (the physics read wrong), and being flat it could
 * have no refraction, no view-dependent sheen and no real occlusion — so it looked painted on. Now:
 *
 *   eyeRoot ─ socket        fixed stone faceplate; the aperture is a HOLE in it, not a mask
 *           └ pivot ─ globe an opaque SPHERE that rotates to look around behind the fixed opening
 *                   └ gaze ─ beam   so the beam leaves from wherever the pupil is actually pointing
 *
 * Nothing billboards. The eye's shape belongs to the tower and the eye moves *within* it — better
 * physics, and the thing that makes a stone socket with real depth possible at all.
 */

export interface EyeBuild {
  readonly root: TransformNode;
  /** Rotate to aim the eye. Globe and beam both hang from it, so they can never disagree. */
  readonly pivot: TransformNode;
  /** Node the gaze beam hangs from — under the pivot, so it follows the pupil. */
  readonly gaze: TransformNode;
  readonly light: PointLight;
  readonly material: ShaderMaterial;
}

/** Register the shader sources once per page. */
function registerShaders(): void {
  if (!Effect.ShadersStore.skynetEyeGlobeVertexShader) {
    Effect.ShadersStore.skynetEyeGlobeVertexShader = GLOBE_VERTEX;
    Effect.ShadersStore.skynetEyeGlobeFragmentShader = GLOBE_FRAGMENT;
    Effect.ShadersStore.skynetEyeSocketVertexShader = SOCKET_VERTEX;
    Effect.ShadersStore.skynetEyeSocketFragmentShader = SOCKET_FRAGMENT;
  }
}

/** Radius of the eyeball. The aperture is sized off this so the two can't drift apart. */
const GLOBE_R = 7.6;

export function buildEye(scene: Scene, y: number, params: TowerParams): EyeBuild {
  registerShaders();
  const root = new TransformNode("eyeRoot", scene);
  root.position.y = y;

  const pivot = new TransformNode("eyePivot", scene);
  pivot.parent = root;

  // ---- The globe: an opaque sphere, the source of every 3D cue ----
  const material = new ShaderMaterial(
    "eyeGlobeMat",
    scene,
    { vertex: "skynetEyeGlobe", fragment: "skynetEyeGlobe" },
    {
      attributes: ["position", "normal"],
      uniforms: ["worldViewProjection", "iTime", "iPower", "iCamO", "iLightO", "iRadius"],
    },
  );
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

  // ---- The socket: a stone shell wrapping the globe, with the almond cut out of it ----
  const socketMat = new ShaderMaterial(
    "eyeSocketMat",
    scene,
    { vertex: "skynetEyeSocket", fragment: "skynetEyeSocket" },
    {
      attributes: ["position"],
      uniforms: ["worldViewProjection", "iPower", "iRadius"],
    },
  );
  socketMat.setFloat("iPower", params.eyeIntensity);
  const SHELL_R = GLOBE_R * 1.13;
  socketMat.setFloat("iRadius", SHELL_R);
  // Both faces render: through the opening you see the shell's INNER wall, which is what gives the
  // socket depth rather than a paper-thin cut-out.
  socketMat.backFaceCulling = false;

  const socket = CreateSphere("eyeSocket", { diameter: SHELL_R * 2, segments: 64 }, scene);
  socket.material = socketMat;
  // Parented to the root, NOT the pivot — the aperture belongs to the tower and stays put while the
  // eye moves behind it.
  socket.parent = root;
  socket.isPickable = false;

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

  return { root, pivot, gaze, light, material };
}
