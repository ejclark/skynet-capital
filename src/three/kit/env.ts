import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3, Color4, Vector3 } from "@babylonjs/core/Maths/math";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { SSAO2RenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { Scene } from "@babylonjs/core/scene";
import { createSky } from "./sky.js";
// --- Side-effect imports. Tree-shaking strips scene components unless they're imported for effect;
// without these you get runtime "X needs to be imported before" errors and a black screen. ---
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import "@babylonjs/core/Rendering/geometryBufferRendererSceneComponent";
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Misc/dds";

/**
 * The STAGE — engine, camera, lights, and the whole image pipeline. This is the "template" rung of
 * the kit: every 3D game piece renders into a stage like this one, so the look stays cohesive
 * without each piece re-deriving its own grading.
 *
 * Why the scene reads filmic rather than flat comes down to four things set up here, in order:
 *   1. an IBL environment (PBR surfaces need something to reflect — the single biggest realism lever)
 *   2. ACES tone mapping (without it, PBR + bloom blows out to white mush)
 *   3. SSAO2 contact shadows (the cheapest large gain in perceived surface detail)
 *   4. MSAA + FXAA (jagged edges are what read as "cheap" more than anything else)
 */

/** Brand tokens, mirrored from the observatory design system (dashboard-shell.ts). */
export const TOKENS = {
  accent: Color3.FromHexString("#35D0BA"),
  ground: Color3.FromHexString("#05070B"),
  forge: new Color3(1.0, 0.34, 0.09),
} as const;

export interface Stage {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: ArcRotateCamera;
  readonly shadows: ShadowGenerator;
  readonly key: DirectionalLight;
  readonly forge: PointLight;
}

/** Where the prefiltered IBL lives. Served by us (see public/three) — never a third-party CDN, which
 *  is unreachable from the headless verification browser and unpinned in production. */
const ENV_TEXTURE_URL = "/three/environment.env";

function attachEnvironment(scene: Scene, url: string): void {
  // Graceful degradation: if the .env can't load we keep a lit (if flatter) scene rather than a
  // black screen. PBR without IBL still renders — it just loses its reflections.
  try {
    const env = CubeTexture.CreateFromPrefilteredData(url, scene);
    scene.environmentTexture = env;
    scene.environmentIntensity = 0.3; // night siege, but the masonry must still READ
  } catch {
    scene.environmentIntensity = 0;
  }
}

function gradeImage(scene: Scene): void {
  const ip = scene.imageProcessingConfiguration;
  ip.toneMappingEnabled = true;
  ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  ip.exposure = 1.15;
  ip.contrast = 1.55;
  ip.vignetteEnabled = true;
  ip.vignetteWeight = 3.4;
  ip.vignetteColor = new Color4(0, 0, 0, 0);
}

/**
 * Post chain. ORDER MATTERS: SSAO2 must be constructed BEFORE the default pipeline, otherwise the
 * two compete for the camera's post-process chain and the ambient occlusion silently disappears.
 * Learned the hard way; do not reorder without checking a screenshot.
 */
export function attachPost(
  scene: Scene,
  camera: ArcRotateCamera,
  godRayEmitter?: Mesh,
): DefaultRenderingPipeline {
  if (SSAO2RenderingPipeline.IsSupported) {
    const ssao = new SSAO2RenderingPipeline("ssao", scene, { ssaoRatio: 0.75, blurRatio: 1 }, [
      camera,
    ]);
    ssao.radius = 3.2;
    ssao.totalStrength = 1.15;
    ssao.expensiveBlur = true;
    ssao.samples = 16;
    ssao.maxZ = 260;
  }

  // BEFORE the default pipeline — post-processes attach to the camera in creation order, and the
  // pipeline's tone mapping and bloom must run on a frame that already has the rays in it.
  if (godRayEmitter) attachGodRays(scene, camera, scene.getEngine() as Engine, godRayEmitter);

  const pipe = new DefaultRenderingPipeline("pipe", true, scene, [camera]);
  pipe.samples = 4; // MSAA — kills the jagged slat edges
  pipe.fxaaEnabled = true;
  pipe.bloomEnabled = true;
  pipe.bloomThreshold = 0.92;
  pipe.bloomWeight = 0.22;
  pipe.bloomKernel = 72;
  pipe.bloomScale = 0.6;
  pipe.grainEnabled = true;
  pipe.grain.intensity = 4.5;
  pipe.grain.animated = true;
  pipe.chromaticAberrationEnabled = true;
  pipe.chromaticAberration.aberrationAmount = 2.2;
  pipe.depthOfFieldEnabled = false; // reads as "toy miniature" on a tower this size
  return pipe;
}

/**
 * God rays from the Eye. The Eye is the only light source in a black sky, and light with nothing to
 * scatter through has no way to prove it is bright — this is what makes it read as a fire rather
 * than a lamp bulb. Volumetric scattering renders the emitter against blacked-out occluders and
 * radial-blurs outward from it, so the crown's horns cast real shafts.
 *
 * ORDER MATTERS, same class of trap as SSAO2: post-processes attach to the camera in creation
 * order, so this must be built BEFORE the default pipeline or the pipeline's tone mapping and bloom
 * run on a frame that has no rays in it yet.
 */
function attachGodRays(scene: Scene, camera: ArcRotateCamera, engine: Engine, emitter: Mesh): void {
  const rays = new VolumetricLightScatteringPostProcess(
    "godrays",
    1.0,
    camera,
    emitter,
    80,
    Texture.BILINEAR_SAMPLINGMODE,
    engine,
    false,
    scene,
  );
  // Restrained: shafts should be findable, not a lens flare. Decay near 1 keeps them long.
  rays.exposure = 0.065;
  rays.decay = 0.945;
  rays.weight = 0.17;
  rays.density = 0.88;
}

/** Build the whole stage. `canvas` must already be in the DOM. */
export function createStage(canvas: HTMLCanvasElement): Stage {
  const engine = new Engine(canvas, true, { stencil: true }, true);
  const scene = new Scene(engine);
  // Night under a volcano. The old flat storm-grey made a clean silhouette but capped the Eye: a
  // glowing thing cannot read as a LIGHT SOURCE against a background brighter than itself, so every
  // extra unit of fire only made it flatter. The gradient dome (kit/sky.ts) keeps the silhouette by
  // lighting the HORIZON instead of the whole sky. Clear colour matches its zenith for the frames
  // the dome does not cover.
  scene.clearColor = new Color4(0.012, 0.014, 0.022, 1);
  // Exponential fog is what sells atmosphere/scale — the tower recedes into weather, not into a void.
  // Tinted to the horizon ember so distance reads as smoke lit from below, not as grey wash.
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0055;
  scene.fogColor = new Color3(0.055, 0.032, 0.03);

  createSky(scene);
  attachEnvironment(scene, ENV_TEXTURE_URL);
  gradeImage(scene);

  const camera = new ArcRotateCamera("cam", -1.15, 1.18, 165, new Vector3(0, 44, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 55;
  camera.upperRadiusLimit = 300;
  camera.fov = 0.86;
  camera.wheelDeltaPercentage = 0.02;

  // Key: a cold moon rim that carves the silhouette out of the night.
  const key = new DirectionalLight("key", new Vector3(-0.55, -1, 0.42), scene);
  key.position = new Vector3(70, 130, -60);
  key.intensity = 3.6;
  key.diffuse = new Color3(0.52, 0.68, 0.95);

  const shadows = new ShadowGenerator(2048, key);
  shadows.useContactHardeningShadow = true;
  shadows.contactHardeningLightSizeUVRatio = 0.08;
  shadows.darkness = 0.42;

  // Ambient bounce so shadowed faces aren't dead black (IBL does most of this, this trims it).
  const amb = new HemisphericLight("amb", new Vector3(0, 1, 0), scene);
  amb.intensity = 0.5;
  amb.diffuse = new Color3(0.3, 0.42, 0.6);
  amb.groundColor = new Color3(0.06, 0.03, 0.02);

  // The forge: molten light from BELOW. Under-lighting is the single most "Barad-dûr" cue there is.
  const forge = new PointLight("forge", new Vector3(0, 6, 0), scene);
  forge.diffuse = TOKENS.forge;
  forge.intensity = 1.1;
  forge.range = 95;

  return { engine, scene, camera, shadows, key, forge };
}
