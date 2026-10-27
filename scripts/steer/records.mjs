// STEER RECORDS — the page's saved answers, read from what the skill pulled out of the artifact
// store (#5056). The skill reads them with the ArtifactData tool, either with `out_dir` (one file
// per document at `<out_dir>/<collection path>/<doc id>.json`) or by writing one JSON object of
// store path → document. Both shapes land here as `{ "tp/<id>/decisions/<key>": doc, … }`.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/** Saved records keyed by store path. No path means no history yet: `{}`. A missing path throws. */
export function readRecords(path) {
  if (!path) return {};
  const full = resolve(path);
  if (!existsSync(full)) throw new Error(`steer: no records at ${path}`);
  if (!statSync(full).isDirectory()) return JSON.parse(readFileSync(full, "utf8"));
  const out = {};
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".json")) {
        const key = relative(full, p).split("\\").join("/").slice(0, -".json".length);
        out[key] = JSON.parse(readFileSync(p, "utf8"));
      }
    }
  };
  walk(full);
  return out;
}
