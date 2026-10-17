/**
 * CLI: print the refinement proposals the scored claims imply (#5482 slice 5). A DRY RUN.
 *
 *   npm run research:proposals                      # every stored conviction, to stdout
 *   npm run research:proposals -- ai-dip-2026-10    # one
 *   npm run research:proposals -- --out proposals.md   # write the text to a file instead
 *
 * Reads the record with its recorded scores (`npm run research:claims` writes them). It opens no
 * pull request, edits no pair's settings and places no order: the text is for a reviewer, and the
 * hand-off to a lane that turns it into a PR is a later slice. Paper only, SIM.
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { renderProposals } from "../playbooks/claim-proposals.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";

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
