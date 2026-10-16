import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  dueVerdict,
  groupItems,
  parseStamp,
  splitProtected,
  splitReadOnly,
} from "../../scripts/instruction-drift-scan.mjs";
import {
  doNotEditReason,
  instructionFiles,
  isInstructionFile,
} from "../../scripts/instructions/scope.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// The instruction-drift due scan (scripts/instruction-drift-scan.mjs) hands
// docs/grind/instruction-drift.instructions.md its item list and says when a run is owed. Its rules
// are pure functions, specced directly; its git reading runs in seeded repos, so the real repo's
// history never leaks in. Not a gate: nothing here reads the real repo's drift, only the tool.
const SCRIPT = join(process.cwd(), "scripts/instruction-drift-scan.mjs");
const PROTECTED = [{ pattern: ".github/prompts/**", why: "the lanes' own instructions" }];

describe("instruction scope — the one definition", () => {
  it("takes the root intent files, .claude docs, lane prompts, templates and docs", () => {
    for (const path of [
      "CLAUDE.md",
      "README.md",
      ".claude/skills/steer/SKILL.md",
      ".claude/agents/reviewer.md",
      ".github/prompts/feedback-build.md",
      ".github/pull_request_template.md",
      ".github/ISSUE_TEMPLATE/bug_report.yml",
      "docs/COACHES.md",
      "docs/grind/README.md",
      "docs/research-teams/PLAYBOOK.md",
    ]) {
      expect([path, isInstructionFile(path)]).toEqual([path, true]);
    }
  });

  it("keeps the templates and READMEs inside the ledger folders: sessions write entries from them", () => {
    for (const path of [
      "docs/research/events/TEMPLATE.md",
      "docs/research/weeks/README.md",
      "docs/digests/TEMPLATE.md",
      "docs/JOURNEYS/TEMPLATE.md",
      "docs/plans/README.md",
      "docs/plans/TEMPLATE.md",
      "docs/vendor/README.md",
    ]) {
      expect([path, isInstructionFile(path)]).toEqual([path, true]);
    }
  });

  it("leaves out the ledgers, code, settings, workflows and the issue chooser's config", () => {
    for (const path of [
      "docs/research/events/x.md",
      "docs/digests/2026-10-05.md",
      "docs/JOURNEYS/one.md",
      "docs/vendor/claude-code/hooks.md",
      "docs/plans/old.md",
      "docs/LESSONS.md",
      "docs/IDEAS.md",
      "app/README.md",
      "src/notes.md",
      ".claude/settings.json",
      ".github/workflows/pipeline.yml",
      ".github/ISSUE_TEMPLATE/config.yml",
      // records of their moment: the numbered ADRs, dated audits and the generated structure map
      "docs/adr/0001-host-live-dashboard-on-fly.md",
      "docs/GAMEBOARD-PLAN.md",
      "docs/STRUCTURE-graph.md",
    ]) {
      expect([path, isInstructionFile(path)]).toEqual([path, false]);
    }
  });

  it("names why a generated page or a verbatim record is never hand-edited", () => {
    for (const [path, why] of <[string, string][]>[
      ["docs/architecture/runtime-api.md", "architecture-pages.mjs"],
      ["docs/architecture/README.md", "architecture-pages.mjs"],
      ["docs/members/coverage.md", "crawl"],
      ["docs/members/friction-ledger.md", "crawl"],
      ["docs/members/study/profile-2026-10/readout-full-list.md", "readout.mjs"],
      ["docs/design/eric-feedback/r1-2026-10-09.md", "verbatim"],
    ]) {
      expect([path, isInstructionFile(path)]).toEqual([path, true]);
      expect([path, doNotEditReason(path)]).toEqual([path, expect.stringContaining(why)]);
    }
  });

  it("leaves the hand-written neighbours of those files editable", () => {
    for (const path of [
      "docs/adr/0000-template.md",
      "docs/adr/README.md",
      "docs/members/eric.md",
      "docs/members/study/README.md",
      "docs/members/study/profile-2026-10/roles/actor.md",
      "docs/design/README.md",
      "CLAUDE.md",
    ]) {
      expect([path, doNotEditReason(path)]).toEqual([path, null]);
    }
  });

  it("filters, de-duplicates and sorts a path list", () => {
    expect(instructionFiles(["docs/B.md", "src/a.ts", "CLAUDE.md", "docs/B.md"])).toEqual([
      "CLAUDE.md",
      "docs/B.md",
    ]);
  });
});

