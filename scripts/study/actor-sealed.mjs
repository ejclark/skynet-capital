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
// The pure halves — the message, the argument list, the result parser — are specced
// (tests/scripts/study-drive.spec.ts) with fixtures. The process half refuses to start when the
// standalone CLI is signed out (`claude auth status`), with the one command that fixes it.

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** The exact flag set of a blind call (docs/members/study/README.md → Blind and aware roles). */
export function sealedArgs({ rolePath, schema }) {
  return [
    "-p",
    "--safe-mode",
    "--restricted",
    "--tools",
    "",
    "--strict-mcp-config",
    "--system-prompt-file",
    rolePath,
    "--json-schema",
    schema,
    "--input-format",
    "stream-json",
    "--output-format",
    "stream-json",
    "--verbose",
    "--no-session-persistence",
  ];
}

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

const image = (b64) => ({
  type: "image",
  source: { type: "base64", media_type: "image/jpeg", data: b64 },
});

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

/**
 * The structured answer from a call's stream-json stdout: the LAST `result` event's
 * `structured_output`. Throws with the reason when there is none — an error result, a result with
 * no structured output (the schema was not honoured), or no result at all (the call died).
 */
export function parseResult(stdout) {
  const events = String(stdout ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("{"))
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
  const result = events.findLast((e) => e.type === "result");
  if (!result) throw new Error("sealed call: no result event in the output");
  if (result.is_error || (result.subtype && result.subtype !== "success")) {
    throw new Error(
      `sealed call: ${result.subtype ?? "error"} — ${String(result.result ?? "").slice(0, 200)}`,
    );
  }
  if (!result.structured_output || typeof result.structured_output !== "object") {
    throw new Error("sealed call: the result carries no structured_output");
  }
  return result.structured_output;
}

/** Is the standalone CLI signed in? `{ok, why}` — never throws. */
export function signedIn(run = spawnSync) {
  const out = run("claude", ["auth", "status"], { encoding: "utf8" });
  if (out.error) return { ok: false, why: `claude CLI not runnable: ${out.error.message}` };
  try {
    const status = JSON.parse(out.stdout);
    if (status.loggedIn) return { ok: true, why: "signed in" };
  } catch {
    // fall through: unparseable status is not a sign-in
  }
  return {
    ok: false,
    why: "the standalone claude CLI is signed out — run `claude auth login`, then retry",
  };
}

/**
 * One sealed call from an empty temp dir; resolves to its structured output, rejects with the
 * reason. ASYNC on purpose: a synchronous spawn would freeze the event loop for the whole call —
 * and with it the page's route handlers, so in-page requests would queue and land as drift in the
 * next record.
 */
export async function sealedCall({ rolePath, schema, message, timeoutMs = 180_000 }) {
  const cwd = mkdtempSync(join(tmpdir(), "study-sealed-"));
  try {
    const stdout = await new Promise((done, fail) => {
      const child = spawn("claude", sealedArgs({ rolePath, schema }), {
        cwd,
        stdio: ["pipe", "pipe", "ignore"],
      });
      let out = "";
      child.stdout.setEncoding("utf8").on("data", (chunk) => {
        out += chunk;
      });
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        fail(new Error(`sealed call: timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      child.on("error", (e) => {
        clearTimeout(timer);
        fail(new Error(`sealed call: ${e.message}`));
      });
      child.on("close", () => {
        clearTimeout(timer);
        done(out);
      });
      child.stdin.end(`${JSON.stringify(message)}\n`);
    });
    return parseResult(stdout);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

/**
 * A JPEG at half its size, as base64 — drawn in a page of its OWN browser context, so the member's
 * page is never touched by the scaling.
 */
export async function halfFrame(browser, jpeg) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    return await page.evaluate(async (b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/jpeg" }));
      const canvas = new OffscreenCanvas(
        Math.round(bitmap.width / 2),
        Math.round(bitmap.height / 2),
      );
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.6 });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let i = 0; i < buf.length; i += 0x8000)
        s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, jpeg.toString("base64"));
  } finally {
    await context.close();
  }
}
