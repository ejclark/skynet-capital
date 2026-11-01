// A held platter PR as the boarding code really writes it (#6530). The body is not hand-typed: one
// item PR body runs through `itemRefs` → `trailerLines` (the boarded commit's trailers) →
// `parseBoarded` → `summaryBullets`, the path scripts/platter-refs.mjs takes, so a spec that reads
// it tests the shape a live platter carries — #4637, #4635 and #4984 each name a `Closes` AND a
// `Part of` issue.
import {
  itemRefs,
  parseBoarded,
  summaryBullets,
  trailerLines,
} from "../../scripts/platter-refs.mjs";

/** One boarded item whose PR body said `Closes #closes` / `Part of #partOf`, as an open platter. */
export function heldPlatter({
  number = 950,
  closes = [] as number[],
  partOf = [] as number[],
} = {}) {
  const prBody = [
    "## Summary",
    ...closes.map((n) => `- Closes #${n}`),
    ...partOf.map((n) => `- Part of #${n}`),
  ].join("\n");
  const trailers = trailerLines(itemRefs({ prBody }));
  const log = `abc123\x00fix(x): the protected part\x00Why.\n\n${trailers.join("\n")}\x1e`;
  return {
    number,
    title: "chore(platter): 2026-11-01",
    body: `## Summary\n\n${summaryBullets(parseBoarded(log)).join("\n")}`,
    head: { ref: "platter/2026-11-01" },
  };
}
