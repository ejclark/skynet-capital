/**
 * CLI: print the refinement proposals the scored claims imply (#5482 slice 5). A DRY RUN.
 *
 *   npm run research:proposals                      # every stored conviction, to stdout
 *   npm run research:proposals -- ai-dip-2026-10    # one
 *   npm run research:proposals -- --out proposals.md   # write the text to a file instead
 *
 * Reads the record with its recorded scores (`npm run research:claims` writes them). It opens no
 * pull request, edits no pair's settings and places no order: the text is for a reviewer. Paper
 * only, SIM.
 *
 * THE COMMITTED COPY (#5482 criterion 6). `research:claims` calls `writeRefinement` for each
 * conviction it scores, so the pull request that decides a claim carries what it implies as a diff
 * under `docs/research/convictions/refinements/` (a subdirectory: the research lint and the
 * forward-test proposal reader read only the conviction docs beside it). Opening a separate change
 * PR from a proposal's key is the next step.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { refinementText, renderProposals } from "../playbooks/claim-proposals.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";

export const REFINEMENTS_DIR = join(process.cwd(), "docs/research/convictions/refinements");

/** An id safe to name a file with; a record's id is a slug, and anything else writes nothing. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Write one conviction's refinement file from the scores attached to it, or remove a stale one when
 * no decided claim backs a fence any more (only a full pass can move a decided score). Returns the
 * path and what was done, or undefined when nothing was.
 */
export function writeRefinement(
  conviction: Conviction,
  dir: string = REFINEMENTS_DIR,
): { readonly path: string; readonly action: "wrote" | "removed" } | undefined {
  if (!SLUG.test(conviction.id)) return undefined;
  const path = join(dir, `${conviction.id}.md`);
  const text = refinementText(conviction);
  if (text === undefined) {
    if (!existsSync(path)) return undefined;
    rmSync(path);
    return { path, action: "removed" };
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, text);
  return { path, action: "wrote" };
}

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const outAt = argv.indexOf("--out");
  const out = outAt === -1 ? undefined : argv[outAt + 1];
  if (outAt !== -1 && (out === undefined || out.startsWith("--"))) {
    console.error("--out needs a file path");
    return 1;
  }
  const ids = argv.filter((a, i) => !a.startsWith("--") && i !== outAt + 1);
  const convictions = ids.length > 0 ? ids.map((id) => CONVICTIONS.get(id)) : CONVICTIONS.all();
  if (convictions.some((c) => c === undefined)) {
    console.error(`no such conviction: ${ids.join(", ")}`);
    return 1;
  }
  const text = convictions.flatMap((c) => (c ? [renderProposals(c)] : [])).join("\n");
  if (out) {
    writeFileSync(out, text);
    console.log(`wrote ${out}`);
  } else {
    process.stdout.write(text);
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) process.exit(main());
