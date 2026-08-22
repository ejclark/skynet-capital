import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// EVERY LABEL THE PROMPTS NAME MUST BE ONE THE CODE PROVISIONS.
//
// Shipped defect, 2026-08-22: `.github/prompts/feedback-build.md` told every build session it must
// end in "a PR, `next-slice`, `needs-info`, or `needs-eric`" — and `needs-info`, `next-slice` and
// `curated` did not exist on the repo. They were declared in postmaster.mjs's LABELS and never
// passed to `ensureLabel`, which was only ever called for `event-research` and `stall-flagged`.
// `gh issue edit --add-label needs-info` therefore failed, and the lane fell back to the two exits
// that did exist: a PR, or `needs-eric`. The four-state design was two-thirds fictional, and the
// whole point of it — giving a member an answer that does not cost Eric anything — was unreachable.
//
// Static, no network: the prompt text and the provisioning table are both in the repo, so the
// mismatch is checkable here rather than discovered on a live issue.
const declared = (): string[] =>
  JSON.parse(
    execFileSync(
      "node",
      [
        "-e",
        'import("./scripts/postmaster.mjs").then((m) => console.log(JSON.stringify(Object.values(m.LABELS).map((l) => l.name))))',
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    ),
  );

/** Labels the prompt tells a session to apply — the backticked ones in its terminal-state table. */
function namedInPrompt(): string[] {
  const text = readFileSync(".github/prompts/feedback-build.md", "utf8");
  const known = ["needs-eric", "needs-info", "next-slice", "curated", "stall-flagged"];
  return known.filter((l) => text.includes(`\`${l}\``));
}

describe("label vocabulary", () => {
  it("provisions every label the build prompt instructs a session to apply", () => {
    const provisioned = new Set(declared());
    const named = namedInPrompt();

    expect(named.length).toBeGreaterThan(0);
    for (const label of named) {
      expect(
        provisioned.has(label),
        `the prompt names \`${label}\` but nothing provisions it`,
      ).toBe(true);
    }
  });

  it("exposes a vocabulary upsert, so provisioning is not per-intent", () => {
    // The defect's mechanism: labels were only created as a side effect of the two intents that
    // happened to pass one to `ensureLabel`. A terminal label nothing routes through never existed.
    const exported = execFileSync(
      "node",
      [
        "-e",
        'import("./scripts/postmaster.mjs").then((m) => console.log(typeof m.ensureVocabulary))',
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();

    expect(exported).toBe("function");
  });

  it("keeps each label's meaning distinct — needs-eric is his call, needs-info is the member's", () => {
    const labels = JSON.parse(
      execFileSync(
        "node",
        [
          "-e",
          'import("./scripts/postmaster.mjs").then((m) => console.log(JSON.stringify(m.LABELS)))',
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      ),
    ) as Record<string, { name: string; description: string }>;

    expect(labels.needsEric?.description).toMatch(/Eric/);
    expect(labels.needsInfo?.description).toMatch(/MEMBER/i);
    expect(labels.needsInfo?.description).toMatch(/never on Eric/i);
  });
});
