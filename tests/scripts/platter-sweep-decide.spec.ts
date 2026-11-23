import { describe, expect, it } from "@rstest/core";
import {
  adoptCandidates,
  bumpLevel,
  checksGreen,
  judgeAdopt,
  judgeRebuild,
  openPlatter,
  type PrFacts,
  tasteHold,
} from "../../scripts/platter-sweep-decide.mjs";

// #7939, 2026-11-22: nine separate touches where the platter promised one. These fixtures are the
// census's own PRs, in the shape the REST API returned them that morning: #7737 and #7711 (protected,
// green, each held alone), #7674 (dependabot, workflow files), #7672 (held for a look, 100+ UI files
// and no protected path) and platter #7424 (`conflict-flagged`).

const isProtected = (path: string) =>
  path.startsWith(".github/workflows/") ||
  path === ".claude/settings.json" ||
  path === "scripts/moneypenny/work-mode.mjs";

const green = [
  { name: "verify", status: "completed", conclusion: "success" },
  { name: "verify", status: "completed", conclusion: "skipped" },
  { name: "integration tests", status: "completed", conclusion: "success" },
  { name: "arm auto-merge", status: "completed", conclusion: "skipped" },
];

const held = (over: Partial<PrFacts> = {}): PrFacts => ({
  number: 7737,
  title: "chore(settings): turn off the 17 account plugins this repo never uses",
  state: "open",
  draft: false,
  mergeable: true,
  labels: [{ name: "hold-merge" }],
  user: { login: "ejclark" },
  head: { ref: "ccr-31486dd4-vizc66" },
  base: { ref: "main" },
  body: "- **Held because `.claude/settings.json` is protected** by `envelope.json`. It can board the open platter (#7424) instead.",
  ...over,
});

const settingsFiles = [".claude/settings.json", "docs/process/TOKEN-EFFICIENCY.md"];

describe("judgeAdopt — a PR held only because its path is protected boards the platter", () => {
  it("adopts #7737: held, green, one protected path among plain docs", () => {
    const v = judgeAdopt({ pr: held(), files: settingsFiles, isProtected, checkRuns: green });
    expect(v.adopt).toBe(true);
    expect(v.kind).toBe("held");
    expect(v.protected).toEqual([".claude/settings.json"]);
    expect(v.branch).toBe("ccr-31486dd4-vizc66");
  });

  it("adopts #7711, whose body says it is held for Eric's merge, not for his eyes", () => {
    const pr = held({
      number: 7711,
      body: "- **Held for your merge:** `work-mode.mjs` is protected; my session can't push to the platter (#7424).",
    });
    const files = [
      "scripts/moneypenny/work-mode.mjs",
      "tests/scripts/moneypenny/work-mode.spec.ts",
    ];
    expect(judgeAdopt({ pr, files, isProtected, checkRuns: green }).adopt).toBe(true);
  });

  it("refuses #7672: a hold on a diff with no protected path cannot be protection", () => {
    const pr = held({ number: 7672, head: { ref: "claude/trading-ui-scenarios-07042p" } });
    const files = ["app/src/routes/trade.tsx", "app/src/shell/close-panel.tsx", "CLAUDE.md"];
    const v = judgeAdopt({ pr, files, isProtected, checkRuns: green });
    expect(v.adopt).toBe(false);
    expect(v.reason).toContain("touches no protected path");
  });

  it("refuses a protected PR whose hold is declared as taste, in the body or by label", () => {
    const files = [".claude/settings.json"];
    const look = held({ body: "Held so Eric can eyeball the new tab before it ships." });
    expect(judgeAdopt({ pr: look, files, isProtected, checkRuns: green }).reason).toContain(
      "taste hold",
    );
    const optOut = held({ body: "Summary.\n\nPlatter: no\n" });
    expect(judgeAdopt({ pr: optOut, files, isProtected, checkRuns: green }).reason).toContain(
      "Platter: no",
    );
    const label = held({ labels: [{ name: "hold-merge" }, { name: "needs-eric" }] });
    expect(judgeAdopt({ pr: label, files, isProtected, checkRuns: green }).reason).toContain(
      "needs-eric",
    );
  });

  it("refuses an unheld human PR: the normal merge path owns it", () => {
    const pr = held({ labels: [] });
    expect(
      judgeAdopt({ pr, files: settingsFiles, isProtected, checkRuns: green }).reason,
    ).toContain("not held");
  });

  it("refuses red, unfinished or conflicting PRs — nothing red boards", () => {
    const red = [
      ...green,
      { name: "stability budget", status: "completed", conclusion: "failure" },
    ];
    expect(
      judgeAdopt({ pr: held(), files: settingsFiles, isProtected, checkRuns: red }).reason,
    ).toContain("stability budget");
    const running = [{ name: "verify", status: "in_progress", conclusion: null }];
    expect(
      judgeAdopt({ pr: held(), files: settingsFiles, isProtected, checkRuns: running }).reason,
    ).toContain("still in_progress");
    const conflicted = held({ labels: [{ name: "hold-merge" }, { name: "conflict-flagged" }] });
    expect(
      judgeAdopt({ pr: conflicted, files: settingsFiles, isProtected, checkRuns: green }).reason,
    ).toContain("own branch");
  });

  it("refuses drafts, other bases, forks and the platter itself", () => {
    const f = settingsFiles;
    const c = green;
    expect(
      judgeAdopt({ pr: held({ draft: true }), files: f, isProtected, checkRuns: c }).adopt,
    ).toBe(false);
    expect(
      judgeAdopt({ pr: held({ base: { ref: "feat/x" } }), files: f, isProtected, checkRuns: c })
        .adopt,
    ).toBe(false);
    const fork = held({
      head: { ref: "x", repo: { full_name: "someone/fork" } },
      base: { ref: "main", repo: { full_name: "ejclark/skynet-capital" } },
    });
    expect(judgeAdopt({ pr: fork, files: f, isProtected, checkRuns: c }).reason).toContain("fork");
    const platter = held({ head: { ref: "platter/2026-11-11" } });
    expect(judgeAdopt({ pr: platter, files: f, isProtected, checkRuns: c }).adopt).toBe(false);
  });
});

