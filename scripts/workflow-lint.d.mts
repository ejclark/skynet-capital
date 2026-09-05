// Type surface for the parts of workflow-lint.mjs worth testing directly — same arrangement as
// envelope-scan.d.mts (the scripts/ tree is plain ESM with `allowJs` off).
/** Duplicate mapping keys, as `{ line, key, indent }`. */
export function duplicateKeys(text: string): Array<{ line: number; key: string; indent: number }>;
/** `steps.<id>.outputs.…` referenced in a job with no step declaring that id. */
export function danglingStepRefs(text: string): Array<{ job: string; ref: string }>;
/** A `workflow_run` trigger with no `workflows:` list, as `["missing-workflows"]` or `[]`. */
export function unfilteredWorkflowRun(text: string): string[];
/** `needs:` entries naming a job the file does not define. */
export function danglingNeeds(text: string): Array<{ job: string; need: string }>;
/** Prompt shim paths (`.github/prompts/*.md`) referenced but not present in `available`. */
export function danglingPrompts(text: string, available?: string[]): string[];
/** A job step running `node scripts/<x>.mjs` whose import graph needs `node_modules`, with no
 *  earlier `npm ci`/`npm install` step in the same job. `hasDeps(scriptRelPath) => boolean` decides
 *  the "needs installing" question — real callers wire it to `needsInstalledDeps`. */
export function missingDepsInstall(
  text: string,
  hasDeps: (scriptRelPath: string) => boolean,
): Array<{ job: string; script: string }>;
/** All structural checks for one workflow file's text, as human-readable problem strings. */
export function lintWorkflow(
  name: string,
  text: string,
  prompts?: string[],
  hasScriptDeps?: (scriptRelPath: string) => boolean,
  knownLabels?: string[],
): string[];