describe("instruction-drift due rules", () => {
  it("owes a run once files changed and the stamp is 7 or more days old", () => {
    expect(dueVerdict({ changed: 3, daysSince: 7 })).toEqual({ due: true, reason: "changed" });
    expect(dueVerdict({ changed: 3, daysSince: 6 })).toEqual({ due: false, reason: "fresh" });
  });

  it("owes nothing when nothing changed, however old the stamp", () => {
    expect(dueVerdict({ changed: 0, daysSince: 90 })).toEqual({ due: false, reason: "unchanged" });
  });

  it("owes a full run at a model release, changed or not", () => {
    expect(dueVerdict({ changed: 0, daysSince: 0, release: true })).toEqual({
      due: true,
      reason: "release",
    });
  });

  it("groups a skill's files into one item and every other file into its own", () => {
    const items = groupItems(
      [".claude/skills/steer/SKILL.md", "docs/A.md", ".claude/skills/steer/card.md"],
      "abc1234",
    );
    expect(items).toEqual([
      {
        label: ".claude/skills/steer",
        files: [".claude/skills/steer/SKILL.md", ".claude/skills/steer/card.md"],
        branch: "docs/instruction-drift-abc1234-claude-skills-steer",
      },
      {
        label: "docs/A.md",
        files: ["docs/A.md"],
        branch: "docs/instruction-drift-abc1234-docs-a-md",
      },
    ]);
  });

  it("splits a large skill into numbered items of at most six files", () => {
    const cards = Array.from({ length: 8 }, (_, i) => `.claude/skills/mermaid/c${i}.md`);
    const items = groupItems(cards, "abc1234");
    expect(items.map((i) => [i.label, i.files.length])).toEqual([
      [".claude/skills/mermaid (1/2)", 6],
      [".claude/skills/mermaid (2/2)", 2],
    ]);
  });

  it("gives every chunk of a skill its SKILL.md: in files, or else as context", () => {
    const cards = Array.from({ length: 25 }, (_, i) => `.claude/skills/mermaid/reference/c${i}.md`);
    const items = groupItems([".claude/skills/mermaid/SKILL.md", ...cards], "abc1234");
    expect(items).toHaveLength(5);
    for (const item of items) {
      const reads = [...item.files, ...(item.context ?? [])];
      expect([item.label, reads]).toEqual([
        item.label,
        expect.arrayContaining([".claude/skills/mermaid/SKILL.md"]),
      ]);
    }
    expect(items.filter((i) => i.context).length).toBe(4);
    const cardsOnly = groupItems([".claude/skills/steer/card.md"], "abc1234");
    expect(cardsOnly.map((i) => i.context)).toEqual([[".claude/skills/steer/SKILL.md"]]);
    expect(groupItems(["docs/A.md"], "abc1234").map((i) => i.context)).toEqual([undefined]);
  });

  it("splits do-not-edit files out of the item list, naming why", () => {
    const split = splitReadOnly(["docs/A.md", "docs/architecture/runtime-api.md"]);
    expect(split.editable).toEqual(["docs/A.md"]);
    expect(split.readOnly.map((r) => r.path)).toEqual(["docs/architecture/runtime-api.md"]);
  });

  it("never gives two items one branch", () => {
    const branches = groupItems(["docs/a.b.md", "docs/a-b.md"], "abc1234").map((i) => i.branch);
    expect(new Set(branches).size).toBe(2);
  });

  it("sends an item with any protected file to the platter, naming the rule", () => {
    const items = groupItems([".github/prompts/plan-build.md", "docs/A.md"], "abc1234");
    const split = splitProtected(items, PROTECTED);
    expect(split.items.map((i) => i.label)).toEqual(["docs/A.md"]);
    expect(split.protectedItems.map((i) => [i.label, i.pattern])).toEqual([
      [".github/prompts/plan-build.md", ".github/prompts/**"],
    ]);
  });

  it("reads a well-formed stamp and names what is wrong with a broken one", () => {
    const good = JSON.stringify({ commit: "05c7b94", date: "2026-10-05", run: "full" });
    expect(parseStamp(good)).toEqual({
      stamp: { commit: "05c7b94", date: "2026-10-05", run: "full" },
    });
    expect(parseStamp("{not json").problem).toContain("not valid JSON");
    expect(parseStamp(JSON.stringify({ date: "2026-10-05" })).problem).toContain("commit");
    expect(parseStamp(JSON.stringify({ commit: "05c7b94", date: "Oct 5" })).problem).toContain(
      "date",
    );
    expect(
      parseStamp(JSON.stringify({ commit: "05c7b94", date: "2026-10-05", run: "weekly" })).problem,
    ).toContain("weekly");
  });

  it("the committed stamp is one the scan can read", () => {
    const text = readFileSync(join(process.cwd(), "instruction-drift-stamp.json"), "utf8");
    expect(parseStamp(text).problem).toBeUndefined();
  });
});

