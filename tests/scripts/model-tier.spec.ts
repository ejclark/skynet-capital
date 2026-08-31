import { execFileSync } from "node:child_process";

// The feedback lane's model-tier decision, run exactly as production runs it.
//
// WHY THIS SPEC EXISTS: the heuristic lived in moneypenny-events.yml (then postmaster.yml) as bash until 2026-08-22, where
// `REASON="…$(printf '%s' "$BODY" | grep -q '```' && echo ", includes a code block")"` exited 1
// under `set -euo pipefail` whenever the `&&` short-circuited. Every feedback issue over 600 chars
// with no code fence therefore killed its own build step — after the claim lease was taken, so the
// issue looked claimed and silently built nothing (run 32545818804, issue #475, 1,410 chars).
// The "never throws" tests at the bottom are the regression test for that incident, and hold
// regardless of how the tiering logic above them changes.
const FENCE = "`".repeat(3);

const specBlock = (spec: Record<string, unknown>) =>
  `\n${FENCE}skynet-spec\n${JSON.stringify(spec)}\n${FENCE}\n`;

const tier = (body: string): Record<string, string> => {
  const out = execFileSync("node", ["scripts/moneypenny/index.mjs", "--model-tier"], {
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
  // 2026-08-31: Sonnet is the default; Opus is the conservative escalation, decided from the
  // issue's own skynet-spec block (readiness + criteria count), never from body text or length —
  // that text-length guessing is exactly what the pre-2026-08-22 heuristic got wrong.
  it("defaults to Sonnet for a well-scoped, spec-complete ask (at or under the simple-ask floor)", () => {
    for (const criteria of [["one thing"], ["a", "b"], ["a", "b", "c"]]) {
      const body = specBlock({ rounds: 0, criteria, assumptions: [], readiness: "spec-complete" });
      expect(tier(body).model).toBe("claude-sonnet-5");
    }
  });

  it("escalates to Opus once criteria count exceeds the simple-ask floor", () => {
    const body = specBlock({
      rounds: 0,
      criteria: ["a", "b", "c", "d"],
      assumptions: [],
      readiness: "spec-complete",
    });
    expect(tier(body).model).toBe("claude-opus-5");
  });

  it("escalates to Opus when readiness is not spec-complete", () => {
    for (const readiness of ["partial", "draft", undefined]) {
      const body = specBlock({ rounds: 0, criteria: ["a"], assumptions: [], readiness });
      expect(tier(body).model).toBe("claude-opus-5");
    }
  });

  it("escalates to Opus when spec-complete but criteria is empty or missing", () => {
    expect(tier(specBlock({ readiness: "spec-complete", criteria: [] })).model).toBe(
      "claude-opus-5",
    );
    expect(tier(specBlock({ readiness: "spec-complete" })).model).toBe("claude-opus-5");
  });

  it("escalates to Opus when there is no skynet-spec block at all (a plan issue, or a bare paste)", () => {
    for (const body of ["", "a plain member paste with no spec block", "x".repeat(1410)]) {
      expect(tier(body).model).toBe("claude-opus-5");
    }
  });

  it("escalates to Opus on a malformed spec block rather than guessing", () => {
    const malformed = `\n${FENCE}skynet-spec\n{not valid json\n${FENCE}\n`;
    expect(tier(malformed).model).toBe("claude-opus-5");
  });

  it("still reports which structural signal drove the decision, for the run log", () => {
    const simple = specBlock({ readiness: "spec-complete", criteria: ["a", "b", "c"] });
    expect(tier(simple).reason).toContain("3 criteria");
    const partial = specBlock({ readiness: "partial", criteria: ["a"] });
    expect(tier(partial).reason).toContain("partial");
  });

  // The regression test for the incident that created this function: the decision lived in bash and
  // exited 1 under `set -euo pipefail` on a body over 600 chars with no code fence. Holds regardless
  // of how the tiering logic above changes — the decision must never be able to take the lane down.
  it("never fails, whatever the body — the decision cannot take the lane down again", () => {
    for (const body of [
      "",
      " ",
      "a".repeat(601),
      FENCE,
      `${"b".repeat(700)}\n${FENCE}\n`,
      `${FENCE}skynet-spec\n${FENCE}`,
      `${FENCE}skynet-spec\nnull\n${FENCE}`,
      `${FENCE}skynet-spec\n[1,2,3]\n${FENCE}`,
    ]) {
      expect(() => tier(body)).not.toThrow();
    }
  });
});
