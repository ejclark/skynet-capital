#!/usr/bin/env node
// PRIORITY LABELS — the one-time PATCH that gives P0–P3 their lane meanings (#6871 §6, PR-A).
//
// WHY A SCRIPT. The four P labels are unmanaged on purpose (#500: no lane rewrites a label it does
// not apply), so nothing syncs their descriptions and merging the new text in labels.mjs would leave
// the repo showing the old words. This reads each label, and PATCHes only the ones whose description
// differs, so a second run changes nothing. Run once after PR-A merges:
//
//   node scripts/moneypenny/priority-labels.mjs            # PATCH the labels that differ
//   node scripts/moneypenny/priority-labels.mjs --dry-run  # print what would change
import { isMain } from "../is-main.mjs";
import { ensureGhToken, ghRest, sh } from "./gh.mjs";
import { LABELS, PRIORITY_LABELS } from "./labels.mjs";

const byName = Object.values(LABELS);

/** The labels whose live description differs from the registry's: `[{name, description}]`. Pure. */
export function labelPatches(live = []) {
  const have = new Map(live.map((l) => [l.name, l.description ?? ""]));
  return PRIORITY_LABELS.flatMap((name) => {
    const description = byName.find((l) => l.name === name)?.description ?? "";
    return have.get(name) === description ? [] : [{ name, description }];
  });
}

/** Read the four labels and PATCH the ones that differ. `read`/`patch` are injected for the spec. */
export function applyPriorityLabels({
  dryRun = false,
  read = (name) => ghRest(`labels/${name}`),
  patch = ({ name, description }) =>
    sh("gh", [
      "api",
      "-X",
      "PATCH",
      `repos/{owner}/{repo}/labels/${name}`,
      "-f",
      `description=${description}`,
    ]),
  log = console.log,
} = {}) {
  const patches = labelPatches(PRIORITY_LABELS.map(read));
  for (const p of patches) {
    log(`${dryRun ? "would set" : "set"} ${p.name}: ${p.description}`);
    if (!dryRun) patch(p);
  }
  if (!patches.length) log("the P labels already carry the lane meanings");
  return patches;
}

if (isMain(import.meta.url)) {
  ensureGhToken();
  applyPriorityLabels({ dryRun: process.argv.includes("--dry-run") });
}
