/**
 * Duel-log hook — the raw material of the tournament→eval flywheel (docs/GAMEBOARD-PLAN.md §eval seed).
 * Wired in .claude/settings.json on three seams:
 *   fanout  (PreToolUse on Task/Agent)   — each spawned agent's brief: the "position" it was assigned
 *   fanin   (PostToolUse on Task/Agent)  — each position as it returns, before reconciliation
 *   intent  (UserPromptSubmit)           — Eric's own words, the ground truth of intent; corrections
 *                                          against what was just produced are the gold for mined evals
 * Appends one compact JSONL event per firing to data/duel-log.jsonl. A mining pass later distills the
 * distribution (winner/loser discriminators, correction deltas) into candidate eval scenarios.
 * MUST never fail or block the session: swallow everything, always exit 0.
 */
import { appendFileSync, mkdirSync } from "node:fs";

const kind = process.argv[2] ?? "unknown";
const clip = (s, n) => (typeof s === "string" && s.length > n ? `${s.slice(0, n)}…` : s);

try {
  const raw = await new Promise((resolve) => {
    let buf = "";
    process.stdin.on("data", (d) => {
      buf += d;
    });
    process.stdin.on("end", () => resolve(buf));
    process.stdin.on("error", () => resolve(buf));
    setTimeout(() => resolve(buf), 3000).unref?.();
  });
  const input = raw ? JSON.parse(raw) : {};
  const event = { at: new Date().toISOString(), kind, session: input.session_id };
  if (kind === "fanout") {
    event.agent = clip(input.tool_input?.description, 120);
    event.model = input.tool_input?.model;
    event.brief = clip(input.tool_input?.prompt, 600);
  } else if (kind === "fanin") {
    const res = input.tool_response;
    event.agent = clip(input.tool_input?.description, 120);
    event.result = clip(typeof res === "string" ? res : JSON.stringify(res), 800);
  } else if (kind === "intent") {
    event.prompt = clip(input.prompt, 1000);
  }
  mkdirSync("data", { recursive: true });
  appendFileSync("data/duel-log.jsonl", `${JSON.stringify(event)}\n`);
} catch {
  // Logging must never break the loop it observes.
}
process.exit(0);
