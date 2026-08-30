import { execFileSync } from "node:child_process";

// Split from envelope.spec.ts to stay under noExcessiveLinesPerFile — same reason
// envelope-behavior.spec.ts exists as its own module.
//
// THE SEAM, NARROWED ON #928 (2026-08-30, Eric: "the only controls for feedback is limited [to]
// the auth, llm model and effort level... if people desire to add/extend to the feedback process,
// I want to enable them"). Only the model dial is gated now — for both the coach and its mirror,
// the companion; round/token/throttle caps and the PROMPT/conversation files are open. Assert all
// three per lane, or the seam silently collapses into "the whole cluster is frozen" the next time
// someone tidies it.
const scan = (...args: string[]): string =>
  execFileSync("node", ["scripts/envelope-scan.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

type Check = {
  path: string;
  protected: boolean;
  blocking: boolean;
  why?: string;
};
const check = (...paths: string[]): Check[] => JSON.parse(scan("--check", ...paths)) as Check[];

describe("autonomous-lane envelope — coach/companion model-only gate (#928)", () => {
  it("gates only the coach's model dial, leaving its caps and prompt open to improvement", () => {
    const [model, limits, prompt] = check(
      "src/server/feedback-coach-model.ts",
      "src/server/feedback-coach-limits.ts",
      "src/server/feedback-coach.ts",
    );

    expect(model?.protected).toBe(true);
    expect(model?.why).toContain("bill");
    expect(limits?.protected).toBe(false);
    expect(prompt?.protected).toBe(false);
  });

  it("mirrors the same model-only gate on the companion", () => {
    const [model, limits, chat] = check(
      "src/companion/companion-model.ts",
      "src/companion/companion-limits.ts",
      "src/companion/companion-chat.ts",
    );

    expect(model?.protected).toBe(true);
    expect(limits?.protected).toBe(false);
    expect(chat?.protected).toBe(false);
  });
});
