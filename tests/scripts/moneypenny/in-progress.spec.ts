import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { issueNumberFromSlug } from "../../../scripts/moneypenny/labels.mjs";

// #3960 — THE ONE IN-FLIGHT SIGNAL. The board's "In Progress" column reads the `in-progress`
// label, so the claim lanes must put it on when a claim wins and the release path must take it
// off. The claim functions shell out to `gh` with no injection seam, so this drives the real
// module against a fake `gh` on PATH that records every call and answers only what the lease
// needs: no lease yet (404), a tag object on stamp, success on everything else. No network.
// Since #3960 the claims ask the admission gate first, so the fake also answers the work-mode dial
// (`work-mode:$WORK_MODE` on #4153, normal by default), an empty in-flight list, and no comments.

let dir: string;
let log: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "in-progress-"));
  log = join(dir, "gh.log");
  const fake = join(dir, "gh");
  writeFileSync(
    fake,
    [
      "#!/bin/sh",
      `printf '%s\\n' "$*" >> "${log}"`,
      'case "$*" in',
      "  *git/ref/tags/*) exit 1 ;;",
      `  *git/tags*) echo '{"sha":"stamp"}' ;;`,
      `  *"issue view 4153 "*) echo "{\\"labels\\":[{\\"name\\":\\"work-mode:\${WORK_MODE:-normal}\\"}],\\"comments\\":[]}" ;;`,
      "  *labels=in-progress*) echo '[]' ;;",
      `  *"--json comments"*) echo '{"comments":[]}' ;;`,
      "  *) echo '{}' ;;",
      "esac",
      "",
    ].join("\n"),
  );
  chmodSync(fake, 0o755);
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const env = (extra: Record<string, string> = {}) => ({
  ...process.env,
  PATH: `${dir}:${process.env.PATH}`,
  GITHUB_OUTPUT: "",
  ...extra,
});
const calls = () => readFileSync(log, "utf8").trim().split("\n");

/** Run one export of the real router module under the fake `gh`. */
const run = (expr: string, extra: Record<string, string> = {}) =>
  execFileSync(
    "node",
    ["-e", `import("./scripts/moneypenny/index.mjs").then((m) => { ${expr} })`],
    { cwd: process.cwd(), encoding: "utf8", env: env(extra) },
  );

describe("in-progress: the claim lanes put it on", () => {
  it("labels a feedback issue the moment its claim wins", () => {
    run(
      `m.claimFeedback({ payload: { issue: { number: 4242, body: "", labels: [{ name: "feedback" }, { name: "ready" }] } } }, 0, "abc");`,
    );
    expect(calls()).toContain("issue edit 4242 --add-label in-progress");
  });

  it("never labels an issue whose claim was refused — nothing is being built", () => {
    writeFileSync(log, "");
    run(
      `m.claimFeedback({ payload: { issue: { number: 4243, body: "", labels: [{ name: "feedback" }, { name: "ready" }, { name: "needs-eric" }] } } }, 0, "abc");`,
    );
    expect(calls().some((c) => c.includes("in-progress"))).toBe(false);
  });
});

// #3960 — a refused admission must leave NO trace of a build: no lease, no `in-progress`. Only the
// one queue note, so the thread says why nothing started.
describe("in-progress: a refused admission takes no lease and adds no label", () => {
  it.each([
    [
      "feedback",
      `m.claimFeedback({ payload: { issue: { number: 4245, body: "", labels: [{ name: "feedback" }, { name: "ready" }] } } }, 0, "abc");`,
    ],
    [
      "plan (the ready-label path)",
      `m.claimPlan({ payload: { action: "labeled", label: { name: "ready" }, issue: { number: 4245, state: "open", body: "", labels: [{ name: "plan" }, { name: "ready" }] } } }, 0, "abc");`,
    ],
  ])("%s under work-mode:halt", (_, expr) => {
    const out = run(`const r = ${expr.replace(/;$/, "")}; console.log(JSON.stringify(r));`, {
      WORK_MODE: "halt",
    });
    expect(out).toContain('"claimed":false');
    expect(out).toContain("work-mode is halt");
    const seen = calls();
    expect(seen.some((c) => c.includes("git/refs") || c.includes("git/tags"))).toBe(false);
    expect(seen.some((c) => c.includes("in-progress") && c.startsWith("issue edit"))).toBe(false);
    expect(seen.filter((c) => c.startsWith("issue comment 4245"))).toHaveLength(1);
  });
});

describe("in-progress: the release path takes it off", () => {
  it("--release <slug> frees the lease and removes the label from the issue it names", () => {
    execFileSync("node", ["scripts/moneypenny/index.mjs", "--release", "plan-4244"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: env(),
    });
    const seen = calls();
    expect(seen.some((c) => c.includes("DELETE") && c.includes("claim/plan-4244"))).toBe(true);
    expect(seen).toContain("issue edit 4244 --remove-label in-progress");
  });
});

describe("issueNumberFromSlug", () => {
  it("reads the issue number out of a lane's lease slug", () => {
    expect(issueNumberFromSlug("feedback-1234")).toBe(1234);
    expect(issueNumberFromSlug("plan-77")).toBe(77);
  });

  it("is null for anything that is not a feedback/plan lease", () => {
    expect(issueNumberFromSlug("handoff-login")).toBeNull();
    expect(issueNumberFromSlug("feedback-")).toBeNull();
    expect(issueNumberFromSlug(undefined)).toBeNull();
  });
});
