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
  const out = execFileSync("node", ["scripts/postmaster.mjs", "--model-tier"], {
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
  it("sends a one-liner to Haiku — the cheap, fast pass", () => {
    const { model, reason } = tier("the leaderboard shows 0.00%");

    expect(model).toBe("claude-haiku-4-5-20251001");
    expect(reason).toContain("short/simple ask");
  });

  it("sends a long prose body to Sonnet — the shape that used to kill the step", () => {
    const { model, reason } = tier("a".repeat(1410));

    expect(model).toBe("claude-sonnet-5");
    expect(reason).toBe("detailed ask (1410 chars)");
  });

  it("sends a short body with a code block to Sonnet, and says so", () => {
    const { model, reason } = tier(`short\n${FENCE}js\nx\n${FENCE}\n`);

    expect(model).toBe("claude-sonnet-5");
    expect(reason).toContain("includes a code block");
  });

  it("never fails, whatever the body — the decision cannot take the lane down again", () => {
    for (const body of ["", " ", "a".repeat(601), FENCE, `${"b".repeat(700)}\n${FENCE}\n`]) {
      expect(() => tier(body)).not.toThrow();
    }
  });
});
