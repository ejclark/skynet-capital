import { pathToFileURL } from "node:url";

/** True when the module at `metaUrl` (pass `import.meta.url`) is the script node was launched on,
 *  false when something imported it. Lets a research CLI export its pieces for tests and still run
 *  as `node dist/...`. Shared by the claim CLIs and signal-schedule. */
export const isMain = (metaUrl: string): boolean =>
  Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1] as string).href;
