import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { type ServerWriteFinding, scanServerFile } from "../support/server-write-scan.js";

// The app server may file feedback and research asks; it never steers the plan lanes or the work
// dial (#7286, named next slice 7). Its GitHub token posts as the owner's login, so a label or a
// comment it writes reads as his hand: `plan-claim.mjs` takes an owner's `ready` label or "ready"
// comment on a plan as the go, and `dial-tap.mjs` arms surge on a work-mode label from his login.
// This spec reads every file under src/server, without running it, and fails naming file and line.
//
// EARS:
// - WHEN code under src/server names a work-mode label, the spec SHALL fail at that line.
// - WHEN code under src/server writes the `plan` label, or lists it among labels, it SHALL fail.
// - WHEN a write adds or removes `ready` in a file that never asks `isPlanIssue`, it SHALL fail.
// - WHEN a file outside KNOWN_WRITERS writes a GitHub comment or label, it SHALL fail at that line.
// - WHILE a KNOWN_WRITERS entry no longer writes, or skips the plan check it promises, it SHALL fail.
// - Text inside comments, and reads such as `work-mode.json` or `?labels=plan`, SHALL NOT count.

const SERVER = join(__dirname, "..", "..", "src", "server");

/** Every src/server file that writes a comment or a label onto a GitHub issue, and why that write
 *  cannot steer a plan lane. A new writer fails until it is listed here, so a reviewer reads it. */
const KNOWN_WRITERS: Readonly<Record<string, { why: string; refusesPlans: boolean }>> = {
  "feedback-service.ts": {
    why: "labels the feedback issue it has just filed, with the labels from labelsFor",
    refusesPlans: false,
  },
  "feedback-followup.ts": {
    why: "comments on the member's own filing and may cycle `ready`; refuses a plan issue first",
    refusesPlans: true,
  },
  "unclean-restart-report.ts": {
    why: "files, labels and comments on its own restart incident issue, in text it writes itself",
    refusesPlans: false,
  },
};
const KNOWN = new Set(Object.keys(KNOWN_WRITERS));

function serverFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return serverFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

const FIXTURES = join(__dirname, "..", "fixtures", "server-label-guard");
const scan = (file: string, text: string) => scanServerFile(file, text, KNOWN);
/** Scan a fixture as though it were the src/server file `as`. */
const scanFixture = (name: string, as: string) =>
  scan(as, readFileSync(join(FIXTURES, `${name}.ts.txt`), "utf8"));
const rules = (findings: readonly ServerWriteFinding[]) => findings.map((f) => f.rule);

describe("server label guard: the scanner, against fixtures", () => {
  it("fails on a work-mode label, naming the file and line", () => {
    const { findings } = scanFixture("work-mode-label", "feedback-service.ts");
    expect(rules(findings)).toContain("work-mode-label");
    expect(findings.find((f) => f.rule === "work-mode-label")?.message).toMatch(
      /^src\/server\/feedback-service\.ts:2 /,
    );
  });

  it("fails on a plan label, whether written directly, removed, or kept in a label list", () => {
    const direct = scanFixture("plan-label-direct", "feedback-service.ts");
    expect(rules(direct.findings)).toContain("plan-label");
    const removed = scanFixture("plan-label-removed", "feedback-service.ts");
    expect(rules(removed.findings)).toContain("plan-label");
    const listed = scanFixture("plan-label-listed", "feedback-issue.ts");
    expect(rules(listed.findings)).toEqual(["plan-label"]);
  });

  it("fails on a ready write in a file that never asks whether the issue is a plan", () => {
    const { findings } = scanFixture("ready-unguarded", "feedback-followup.ts");
    expect(rules(findings)).toEqual(["ready-unguarded"]);
    expect(findings[0]?.message).toContain("src/server/feedback-followup.ts:1");
    expect(findings[0]?.message).toContain("isPlanIssue");
    expect(scanFixture("ready-guarded", "feedback-followup.ts").findings).toEqual([]);
  });

  it("fails on a comment or label write from a file not on the known list", () => {
    const { findings, writes } = scanFixture("comment-by-url-const", "owner-queue.ts");
    expect(rules(findings)).toEqual(["unknown-writer"]);
    expect(findings[0]?.message).toMatch(/^src\/server\/owner-queue\.ts:3 writes a GitHub comment/);
    expect(writes).toEqual([{ line: 3, target: "comment" }]);
  });

  it("sees a fetch whose method rides in an options object", () => {
    const { findings } = scanFixture("fetch-method-option", "research-ask.ts");
    expect(rules(findings)).toEqual(["unknown-writer"]);
  });

  it("ignores comments, reads, and writes that touch neither comments nor labels", () => {
    const result = scanFixture("not-writes", "roadmap.ts");
    expect(result.findings).toEqual([]);
    expect(result.writes).toEqual([]);
  });
});

describe("server label guard: src/server as it stands", () => {
  const files = serverFiles(SERVER).map((path) => ({
    file: relative(SERVER, path),
    text: readFileSync(path, "utf8"),
  }));
  const results = files.map(({ file, text }) => ({ file, ...scan(file, text) }));

  it("writes no plan label, no plan-unchecked ready, no work-mode label, from no unlisted file", () => {
    const messages = results.flatMap((r) => r.findings.map((f) => f.message));
    expect(messages).toEqual([]);
  });

  it("every listed writer still writes, and the ones that promise a plan check make it", () => {
    for (const [file, entry] of Object.entries(KNOWN_WRITERS)) {
      const result = results.find((r) => r.file === file);
      expect({ file, writes: (result?.writes.length ?? 0) > 0 }).toEqual({ file, writes: true });
      if (entry.refusesPlans) {
        expect({ file, asksIsPlanIssue: result?.callsPlanGuard }).toEqual({
          file,
          asksIsPlanIssue: true,
        });
      }
    }
  });
});