// ---- seeded repos ---------------------------------------------------------------------------------

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** A throwaway repo with envelope.json, two instruction files and one code file on origin/main. */
function seedRepo() {
  const root = mkdtempSync(join(tmpdir(), "instruction-drift-"));
  roots.push(root);
  const env = hermeticGitEnv();
  /** Git in the seeded repo; `at` (YYYY-MM-DD) dates a commit, which the stamp's date is read from. */
  const gitAt = (at: string | null, ...args: string[]) =>
    execFileSync(
      "git",
      [
        "-c",
        "user.email=spec@example.com",
        "-c",
        "user.name=spec",
        "-c",
        "commit.gpgsign=false",
      ].concat(args),
      {
        cwd: root,
        env: at
          ? { ...env, GIT_COMMITTER_DATE: `${at}T12:00:00Z`, GIT_AUTHOR_DATE: `${at}T12:00:00Z` }
          : env,
        encoding: "utf8",
      },
    ).trim();
  const git = (...args: string[]) => gitAt(null, ...args);
  const write = (path: string, body: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  };
  /** Commit everything and move origin/main to it, as a landed squash would. */
  const land = (message: string, at: string | null = null) => {
    git("add", "-A");
    gitAt(at, "commit", "-q", "--allow-empty", "-m", message);
    git("update-ref", "refs/remotes/origin/main", "HEAD");
    return git("rev-parse", "HEAD");
  };
  const stamp = (commit: string, date: string) =>
    write("instruction-drift-stamp.json", JSON.stringify({ commit, date, run: "incremental" }));
  const scan = (...args: string[]) => {
    const r = spawnSync("node", [SCRIPT, ...args], { cwd: root, env, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout}${r.stderr}`, stdout: r.stdout };
  };
  git("init", "-q");
  write("envelope.json", JSON.stringify({ protected: PROTECTED }));
  write("CLAUDE.md", "# rules\n");
  write("docs/GUIDE.md", "# guide\n");
  write("docs/OLD.md", "# a doc about to be renamed, long enough to be recognised as a rename\n");
  write("src/a.ts", "export {};\n");
  const base = land("base");
  return { root, git, write, land, stamp, scan, base };
}

describe("instruction-drift scan — seeded repos", () => {
  it("lists only the in-scope files changed since the stamp, renames by their new name", () => {
    const repo = seedRepo();
    repo.stamp(repo.base, "2026-10-01");
    repo.write("CLAUDE.md", "# rules, changed\n");
    repo.git("mv", "docs/OLD.md", "docs/NEW.md");
    repo.git("rm", "-q", "docs/GUIDE.md");
    repo.write("docs/research/y.md", "a ledger row\n");
    repo.write("src/b.ts", "export {};\n");
    repo.write(".claude/skills/demo/SKILL.md", "---\nname: demo\n---\n");
    repo.write(".claude/skills/demo/card.md", "a card\n");
    repo.write(".github/prompts/lane.md", "a lane prompt\n");
    repo.land("a week of work");

    const { code, stdout } = repo.scan("--json", "--today", "2026-10-08");
    expect(code).toBe(0);
    const s = JSON.parse(stdout);
    expect(s.files).toEqual([
      ".claude/skills/demo/SKILL.md",
      ".claude/skills/demo/card.md",
      ".github/prompts/lane.md",
      "CLAUDE.md",
      "docs/NEW.md",
    ]);
    expect(s.items.map((i: { label: string }) => i.label)).toEqual([
      ".claude/skills/demo",
      "CLAUDE.md",
      "docs/NEW.md",
    ]);
    expect(s.protectedItems.map((i: { label: string }) => i.label)).toEqual([
      ".github/prompts/lane.md",
    ]);
    expect(s).toMatchObject({ state: "known", due: true, reason: "changed", daysSince: 7 });
  });

  it("--due exits 1 at seven days and 0 at six", () => {
    const repo = seedRepo();
    repo.stamp(repo.base, "2026-10-01");
    repo.write("docs/GUIDE.md", "# guide, changed\n");
    repo.land("one change");
    expect(repo.scan("--due", "--today", "2026-10-08").code).toBe(1);
    const early = repo.scan("--due", "--today", "2026-10-07");
    expect(early.code).toBe(0);
    expect(early.out).toContain("not due");
  });

  it("leaves a changed do-not-edit file out of the items, and owes no run for it alone", () => {
    const repo = seedRepo();
    repo.stamp(repo.base, "2026-10-01");
    repo.write("docs/architecture/runtime-api.md", "# a generated page\n");
    repo.write("docs/adr/0001-a-decision.md", "# an append-only record\n");
    repo.land("generated and append-only only");
    const r = repo.scan("--json", "--today", "2026-10-08");
    expect(r.code).toBe(0);
    const s = JSON.parse(r.stdout);
    expect(s.files).toEqual([]);
    expect(s.items).toEqual([]);
    // The generated page is in scope but read-only; the ADR is a record, so it is not in scope at all.
    expect(s.readOnly.map((x: { path: string }) => x.path)).toEqual([
      "docs/architecture/runtime-api.md",
    ]);
    expect(s).toMatchObject({ due: false, reason: "unchanged" });
  });

  it("--due exits 0 when nothing in scope changed, however old the stamp", () => {
    const repo = seedRepo();
    repo.stamp(repo.base, "2026-01-01");
    repo.write("src/a.ts", "export const changed = 1;\n");
    repo.land("code only");
    const r = repo.scan("--due", "--today", "2026-10-08");
    expect(r.code).toBe(0);
    expect(r.out).toContain("no instruction file changed");
  });

  it("is UNKNOWN (exit 3), never 'nothing changed', without a stamp", () => {
    const repo = seedRepo();
    const r = repo.scan("--due");
    expect(r.code).toBe(3);
    expect(r.out).toContain("UNKNOWN");
    expect(r.out).toContain("instruction-drift-stamp.json is missing");
  });

  it("is UNKNOWN when the stamp names a commit this checkout cannot reach", () => {
    const repo = seedRepo();
    repo.stamp("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef", "2026-10-01");
    const r = repo.scan("--json");
    expect(r.code).toBe(3);
    expect(JSON.parse(r.stdout)).toMatchObject({ state: "unknown" });
  });

  it("is UNKNOWN when the stamp is not an ancestor of the commit read", () => {
    const repo = seedRepo();
    repo.git("checkout", "-q", "-b", "side");
    repo.git("commit", "-q", "--allow-empty", "-m", "a branch commit no squash keeps");
    const side = repo.git("rev-parse", "HEAD");
    repo.git("checkout", "-q", "-");
    repo.stamp(side, "2026-10-01");
    const r = repo.scan();
    expect(r.code).toBe(3);
    expect(r.out).toContain("not an ancestor");
  });

  it("is UNKNOWN when envelope.json is unreadable, since no item could be called open", () => {
    const repo = seedRepo();
    repo.stamp(repo.base, "2026-10-01");
    rmSync(join(repo.root, "envelope.json"));
    const r = repo.scan();
    expect(r.code).toBe(3);
    expect(r.out).toContain("envelope.json");
  });

  it("--release owes a full run over every in-scope file, stamp or not", () => {
    const repo = seedRepo();
    const r = repo.scan("--release", "--due", "--json");
    expect(r.code).toBe(1);
    const s = JSON.parse(r.stdout);
    expect(s.files).toEqual(["CLAUDE.md", "docs/GUIDE.md", "docs/OLD.md"]);
    expect(s.reason).toBe("release");
  });

  it("--record stamps the commit read, after which nothing is owed", () => {
    const repo = seedRepo();
    repo.write("docs/GUIDE.md", "# guide, changed\n");
    const head = repo.land("one change", "2026-10-08");
    const rec = repo.scan("--record", "--at", head);
    expect(rec.code).toBe(0);
    const written = JSON.parse(
      readFileSync(join(repo.root, "instruction-drift-stamp.json"), "utf8"),
    );
    expect(written).toMatchObject({ commit: head, date: "2026-10-08", run: "incremental" });
    const after = repo.scan("--due", "--today", "2026-10-30");
    expect(after.code).toBe(0);
  });

  it("--record dates the stamp by the commit read, so a late record never skips a week", () => {
    const repo = seedRepo();
    const monday = repo.land("the commit Monday's scan read", "2026-10-05");
    repo.land("a wave that merged a day late", "2026-10-06");
    expect(repo.scan("--record", "--at", monday).code).toBe(0);
    const written = JSON.parse(
      readFileSync(join(repo.root, "instruction-drift-stamp.json"), "utf8"),
    );
    expect(written.date).toBe("2026-10-05");
    repo.write("docs/GUIDE.md", "# guide, changed in the week\n");
    repo.land("a week of work", "2026-10-09");
    expect(repo.scan("--due", "--today", "2026-10-12").code).toBe(1);
  });

  it("--record refuses to run without --at, never stamping a commit the run did not read", () => {
    const repo = seedRepo();
    const r = repo.scan("--record");
    expect(r.code).toBe(2);
    expect(r.out).toContain("--record needs --at");
    expect(() => readFileSync(join(repo.root, "instruction-drift-stamp.json"))).toThrow();
  });

  it("--record refuses a commit that is not on origin/main", () => {
    const repo = seedRepo();
    repo.git("checkout", "-q", "-b", "wave");
    repo.git("commit", "-q", "--allow-empty", "-m", "the wave branch's own commit");
    const r = repo.scan("--record", "--at", "HEAD");
    expect(r.code).toBe(2);
    expect(r.out).toContain("not on origin/main");
  });

  it("refuses an unknown argument, or a flag missing its value, instead of scanning anyway", () => {
    const repo = seedRepo();
    const typo = repo.scan("--relase");
    expect(typo.code).toBe(2);
    expect(typo.out).toContain('unknown argument "--relase"');
    const bare = repo.scan("--at", "--json");
    expect(bare.code).toBe(2);
    expect(bare.out).toContain("--at needs a value");
  });
});

describe("instruction-drift scan — the real repo", () => {
  it("--scope lists the files the chore may edit at HEAD: no ledgers, no generated pages", () => {
    const out = execFileSync("node", [SCRIPT, "--scope", "--at", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: hermeticGitEnv(),
    });
    const files = out.trim().split("\n");
    expect(files).toContain("CLAUDE.md");
    expect(files).toContain("docs/grind/README.md");
    expect(files).not.toContain("docs/LESSONS.md");
    expect(files).not.toContain("docs/architecture/runtime-api.md");
    expect(files).toContain("docs/research/events/TEMPLATE.md");
  });
});
