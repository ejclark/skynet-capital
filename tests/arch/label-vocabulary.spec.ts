import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// EVERY LABEL THE PROMPTS NAME MUST BE ONE THE CODE PROVISIONS.
//
// Shipped defect, 2026-08-22: `.github/prompts/feedback-build.md` told every build session it must
// end in "a PR, `next-slice`, `needs-info`, or `needs-eric`" — and `needs-info`, `next-slice` and
// `curated` did not exist on the repo. They were declared in moneypenny.mjs's (then postmaster.mjs's) LABELS and never
// passed to `ensureLabel`, which was only ever called for `event-research` and `stall-flagged`.
// `gh issue edit --add-label needs-info` therefore failed, and the lane fell back to the two exits
// that did exist: a PR, or `needs-eric`. The four-state design was two-thirds fictional, and the
// whole point of it — giving a member an answer that does not cost Eric anything — was unreachable.
//
// Static, no network: the prompt text and the provisioning table are both in the repo, so the
// mismatch is checkable here rather than discovered on a live issue.
const PROMPTS = ".github/prompts";

/** What the code actually PROVISIONS — `MANAGED_LABELS`, not the whole registry.
 *
 *  The distinction arrived with #500: `LABELS` now also carries labels this repo runs on but no
 *  lane here applies (`bug`, `handoff`, `idea`…), registered purely so other scripts resolve a
 *  name instead of pasting a literal. Reading the full registry here would quietly gut this gate —
 *  a prompt naming a merely-registered label would pass while `--add-label` still 404'd on it,
 *  which is the exact 2026-08-22 defect described above. */
const declared = (): string[] =>
  JSON.parse(
    execFileSync(
      "node",
      [
        "-e",
        'import("./scripts/moneypenny.mjs").then((m) => console.log(JSON.stringify(m.MANAGED_LABELS.map((l) => l.name))))',
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    ),
  );

const registry = (): Record<string, { name: string; color: string; description: string }> =>
  JSON.parse(
    execFileSync(
      "node",
      [
        "-e",
        'import("./scripts/moneypenny.mjs").then((m) => console.log(JSON.stringify(m.LABELS)))',
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  );

/** Labels the prompts tell a session to apply — the backticked ones in their terminal-state tables.
 *  EVERY prompt, not just the feedback lane's: this gate was written for one file, which left the
 *  identical hole open for the next lane added. A prompt naming an unprovisioned label fails the
 *  same way wherever it lives. */
function namedInPrompts(): string[] {
  const known = ["needs-eric", "needs-info", "next-slice", "curated", "stall-flagged"];
  const named = new Set<string>();
  for (const file of readdirSync(PROMPTS).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(PROMPTS, file), "utf8");
    for (const label of known) if (text.includes(`\`${label}\``)) named.add(label);
  }
  return [...named];
}

describe("label vocabulary", () => {
  it("provisions every label any build prompt instructs a session to apply", () => {
    const provisioned = new Set(declared());
    const named = namedInPrompts();

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
        'import("./scripts/moneypenny.mjs").then((m) => console.log(typeof m.ensureVocabulary))',
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();

    expect(exported).toBe("function");
  });

  it("keeps each label's meaning distinct — needs-eric is his call, needs-info is the member's", () => {
    const labels = registry();

    expect(labels.needsEric?.description).toMatch(/Eric/);
    expect(labels.needsInfo?.description).toMatch(/MEMBER/i);
    expect(labels.needsInfo?.description).toMatch(/never on Eric/i);
  });
});

// TWO TIERS (#500). The registry answers "what does this repo mean by this label" for every lane
// that reads one; `MANAGED_LABELS` answers the much narrower "what does this file guarantee". They
// are not the same set, and collapsing them in either direction is a defect with a real cost:
// merge them upward and this script silently becomes the owner of GitHub's defaults and of every
// color Eric picks in the UI; merge them downward and the gate above stops gating.
describe("the label registry", () => {
  const names = () => Object.values(registry()).map((l) => l.name);

  it("registers every label the repo actually runs on", () => {
    const registered = names();
    // The five #500 named as missing, plus `ci-failure` — which lived in a SECOND registry over in
    // moneypenny-repair.mjs (then `ci-medic.mjs`, renamed #912), the exact duplication the issue is about.
    for (const name of [
      "handoff",
      "idea",
      "feedback",
      "bug",
      "enhancement",
      "ci-failure",
      "event-research",
      "stall-flagged",
      "curated",
      "needs-info",
      "next-slice",
      "needs-eric",
      "plan",
    ]) {
      expect(registered, `\`${name}\` is live on this repo but unregistered`).toContain(name);
    }
  });

  it("upserts only what it applies — registering a label never makes this script its owner", () => {
    const managed = [...declared()].sort();

    // Exactly the eight this file applies. `bug`/`enhancement` are GitHub's own defaults and
    // `idea`/`feedback` are the intake form's: upserting those would silently revert a recolor
    // made in the UI on the next push to main, with nothing anywhere saying why it changed back.
    expect(managed).toEqual([
      "conflict-flagged",
      "curated",
      "event-research",
      "hold-merge",
      "needs-eric",
      "needs-info",
      "next-slice",
      "plan",
      "stall-flagged",
    ]);
    for (const name of ["handoff", "idea", "feedback", "bug", "enhancement", "ci-failure"]) {
      expect(
        managed,
        `\`${name}\` is registered for lookup and must never be written`,
      ).not.toContain(name);
    }
  });

  it("records idea and feedback as they really are, not as they ought to look", () => {
    // A registry whose job is validation must not lie about the repo it describes. Both are
    // genuinely default-grey with no description today; improving them is its own deliberate
    // change, not something smuggled in under a registration.
    const labels = registry();
    expect(labels.idea).toEqual({ name: "idea", color: "ededed", description: "" });
    expect(labels.feedback).toEqual({ name: "feedback", color: "ededed", description: "" });
  });

  it("keeps moneypenny-repair on this vocabulary instead of a second copy of it", () => {
    const same = execFileSync(
      "node",
      [
        "-e",
        `Promise.all([import("./scripts/moneypenny.mjs"), import("./scripts/moneypenny-repair.mjs")]).then(
           ([p, repair]) => console.log(String(repair.LABEL === p.LABELS.ciFailure)),
         );`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();

    expect(same).toBe("true");
  });
});
