// Type surface for is-main.mjs, the same arrangement as code-lines.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.
/** True when the module whose `import.meta.url` is `metaUrl` is the process's entry script, compared by real path. */
export function isMain(metaUrl: string, argv1?: string): boolean;
