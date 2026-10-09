// The SEALED simulated member (#4943): every turn is a fresh `claude -p` call that can see only
// what this file hands it — the member card, the device, the task scenario, its own earlier turns
// and two frames — and can answer only in the turn schema.
//
// WHY SEALED: a member that can read the repo, CLAUDE.md, memory or the URL is not blind; it can
// find what the study is looking for instead of struggling into it. `--safe-mode` drops CLAUDE.md,
// memory, plugins, hooks and MCP but keeps the sign-in; `--tools ""` leaves only the structured
// answer; `--strict-mcp-config` loads no MCP config; it runs from an EMPTY temp directory with
// `--no-session-persistence`, so there is no tree to read and nothing written back. Stream-json
// input carries the image blocks; it requires stream-json output, which `-p` requires `--verbose`
// for. The answer is the final `result` event's `structured_output`.
//
// This file builds the member's messages (specced, tests/scripts/study-drive.spec.ts); the call
// itself — flags, stub, result parser, sign-in check, half-scale frames — is sealed.mjs, the one
// door every blind role of a study answers through.

import { imageBlock as image } from "./sealed.mjs";

/** One earlier turn as the member reads it back: what it was doing, expected and did. */
export function turnLine(turn, i) {
  const a = turn.action ?? {};
  const did =
    a.type === "tap" || a.type === "hover"
      ? `${a.type} at (${a.x}, ${a.y})`
      : a.type === "scroll"
        ? `scroll ${a.dir} ${a.screens} screen`
        : a.type === "type"
          ? `type "${a.text}"`
          : a.type === "key"
            ? `press ${a.key}`
            : (a.type ?? "nothing");
  const refused = turn.refused ? ` — it could not be done: ${turn.refused}` : "";
  return `${i + 1}. ${turn.as_member} | expected: ${turn.expect} | did: ${did}${refused}`;
}

/** How many steps are left, said plainly — and the warning the role prompt promises near the end. */
export function stepsLine(remaining) {
  const base = `You have ${remaining} action${remaining === 1 ? "" : "s"} left.`;
  return remaining <= 3 ? `${base} You have used most of your steps.` : base;
}

/**
 * The stream-json user message for one turn. `prevFrame` (base64, already half scale) is omitted
 * on the first turn; `frame` is the current viewport JPEG, base64. Nothing else — no URL, no DOM.
 */
export function actorMessage({ card, device, scenario, turns, prevFrame, frame, size, remaining }) {
  const history =
    turns.length > 0 ? turns.map(turnLine).join("\n") : "(none yet — this is your first turn)";
  const pictures = prevFrame
    ? `The first image is the screen before your last action, at half size. The second is the screen now, ${size.width}×${size.height} pixels: tap coordinates are pixels of this second image.`
    : `The image is the screen now, ${size.width}×${size.height} pixels: tap coordinates are pixels of this image.`;
  const text = [
    "## Who you are",
    card.trim(),
    "## Your device",
    device,
    "## What you are trying to do",
    scenario.trim(),
    "## Your turns so far",
    history,
    "## Now",
    `${stepsLine(remaining)} ${pictures}`,
  ].join("\n\n");
  const content = [{ type: "text", text }];
  if (prevFrame) content.push(image(prevFrame));
  content.push(image(frame));
  return { type: "user", message: { role: "user", content } };
}

/** The after-task question, asked once with the member's own turns as its memory of the task. */
export function easeMessage({ card, device, scenario, turns }) {
  const text = [
    "## Who you are",
    card.trim(),
    "## Your device",
    device,
    "## What you were trying to do",
    scenario.trim(),
    "## What you did",
    turns.map(turnLine).join("\n") || "(nothing)",
    "## One question",
    "Overall, how easy or difficult was this task? Answer 1 (very difficult) to 7 (very easy). If 5 or lower, say why in one or two sentences.",
  ].join("\n\n");
  return { type: "user", message: { role: "user", content: [{ type: "text", text }] } };
}
