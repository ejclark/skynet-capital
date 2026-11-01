import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkBody,
  commandOf,
  dueChecks,
  markerOf,
  trackerOf,
  UNMOVED_MARKER,
  unmovedChecks,
  unmovedIssue,
} from "../../scripts/loop-check.mjs";
import { parseLoopList } from "../../scripts/loop-list-decide.mjs";

// The learning-loop registry checks itself (2026-10-18 loop census): a due row posts once per date.
const row = (
  loop: string,
  nextCheck: string | null,
  question = "Is it so?",
  state = "running",
) => ({
  loop,
  issue: "#1",
  state,
  nextCheck,
  question,
  nextCheckText: `${nextCheck} — wrong if it is not`,
});

describe("loop-check — the registry's due checks run themselves", () => {
  it("names the command a question carries, or none for a check done by hand", () => {
    expect(commandOf("Pass rates? `npm run research:scorecard`")).toBe("research:scorecard");
    expect(commandOf("Is ownership the limit?")).toBeNull();
  });

  // 2026-10-31 loop census: five proposed rows named `npm run meter`, which did not exist, and the
  // live row naming bare `npm run delivery:score` hit its usage error — either way the posted check
  // reads "did not finish". A row may only name a command package.json actually has.
  it("every command the live registry names is an npm script", () => {
    const md = readFileSync(
      new URL("../../docs/process/LEARNING-LOOP.md", import.meta.url),
      "utf8",
    );
    const scripts = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    ).scripts;
    const named = (parseLoopList(md) ?? [])
      .map((r) => commandOf(r.question))
      .filter((c): c is string => c !== null);
    expect(named.length).toBeGreaterThanOrEqual(4);
    expect(named.filter((c) => !scripts[c])).toEqual([]);
  });

  // Two #4056 rows name `npm run delivery:score`, and a bare run is 357 REST calls over about four
  // minutes (measured 2026-11-01). On a tick where both are due the command runs once. Driven
  // through a stub `npm` on PATH, since the spawn is the thing being counted.
  it("runs a command named by two due rows once per tick", () => {
    const dir = mkdtempSync(join(tmpdir(), "loop-check-"));
    try {
      writeFileSync(
        join(dir, "npm"),
        `#!/usr/bin/env bash\necho "$*" >> "${join(dir, "calls")}"\necho "scored"\n`,
        { mode: 0o755 },
      );
      writeFileSync(join(dir, "calls"), "");
      writeFileSync(
        join(dir, "LEARNING-LOOP.md"),
        [
          "## Loops running now",
          "",
          "| Loop | The question | Owning issue | State | Next check |",
          "|---|---|---|---|---|",
          "| A | Flagged worse? `npm run delivery:score` | #1 | running | 2020-01-01 — wrong if |",
          "| B | Format predicts? `npm run delivery:score` | #1 | running | 2020-01-01 — wrong if |",
          "",
        ].join("\n"),
      );
      const out = execFileSync(
        "node",
        ["scripts/loop-check.mjs", "--registry", join(dir, "LEARNING-LOOP.md")],
        {
          encoding: "utf8",
          stdio: "pipe",
          env: {
            ...process.env,
            PATH: `${dir}:${process.env.PATH}`,
            GH_TOKEN: "",
            GITHUB_TOKEN: "",
          },
        },
      );
      expect(out).toContain("loop-check: 2 due check(s) listed.");
      expect(out.match(/scored/g)).toHaveLength(2);
      expect(readFileSync(join(dir, "calls"), "utf8").trim().split("\n")).toEqual([
        "run -s delivery:score",
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reads the tracker issue from the registry's own text", () => {
    expect(trackerOf("…**Check results post to:** #5724")).toBe(5724);
    expect(trackerOf("no line")).toBeNull();
  });

  it("lists running rows whose date has come, minus ones already posted for that date", () => {
    const rows = [
      row("Scorecard", "2026-10-10", "`npm run research:scorecard`"),
      row("By hand", "2026-10-15"),
      row("Later", "2026-11-01"),
      row("Ended", "2026-10-01", "x", "killed"),
    ];
    const posted = [`old comment ${markerOf("By hand", "2026-10-15")}`];
    const due = dueChecks({ today: "2026-10-18", rows, posted });
    expect(due.map((d) => [d.loop, d.command])).toEqual([["Scorecard", "research:scorecard"]]);
  });

  it("posts again when the owner moves the date — a new date is a new check", () => {
    const posted = [markerOf("By hand", "2026-10-15")];
    expect(
      dueChecks({ today: "2026-10-25", rows: [row("By hand", "2026-10-22")], posted }),
    ).toHaveLength(1);
  });

  it("puts the command's output beside the falsifier it is judged against, and carries the marker", () => {
    const [check] = dueChecks({
      today: "2026-10-18",
      rows: [row("Scorecard", "2026-10-10", "`npm run research:scorecard`")],
    });
    if (!check) throw new Error("expected a due check");
    const body = checkBody(check, { ok: true, output: "high 69% · medium 72%" });
    expect(body).toContain("**Judged against:** 2026-10-10 — wrong if it is not");
    expect(body).toContain("high 69% · medium 72%");
    expect(body).toContain(check.marker);
    expect(checkBody(check, { ok: false, output: "timed out after 90s" })).toContain(
      "Run it by hand",
    );
  });
});

// #5724 retro: the checks posted to a standing log nobody read, and five sat 4–16 days unmoved. WHEN a
// posted check's row still carries the same date UNMOVED_DAYS later, the push tick SHALL route it
// to one small `feedback` issue — never `needs-eric`.
describe("loop-check — the decide step: a posted check nobody moved becomes one issue", () => {
  const posted = (loop: string, date: string, createdAt: string) => ({
    body: `**Loop check — ${loop}** ${markerOf(loop, date)}`,
    createdAt,
    url: `https://example.test/${loop}`,
  });
  // The registry as it stood on 2026-10-26 for the five rows #5724 had posted (the first live test).
  const rows = [
    row("Did the fix hold?", "2026-10-21", "`npm run lessons:held`"),
    row("Bottleneck before/after", "2026-10-21", "`npm run bottleneck:baseline`"),
    row("Lane work leaves Needs-you", "2026-10-15"),
    row("Issue-centric orchestration", "2026-10-10"),
    row("steering-touch-points", "2026-10-17"),
    row("Research scorecard", "2026-10-31"),
  ];
  const comments = [
    posted("Lane work leaves Needs-you", "2026-10-15", "2026-10-18T17:55:00Z"),
    posted("Issue-centric orchestration", "2026-10-10", "2026-10-18T17:55:00Z"),
    posted("steering-touch-points", "2026-10-17", "2026-10-18T17:55:00Z"),
    posted("Did the fix hold?", "2026-10-21", "2026-10-22T16:47:00Z"),
    posted("Bottleneck before/after", "2026-10-21", "2026-10-22T16:47:00Z"),
  ];

  it("lists every posted check whose row has not moved for three days", () => {
    const unmoved = unmovedChecks({ today: "2026-10-26", rows, comments });
    expect(unmoved.map((u) => [u.loop, u.waited])).toEqual([
      ["Did the fix hold?", 4],
      ["Bottleneck before/after", 4],
      ["Lane work leaves Needs-you", 8],
      ["Issue-centric orchestration", 8],
      ["steering-touch-points", 8],
    ]);
  });

  it("waits out the grace days, and lets go of a row once its date moves", () => {
    expect(unmovedChecks({ today: "2026-10-24", rows, comments })).toHaveLength(3);
    const moved = rows.map((r) => (r.loop === "Did the fix hold?" ? row(r.loop, "2026-11-21") : r));
    expect(
      unmovedChecks({ today: "2026-10-26", rows: moved, comments }).map((u) => u.loop),
    ).not.toContain("Did the fix hold?");
  });

  it("never lists a check that was never posted — posting is the tracker's job", () => {
    expect(unmovedChecks({ today: "2026-10-26", rows, comments: [] })).toEqual([]);
  });

  const issue = unmovedIssue({
    checks: unmovedChecks({ today: "2026-10-26", rows, comments }),
    tracker: 5724,
  });

  it("files feedback under the small-ask rule, never needs-eric, found again by its marker", () => {
    expect(issue.labels).toEqual(["feedback", "ready"]);
    expect(issue.labels).not.toContain("needs-eric");
    expect(issue.body.startsWith(UNMOVED_MARKER)).toBe(true);
    expect(issue.title).toBe("Settle 5 learning-loop checks that posted and then sat unmoved");
    expect(issue.body).toContain("| steering-touch-points | 2026-10-17 |");
    expect(issue.body).toContain("SHALL NOT end that loop");
  });

  it("passes the capsule lint every Claude-authored issue body must pass", () => {
    const args = ["scripts/issue-lint.mjs", "--stdin", "--json", "--title", issue.title];
    const out = execFileSync("node", [...args, "--labels", issue.labels.join(",")], {
      input: issue.body,
      encoding: "utf8",
    });
    expect(JSON.parse(out).problems).toEqual([]);
  });
});
