import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// Check ⑤ of scripts/config-audit.mjs (scripts/crawl/loop-freshness.mjs): the product/UX loops
// (the crawl, its judge pass, the coverage join, the scenario headline) run only when someone
// remembers, so the digest reads what each last wrote. Pinned over fixtures, never the real repo's
// files (which move every week): each finding names its clearing command, the section says it is
// lane work (Noise absorbed, never Needs you), absent inputs are named skips, a garbled one is
// UNKNOWN and exit 2.
const SCRIPT = join(process.cwd(), "scripts/config-audit.mjs");
const TODAY = "2026-10-18";

type Files = Record<string, string>;

/** Run the real audit in a git fixture seeded with `files`; return {status, section ⑤}. */
function audit(files: Files): { status: number; section: string } {
  const root = mkdtempSync(join(tmpdir(), "loop-freshness-fixture-"));
  const env = { ...hermeticGitEnv(), GIT_CEILING_DIRECTORIES: dirname(root) };
  try {
    execFileSync("git", ["init", "-q"], { cwd: root, env });
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), body);
    }
    let status = 0;
    let out: string;
    try {
      out = execFileSync("node", [SCRIPT, `--today=${TODAY}`], {
        cwd: root,
        encoding: "utf8",
        env,
      });
    } catch (err) {
      const e = err as { status: number; stdout?: string };
      status = e.status;
      out = e.stdout ?? "";
    }
    const start = out.indexOf("⑤");
    return { status, section: out.slice(start, out.indexOf("─", start)) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const ledger = (date: string, members: string[], judges: string[]) =>
  [
    "# Friction ledger — the persona crawl's findings",
    "",
    `_Run ${date} (run 0 = the baseline before any lift). Written by \`scripts/crawl/run.mjs\`; never edited by hand — re-run the crawl. Frames: \`docs/shots/crawl-${date}/\`. Members: ${members.join(" · ")}._`,
    "",
    "- Judge: every row reads `pending (grind)` until `docs/grind/journey-judge.instructions.md` runs over the frames.",
    "",
    "| member | journey / step | what | where | severity | fix | judge |",
    "|---|---|---|---|---|---|---|",
    ...judges.map((j) => `| ${members[0]} | j1 · s1 (phone) | a finding | — | low | S | ${j} |`),
    "",
  ].join("\n");

const coverage = (gaps: number, stale: number) =>
  [
    "# Journey coverage — every living screen, at phone width",
    "",
    `**27 of 40 living rows covered at phone · ${gaps} gaps · 9 undecided**`,
    "",
    ...(stale ? [`> **0 unjudged · ${stale} stale** — fix \`triage.json\`.`, ""] : []),
  ].join("\n");

const journey = (member: string) => JSON.stringify({ member, journeys: [] });

const scenarios = (lines: number, gaps: number) =>
  `- **${lines} acceptance lines, ${gaps} of them known gaps** (\`it.fails\`).\n`;

const spec = (fails: number) =>
  [
    `it("s1 — passes", () => {});`,
    ...Array.from({ length: fails }, () => `it.fails("gap", () => {});`),
  ].join("\n");

/** Every loop fresh and every count in agreement: two members, both walked and graded. */
const FRESH: Files = {
  "docs/members/friction-ledger.md": ledger(
    "2026-10-10",
    ["eric", "first-timer"],
    ["yes", "no — nothing names onboarding"],
  ),
  "e2e/journeys/eric.journey.json": journey("eric"),
  "e2e/journeys/first-timer.journey.json": journey("first-timer"),
  "docs/members/coverage.md": coverage(1, 0),
  "journey-coverage-budget.json": JSON.stringify({ gaps: 1 }),
  "docs/members/scenarios.md": scenarios(3, 2),
  "tests/scenarios/a.spec.ts": spec(2),
};

describe("config-audit check ⑤ — product/UX loop freshness", () => {
  it("says it is lane work, so the digest folds it into Noise absorbed and never Needs you", () => {
    const { section } = audit(FRESH);
    expect(section).toContain("lane work — fold into Noise absorbed, never Needs you");
  });

  it("reports the run date and raises no finding while every loop is fresh and agrees", () => {
    const { status, section } = audit(FRESH);
    expect(status).toBe(0);
    expect(section).toContain("· the crawl last ran 2026-10-10, 8 days ago.");
    expect(section).not.toContain("•");
  });

  it("names each stale loop with the command that clears it", () => {
    const { status, section } = audit({
      ...FRESH,
      "docs/members/friction-ledger.md": ledger(
        "2026-09-26",
        ["eric"],
        ["pending (grind)", "yes", "pending (grind)"],
      ),
      "docs/members/coverage.md": coverage(3, 2),
      "journey-coverage-budget.json": JSON.stringify({ gaps: 0 }),
      "tests/scenarios/a.spec.ts": spec(1),
    });
    expect(status).toBe(0);
    expect(section).toContain(
      "• the crawl last ran 2026-09-26, 22 days ago (over 14). Clear: `npm run crawl`",
    );
    expect(section).toContain(
      "• 1 journey member(s) with no crawl entry: first-timer. Clear: `npm run crawl`.",
    );
    expect(section).toContain("• 2 ledger row(s) the judge never graded");
    expect(section).toContain("`/grind` over docs/grind/journey-judge.instructions.md");
    expect(section).toContain("• 3 phone coverage gap(s), budget 0");
    expect(section).toContain("then `npm run crawl:coverage`.");
    expect(section).toContain("• 2 stale · 0 unjudged triage row(s)");
    expect(section).toContain(
      "• 1 `it.fails` in tests/scenarios/*.spec.ts, but docs/members/scenarios.md's headline says 2 known gaps.",
    );
  });

  it("asks for the ratchet to be locked when coverage gaps fall below the budget", () => {
    const { section } = audit({
      ...FRESH,
      "journey-coverage-budget.json": JSON.stringify({ gaps: 4 }),
    });
    expect(section).toContain(
      "• coverage gaps fell to 1, budget 4. Clear: `node scripts/crawl/coverage-budget.mjs --update`",
    );
  });

  it("flags a ledger exactly 15 days old but not one 14 days old", () => {
    const at = (date: string) =>
      audit({
        ...FRESH,
        "docs/members/friction-ledger.md": ledger(date, ["eric", "first-timer"], ["yes"]),
      }).section;
    expect(at("2026-10-04")).toContain("· the crawl last ran 2026-10-04, 14 days ago.");
    expect(at("2026-10-03")).toContain("• the crawl last ran 2026-10-03, 15 days ago (over 14).");
  });

  it("names absent inputs as skipped checks, never as a clean bill or an exit 2", () => {
    const { status, section } = audit({});
    expect(status).toBe(0);
    expect(section).toContain(
      "· docs/members/friction-ledger.md absent — the crawl's age, member and judge checks skipped.",
    );
    expect(section).toContain(
      "· docs/members/coverage.md absent — the coverage gap and stale-triage checks skipped.",
    );
    expect(section).toContain(
      "· docs/members/scenarios.md absent — the scenario headline check skipped.",
    );
  });

  it("says UNKNOWN and exits 2 when an input is present but unreadable", () => {
    const { status, section } = audit({
      ...FRESH,
      "docs/members/friction-ledger.md": "# Friction ledger\n\nno header here\n",
      "journey-coverage-budget.json": "{ not json",
    });
    expect(status).toBe(2);
    expect(section).toContain(
      "• UNKNOWN — docs/members/friction-ledger.md has no `_Run <date> … Members: …_` header",
    );
    expect(section).toContain("• UNKNOWN — journey-coverage-budget.json has no integer `gaps`");
    expect(section).not.toContain("the crawl last ran");
  });
});
