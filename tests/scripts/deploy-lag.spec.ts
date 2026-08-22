import { execFileSync } from "node:child_process";

// "Is `main` actually deployed?" — driven through the real entrypoint, the way every other script
// spec here works, so the argument plumbing is covered too and no `.d.ts` is invented for an
// `.mjs` module. `--explain` feeds the state in as JSON instead of reading GitHub, so this runs
// offline and cannot touch the repo.
//
// PROVENANCE (2026-08-22): the feedback lane built #475, opened PR #492, passed CI and auto-merged
// — and nothing deployed. Native auto-merge lands as the identity that ARMED it, the lane armed it
// with GITHUB_TOKEN, and a GITHUB_TOKEN push starts no workflow runs. `v1.190.0` still pointed at
// 8c65f65 while `main` stood at 4f234c0. No failed job, no red check, no alert anywhere.
// A stranded deploy exits 1 on purpose, so stdout has to be read off the thrown error too.
const run = (state: unknown, ...flags: string[]): string => {
  try {
    return execFileSync("node", ["scripts/deploy-lag.mjs", "--explain", ...flags], {
      input: JSON.stringify(state),
      encoding: "utf8",
    });
  } catch (error) {
    return (error as { stdout?: string }).stdout ?? "";
  }
};

const explain = (state: unknown): { text: string; verdict: Record<string, unknown> } => ({
  text: run(state),
  verdict: JSON.parse(run(state, "--json")),
});

const RELEASED = "8c65f650000000000000000000000000000000cc";
const HEAD = "4f234c00000000000000000000000000000000bb";

/** The two commits that really were stranded, with the identity that really merged them. */
const STRANDED = [
  {
    sha: "942a85a0000000000000000000000000000000aa",
    subject: "docs(research): close out treasury-20y-bond-2026-08-19 (#491)",
    mergedBy: "github-actions[bot]",
  },
  {
    sha: HEAD,
    subject: "feat(observatory): move mission control onto the account desk (#492)",
    mergedBy: "github-actions[bot]",
  },
];

describe("deploy lag", () => {
  it("says nothing is wrong when main is the released commit", () => {
    const { text, verdict } = explain({ head: RELEASED, released: RELEASED });

    expect(verdict.lagging).toBe(false);
    expect(verdict.behind).toBe(0);
    expect(text).toContain("deploy is current");
  });

  it("catches the outage: main ahead, every commit merged by a silent token", () => {
    const { text, verdict } = explain({ head: HEAD, released: RELEASED, stranded: STRANDED });

    expect(verdict.lagging).toBe(true);
    expect(verdict.behind).toBe(2);
    expect(verdict.cause).toBe("silent-merge");
    expect(text).toContain("2 commit(s) ahead");
    expect(text).toContain("the deploy never fired");
  });

  it("names each stranded commit and who merged it", () => {
    const { text } = explain({ head: HEAD, released: RELEASED, stranded: STRANDED });

    expect(text).toContain("mission control");
    expect(text).toContain("merged by github-actions[bot]");
  });

  // The familiar cause must not be assumed. A human-merged commit that never deployed means the
  // deploy job RAN AND FAILED — a different fault with a different fix — and a detector that
  // answers "silent merge" to both would send the next reader down the wrong path.
  it("refuses to blame the token when a human merged the stranded commit", () => {
    const { text, verdict } = explain({
      head: "deadbeef",
      released: RELEASED,
      stranded: [{ sha: "deadbeef", subject: "fix: something", mergedBy: "ejclark" }],
    });

    expect(verdict.cause).toBe("unknown");
    expect(text).toContain("deploy job failed");
  });

  it("treats a mixed set as unknown — one human merge rules the token out", () => {
    const { verdict } = explain({
      head: "abc1234",
      released: RELEASED,
      stranded: [...STRANDED, { sha: "abc1234", subject: "fix: x", mergedBy: "ejclark" }],
    });

    expect(verdict.cause).toBe("unknown");
  });

  it("cannot decide without both ends of the comparison", () => {
    expect(explain({ head: "abc" }).verdict.lagging).toBe(false);
    expect(explain({ released: "abc" }).verdict.lagging).toBe(false);
    expect(explain({}).verdict.lagging).toBe(false);
  });

  // Exit status is the interface a CI step or a shell check reads. A lagging deploy must be a
  // failure, not a cheerful line in a log nobody scrolls to.
  it("exits non-zero when the deploy is stranded, and zero when it is current", () => {
    expect(() =>
      execFileSync("node", ["scripts/deploy-lag.mjs", "--explain"], {
        input: JSON.stringify({ head: HEAD, released: RELEASED, stranded: STRANDED }),
        stdio: "pipe",
      }),
    ).toThrow();

    expect(() =>
      execFileSync("node", ["scripts/deploy-lag.mjs", "--explain"], {
        input: JSON.stringify({ head: RELEASED, released: RELEASED }),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