describe("judgeAdopt — dependabot bumps to protected paths board only for patch and minor", () => {
  const bump = (title: string): PrFacts => ({
    number: 7674,
    title,
    state: "open",
    labels: [{ name: "dependencies" }, { name: "github_actions" }],
    user: { login: "dependabot[bot]" },
    head: { ref: "dependabot/github_actions/anthropics/claude-code-action-1.0.276" },
    base: { ref: "main" },
    body: "Bumps anthropics/claude-code-action from 1.0.266 to 1.0.276.",
  });
  const files = [".github/workflows/claude.yml", ".github/workflows/moneypenny-events.yml"];

  it("adopts #7674, a patch bump to workflow files, with no hold label needed", () => {
    const v = judgeAdopt({
      pr: bump("chore: bump anthropics/claude-code-action from 1.0.266 to 1.0.276"),
      files,
      isProtected,
      checkRuns: green,
    });
    expect(v.adopt).toBe(true);
    expect(v.kind).toBe("dependabot");
  });

  it("refuses a major, a group bump, and a bump that touches nothing protected", () => {
    const major = bump("chore: bump actions/checkout from 4.2.2 to 5.0.0");
    expect(judgeAdopt({ pr: major, files, isProtected, checkRuns: green }).reason).toContain(
      "major",
    );
    const group = bump("chore(deps-dev): bump the playwright group with 2 updates");
    expect(judgeAdopt({ pr: group, files, isProtected, checkRuns: green }).reason).toContain(
      "semver",
    );
    const plain = bump("chore(deps-dev): bump @biomejs/biome from 2.5.15 to 2.6.7");
    expect(
      judgeAdopt({ pr: plain, files: ["package.json"], isProtected, checkRuns: green }).reason,
    ).toContain("no protected path");
  });

  it("reads the bump level from the title", () => {
    expect(bumpLevel("chore: bump a/b from 1.0.266 to 1.0.276")).toBe("patch");
    expect(bumpLevel("chore(deps-dev): Bump @x/y from 21.2.3 to 21.3.0")).toBe("minor");
    expect(bumpLevel("bump x from v2.1.0 to v3.0.0")).toBe("major");
    expect(bumpLevel("bump the playwright group with 2 updates")).toBeNull();
  });
});

describe("tasteHold and checksGreen — the two judgments under adopt", () => {
  it("finds no taste in a protection-only hold, and names the line that holds for a look", () => {
    expect(tasteHold(held())).toBeNull();
    expect(tasteHold(held({ body: "Holding for a visual check of the tab." }))).toContain(
      "Holding for a visual",
    );
    // A look word on a line that holds nothing is not a hold.
    expect(
      tasteHold(held({ body: "The design doc is linked below.\nHeld: protected path." })),
    ).toBeNull();
  });

  it("counts a skipped required run as passing, as branch protection does", () => {
    expect(checksGreen(green).green).toBe(true);
    expect(checksGreen([{ name: "verify", status: "completed", conclusion: "success" }]).why).toBe(
      "no passing `integration tests`",
    );
  });
});

describe("judgeRebuild and openPlatter — the one platter stays mergeable", () => {
  const platter = (over: Partial<PrFacts> = {}): PrFacts => ({
    number: 7424,
    head: { ref: "platter/2026-11-11" },
    base: { ref: "main" },
    labels: [{ name: "hold-merge" }],
    mergeable: true,
    ...over,
  });

  it("rebuilds #7424: labelled conflict-flagged, even once GitHub calls it mergeable", () => {
    const v = judgeRebuild(
      platter({ labels: [{ name: "hold-merge" }, { name: "conflict-flagged" }] }),
    );
    expect(v.rebuild).toBe(true);
    expect(v.reason).toContain("conflict-flagged");
  });

  it("rebuilds a platter GitHub reports dirty, and leaves a clean one alone", () => {
    expect(judgeRebuild(platter({ mergeable: false, mergeable_state: "dirty" })).reason).toContain(
      "conflicts with main",
    );
    expect(judgeRebuild(platter()).rebuild).toBe(false);
    expect(judgeRebuild(platter({ mergeable: null })).rebuild).toBe(false);
  });

  it("names the newest open platter, and never offers a platter for adoption", () => {
    const open = [
      platter(),
      platter({ number: 7950, head: { ref: "platter/2026-11-22" } }),
      held(),
      { ...held(), number: 7674, labels: [], user: { login: "dependabot[bot]" } },
      { ...held(), number: 7000, labels: [] },
    ];
    expect(openPlatter(open)?.number).toBe(7950);
    expect(adoptCandidates(open).map((p) => p.number)).toEqual([7737, 7674]);
    expect(openPlatter([held()])).toBeNull();
  });
});
