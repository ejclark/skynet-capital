// Type surface for scene-bundle.mjs — same arrangement as scripts/redesign/shoot.d.mts (`allowJs` is off).

/** The shoot's own build of the scene, under node_modules. */
export const SCENE_CACHE: string;
/** The esbuild arguments `npm run build:scene` uses, aimed at `outfile`. */
export function sceneBuildArgs(outfile: string): string[];
/** The bundle a harness serves at `/three/scene.js`, or undefined when neither is built. */
export function sceneBundle(): string | undefined;
