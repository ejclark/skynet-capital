import { execFileSync } from "node:child_process";

// The feedback lane's model-tier decision, run exactly as production runs it.
//
// WHY THIS SPEC EXISTS: the heuristic lived in postmaster.yml as bash until 2026-08-22, where
// `REASON="…$(printf '%s' "$BODY" | grep -q '```' && echo ", includes a code block")"` exited 1
// under `set -euo pipefail` whenever the `&&` short-circuited. Every feedback issue over 600 chars
// with no code fence therefore killed its own build step — after the claim lease was taken, so the
// issue looked claimed and silently built nothing (run 32545818804, issue #475, 1,410 chars).
// The middle case below is that exact body shape.
const FENCE = "`".repeat(3);

const tier = (body: string): Record<string, string> => {
  const out = execFileSync("node", ["scripts/moneypenny.mjs", "--model-tier"], {
    input: body,
    encoding: "utf8",
  });
  return Object.fromEntries(
    out
      .trim()
      .split("\n")
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
};

describe("feedback model tier", () => {
  // THE HEURISTIC IS RETIRED, AND THAT IS THE ASSERTION (2026-08-22). It sent short asks to Haiku
  // and long ones to Sonnet — economizing on a lane billed to a FLAT-RATE subscription, where
  // economizing saves nothing and costs build quality on exactly the detailed asks that deserve the
  // most. Cheap belongs on the METERED side (src/server/feedback-coach-limits.ts), not here.
  it("gives every ask the strong model — this lane is flat-rate, so thrift buys nothing", () => {
    for (const body of [
      "the leaderboard shows 0.00%",
      "a".repeat(1410),
      `x\n${FENCE}js\n1\n${FENCE}`,
    ]) {
      expect(tier(body).model).toBe("claude-opus-5");
    }
  });

  it("never downgrades to a cheap model, whatever the body", () => {
    for (const body of ["", "a", "b".repeat(5000)]) {
      expect(tier(body).model).not.toContain("haiku");
      expect(tier(body).model).not.toContain("sonnet");
    }
  });

  it("still reports the body shape it saw, for the run log", () => {
    expect(tier("a".repeat(1410)).reason).toBe("member ask (1410 chars)");
    expect(tier(`short\n${FENCE}js\nx\n${FENCE}\n`).reason).toContain("includes a code block");
  });

  // The regression test for the incident that created this function: the decision lived in bash and
  // exited 1 under `set -euo pipefail` on a body over 600 chars with no code fence.
  it("never fails, whatever the body — the decision cannot take the lane down again", () => {
    for (const body of ["", " ", "a".repeat(601), FENCE, `${"b".repeat(700)}\n${FENCE}\n`]) {
      expect(() => tier(body)).not.toThrow();
    }
  });
});
