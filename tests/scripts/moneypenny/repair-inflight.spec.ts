import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { dryRunPayload } from "./repair-fixtures";

// #4374, measured 2026-10-01: guard 3's dedupe reads only OPEN capsules, so the window shuts the
// instant the fixing PR merges — while runs started on pre-fix commits keep finishing for minutes
// after. Run 36800376847 started 01:17:21Z on `ec0605b8`; #4361 merged and closed #4359 (identical
// signature) at 01:20:06Z; 49s later this lane filed #4374 as a brand-new fault and burned a full
// Opus repair session on a bug that no longer existed. The guard is purely temporal — a run that
// STARTED before the fix merged cannot have carried it — so it can never silence the net.
describe("moneypenny repair — a run already fixed while it was in flight", () => {
  const signature = "[ci] Moneypenny Events (event-research automation) — build plan issue";

  /** The #4374 shape: a failed run, plus a closed capsule for the same signature. */
  const inFlight = (
    runStartedAt: string,
    closedAt: string | undefined,
    title = signature,
    stateReason: string | undefined = "COMPLETED",
  ) => ({
    repository: { default_branch: "main" },
    workflow_run: {
      id: 36800376847,
      name: "Moneypenny Events (event-research automation)",
      conclusion: "failure",
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: "ec0605b8aa474d1eb59e2a686f9d734b37c9703a",
      run_started_at: runStartedAt,
      html_url: "https://github.com/ejclark/skynet-capital/actions/runs/36800376847",
    },
    failures: [{ job: "build plan issue", step: "Run anthropics/claude-code-action" }],
    deps: { openIssues: [], closedIssues: [{ number: 4359, title, closedAt, stateReason }] },
  });

  it("comments on the closed capsule instead of filing a fresh one", () => {
    const intents = dryRunPayload(inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z"));

    expect(intents).toHaveLength(1);
    expect(intents[0]?.type).toBe("comment");
    expect(intents[0]?.issue).toBe(4359);
  });

  it("dispatches no repair session — the whole cost this guard exists to avoid", () => {
    const intents = dryRunPayload(inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z"));

    expect(intents.some((i) => i.type === "open-issue")).toBe(false);
    expect(intents.every((i) => !("dispatch" in i))).toBe(true);
  });

  it("says why it stayed quiet, with both timestamps — silence is not an option", () => {
    const body = dryRunPayload(inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z"))[0]?.body;

    expect(body).toContain("Stale echo, not a recurrence");
    expect(body).toContain("2026-10-01T01:17:21Z");
    expect(body).toContain("2026-10-01T01:20:06Z");
    expect(body).toContain("ec0605b8");
  });

  // A run that started after the close carried the fix, so the fault outlived it: loud, and on the
  // same number since #6953 — the capsule reopens rather than a new one being filed.
  it("reopens the capsule when the fault outlives the fix — the run started AFTER the close", () => {
    const intents = dryRunPayload(inFlight("2026-10-01T01:25:00Z", "2026-10-01T01:20:06Z"));

    expect(intents[0]).toMatchObject({ type: "reopen-issue", issue: 4359, dispatch: true });
    expect(intents[0]?.title).toBe(signature);
  });

  it("files when the closed capsule is a different signature", () => {
    const intents = dryRunPayload(
      inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z", "[ci] Pipeline — release · deploy"),
    );

    expect(intents[0]?.type).toBe("open-issue");
    expect(intents[0]?.title).toBe(signature);
  });

  // Fail-safe direction: this guard may only suppress a report it can PROVE is stale. Where a
  // timestamp is missing or unparseable it must fall through to filing — a lane that goes quiet on
  // a malformed payload is worse than one that files twice.
  it("files when the run carries no start time to compare against", () => {
    const payload = inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z") as {
      workflow_run: { run_started_at?: string };
    };
    delete payload.workflow_run.run_started_at;

    expect(dryRunPayload(payload)[0]?.type).toBe("open-issue");
  });

  it("files when the closed capsule carries no close time", () => {
    expect(dryRunPayload(inFlight("2026-10-01T01:17:21Z", undefined))[0]?.type).toBe("open-issue");
  });

  it("files when a timestamp is present but unparseable", () => {
    expect(dryRunPayload(inFlight("2026-10-01T01:17:21Z", "not a date"))[0]?.type).toBe(
      "open-issue",
    );
  });

  // Guard 3 still wins: an OPEN capsule means the fault is live, whatever a closed twin says.
  it("prefers the open capsule's recurrence comment over the stale-echo path", () => {
    const payload = inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z");
    payload.deps.openIssues = [{ number: 4374, title: signature, labels: [] }] as never;

    const [intent] = dryRunPayload(payload);
    expect(intent?.issue).toBe(4374);
    expect(intent?.body).toContain("Failed again");
  });

  // #6579's third scenario. The audit tick closes a capsule once three runs pass, as "not planned",
  // with no fix anywhere (capsule-stall.mjs). It rides every push, so that close overlaps the push's
  // own Pipeline run — and if that run then fails, nothing about it predates a fix.
  it("reports a failure in a run that overlaps a proof close: no fix merged, so nothing is stale", () => {
    const intents = dryRunPayload(
      inFlight("2026-11-01T12:38:50Z", "2026-11-01T12:41:24Z", signature, "NOT_PLANNED"),
    );

    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({ type: "reopen-issue", title: signature, dispatch: true });
  });

  it("reports when the closed capsule does not say why it closed — it may only suppress on proof", () => {
    const payload = inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z");
    delete (payload.deps.closedIssues[0] as { stateReason?: string }).stateReason;

    expect(dryRunPayload(payload)[0]).toMatchObject({ type: "reopen-issue", dispatch: true });
  });

  // The whole guard hangs on `closedIssues()` asking gh for the reason: a stub that returns only the
  // fields it was asked for, as gh does, turns a dropped field into a filed capsule here.
  describe("through the live gather, against a gh that returns only the fields it is asked for", () => {
    const liveRun = (stateReason: string) => {
      const dir = mkdtempSync(join(tmpdir(), "repair-gh-"));
      try {
        const log = join(dir, "gh.log");
        const out = join(dir, "output");
        const closed = {
          number: 4359,
          title: signature,
          closedAt: "2026-11-01T12:41:24Z",
          stateReason,
          labels: [{ name: "ci-failure" }, { name: "stall-flagged" }],
          body: "| | |\n|---|---|\n| **Run** | [1](u) |",
        };
        writeFileSync(
          join(dir, "gh"),
          `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + "\\n");
if (args[0] === "issue" && args[1] === "list") {
  const fields = args[args.indexOf("--json") + 1].split(",");
  const rows = args[args.indexOf("--state") + 1] === "closed" ? [${JSON.stringify(closed)}] : [];
  console.log(JSON.stringify(rows.map((r) => Object.fromEntries(fields.map((f) => [f, r[f]])))));
} else if (args[0] === "issue" && args[1] === "create") {
  console.log("https://github.com/ejclark/skynet-capital/issues/9001");
} else {
  console.log("[]");
}
`,
          { mode: 0o755 },
        );
        const event = join(dir, "event.json");
        const { deps: _deps, ...payload } = inFlight(
          "2026-11-01T12:38:50Z",
          "2026-11-01T12:41:24Z",
          signature,
          stateReason,
        );
        writeFileSync(event, JSON.stringify(payload));
        execFileSync("node", ["scripts/moneypenny/repair.mjs", "--event", event], {
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${dir}${delimiter}${process.env.PATH}`,
            GITHUB_OUTPUT: out,
          },
        });
        const calls: string[][] = readFileSync(log, "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line));
        const dispatched = existsSync(out) ? readFileSync(out, "utf8") : "";
        return { calls, dispatched };
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    };
    const did = (calls: string[][], verb: string) =>
      calls.some(([cmd, sub]) => cmd === "issue" && sub === verb);

    it("reopens, counts and dispatches past a proof close — one number, not a new one", () => {
      const { calls, dispatched } = liveRun("NOT_PLANNED");
      expect(did(calls, "create")).toBe(false);
      expect(did(calls, "reopen")).toBe(true);
      const edit = calls.find(([cmd, sub]) => cmd === "issue" && sub === "edit");
      expect(edit?.at(-1)).toContain("| **Came back after a close** | 1 time |");
      expect(calls).toContainEqual([
        "api",
        "-X",
        "DELETE",
        "repos/{owner}/{repo}/issues/4359/labels/stall-flagged",
      ]);
      expect(dispatched).toContain("issue=4359");
    });

    it("still stays quiet past a close a merged fix made", () => {
      const { calls, dispatched } = liveRun("COMPLETED");
      expect(did(calls, "comment")).toBe(true);
      expect(did(calls, "create")).toBe(false);
      expect(dispatched).toBe("");
    });
  });
});
