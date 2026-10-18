import { execFileSync } from "node:child_process";

// "Archive this session?" should be a simple yes because the done-check ran, not because the
// session says it did (Eric, 2026-10-18). Driven through the real entrypoint with `--explain`, which
// takes every fact from the manifest, so this runs offline and touches neither GitHub nor git.
const run = (manifest: unknown, ...flags: string[]): { out: string; code: number } => {
  try {
    const out = execFileSync("node", ["scripts/archive-audit.mjs", "--explain", ...flags], {
      input: JSON.stringify(manifest),
      encoding: "utf8",
    });
    return { out, code: 0 };
  } catch (error) {
    const e = error as { stdout?: string; status?: number };
    return { out: e.stdout ?? "", code: e.status ?? -1 };
  }
};

const CLEAN = {
  prs: [{ number: 5629, state: "merged" }],
  children: [{ id: "session_a", status: "SESSION_STATUS_ARCHIVED" }],
  checkins: [],
  followups: [{ what: "#5159 lost predictions", home: "https://github.com/o/r/issues/5159" }],
  git: { uncommitted: false, unpushed: 0 },
};

describe("archive-audit — the done-check as a table", () => {
  it("says yes, exits 0 and shows every check green when everything is finished", () => {
    const { out, code } = run(CLEAN);
    expect(code).toBe(0);
    expect(out).toContain("ARCHIVE: yes — all 5 checks pass");
    expect(out).not.toContain("❌");
    expect(out).toContain("#5629 merged");
  });

  it.each([
    ["an open PR", { prs: [{ number: 7, state: "open" }] }, "#7 open"],
    [
      "a child still running",
      { children: [{ id: "session_b", status: "SESSION_STATUS_IDLE" }] },
      "still open: session_b",
    ],
    ["a pending check-in", { checkins: [{ id: "trig_1", enabled: true }] }, "pending: trig_1"],
    [
      "a follow-up with no home",
      { followups: [{ what: "ask Eric", home: "" }] },
      "no home: ask Eric",
    ],
    ["unpushed commits", { git: { uncommitted: false, unpushed: 2 } }, "2 unpushed commit(s)"],
  ])("says no and exits 1 on %s, naming it", (_what, patch, evidence) => {
    const { out, code } = run({ ...CLEAN, ...patch });
    expect(code).toBe(1);
    expect(out).toMatch(/ARCHIVE: no — 1 check\(s\) fail/);
    expect(out).toContain(evidence);
  });

  it("names the safe heal for a healable row, then re-run", () => {
    const { out } = run({ ...CLEAN, followups: [{ what: "ask Eric", home: "" }] });
    expect(out).toMatch(/HEAL: Every follow-up has a home.*issue comment.*then re-run/);
  });

  it("never offers a heal for an open PR — it waits instead", () => {
    const { out } = run({ ...CLEAN, prs: [{ number: 7, state: "open" }] });
    expect(out).toContain("WAIT: Every PR it opened is merged or closed");
    expect(out).not.toContain("HEAL:");
  });

  it("passes a check with nothing to check and says so, rather than skipping the row", () => {
    const { out, code } = run({ git: {} });
    expect(code).toBe(0);
    expect(out).toContain("opened none");
    expect(out).toContain("spawned none");
  });

  it("treats a fired one-shot check-in as done", () => {
    const { code } = run({ ...CLEAN, checkins: [{ id: "trig_2", enabled: true, fired: true }] });
    expect(code).toBe(0);
  });

  it("refuses a manifest that is not JSON with exit 2", () => {
    try {
      execFileSync("node", ["scripts/archive-audit.mjs", "--explain"], { input: "{nope" });
      throw new Error("should have exited non-zero");
    } catch (error) {
      expect((error as { status?: number }).status).toBe(2);
    }
  });
});
