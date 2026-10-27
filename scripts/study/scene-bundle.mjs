// WHERE A SHOT'S 3D SCENE BUNDLE LIVES (#5227). The desk rail's landmark portrait embeds the real
// `/tower` scene, so a shoot needs `scene.js` built. It used to build into `public/three/`, where the
// e2e suite's own server (`readSceneAsset`) found it too: with the scene live, a layout spec waiting
// for the page to settle timed out locally while CI, which never builds it, stayed green. A shoot now
// builds into this cache instead — out of the app's public tree, kept between runs — and the
// harnesses serve whichever exists, a hand-built `public/three/scene.js` (dev-tower.mjs) first.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** The shoot's own build of the scene: under node_modules, so never served, committed or shipped. */
export const SCENE_CACHE = join(ROOT, "node_modules", ".cache", "study-scene", "scene.js");

/** The esbuild arguments `npm run build:scene` uses, aimed at `outfile`. */
export const sceneBuildArgs = (outfile) => [
  "src/three/scene-main.ts",
  "--bundle",
  "--minify",
  "--format=iife",
  "--target=es2020",
  `--outfile=${outfile}`,
];

/** The bundle a harness serves at `/three/scene.js`, or undefined when neither is built. */
export function sceneBundle() {
  return [join(ROOT, "public", "three", "scene.js"), SCENE_CACHE].find((p) => existsSync(p));
}
