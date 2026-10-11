// THE SEALED CALL (#4943) — every blind role of a member study (the member, the framer, the task
// author, the analysts, the experts, the words pass, the member-type audit, the canary) answers
// through this one door: a fresh `claude -p` that can see only the role prompt and the message
// handed to it, and can answer only in the role's JSON schema.
//
// WHY SEALED: a role that can read the repo, CLAUDE.md, memory or the URL is not blind; it can find
// what the study is looking for instead of struggling into it. `--safe-mode` drops CLAUDE.md,
// memory, plugins, hooks and MCP but keeps the sign-in; `--tools ""` leaves only the structured
// answer; `--strict-mcp-config` loads no MCP config; it runs from an EMPTY temp directory with
// `--no-session-persistence`, so there is no tree to read and nothing written back. Stream-json
// input carries the image blocks; it requires stream-json output, which `-p` requires `--verbose`
// for. The answer is the final `result` event's `structured_output`.
//
// THE STUB: `makeCaller({stub: <dir>})` answers each call from `<dir>/<role>/<n>.json`, in order,
// per role (n counts from 1 in this process). When `<n>.json` is missing, the highest-numbered file
// below n answers again — so a stub can say "every later expert batch answers like this" in one
// file. A stub answer is checked against the role's schema, as the CLI would enforce it. Real or
// stubbed, every call's request (images as sha256 + size, never the bytes) and answer are recorded,
// so a dry run shows exactly what a real one would have sent.
//
// The pure halves are specced (tests/scripts/study-sealed.spec.ts, study-drive.spec.ts).

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { schemaProblems } from "./schema-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
/** The role prompts, in the checkout this file belongs to. */
export const ROLES = resolve(HERE, "../../docs/members/study/roles");
/**
 * A role's JSON schema, as the one-line string `--json-schema` takes. A top-level `$schema` is
 * dropped: the CLI's validator rejects the 2020-12 draft URI ("no schema with key or ref"), exits at
 * once and prints only to stderr — the first real thin slice on 2026-10-09 died on it in 0.6s.
 */
export function readSchema(name) {
  const { $schema: _draft, ...schema } = JSON.parse(
    readFileSync(join(HERE, "schemas", `${name}.json`), "utf8"),
  );
  return JSON.stringify(schema);
}

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

/** One base64 JPEG as a content block. */
export const imageBlock = (b64) => ({
  type: "image",
  source: { type: "base64", media_type: "image/jpeg", data: b64 },
});

/**
 * A stream-json user message: the text, then each image preceded by its own one-line label (so a
 * role can cite a frame by the label it was shown). `images`: `[{label, b64}]`.
 */
export function userMessage(text, images = []) {
  const content = [{ type: "text", text }];
  for (const img of images) {
    if (img.label) content.push({ type: "text", text: img.label });
    content.push(imageBlock(img.b64));
  }
  return { type: "user", message: { role: "user", content } };
}

/** The last `result` event in a call's stream-json stdout, or null. */
function resultEvent(stdout) {
  return (
    String(stdout ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("{"))
      .flatMap((l) => {
        try {
          return [JSON.parse(l)];
        } catch {
          return [];
        }
      })
      .findLast((e) => e.type === "result") ?? null
  );
}

/**
 * The structured answer from a call's stream-json stdout: the LAST `result` event's
 * `structured_output`. Throws with the reason when there is none — an error result, a result with
 * no structured output (the schema was not honoured), or no result at all (the call died — then
 * the CLI's own stderr tail, when given, is the reason).
 */
export function parseResult(stdout, stderr = "") {
  const result = resultEvent(stdout);
  if (!result) {
    const why = String(stderr ?? "")
      .trim()
      .split("\n")
      .filter(Boolean)
      .at(-1);
    throw new Error(`sealed call: no result event in the output${why ? ` — ${why}` : ""}`);
  }
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

/**
 * What a call cost, from the same final `result` event: tokens by kind, the CLI's own dollar
 * figure (on a subscription sign-in that is its API-price estimate, not a bill), wall and API
 * time, and the models that answered. Null when the output has no result event. Recorded on every
 * call so a round's cost is read back, never estimated (#5099; the first round never kept it).
 */
export function resultUsage(stdout) {
  const result = resultEvent(stdout);
  if (!result) return null;
  const u = result.usage ?? {};
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    input_tokens: num(u.input_tokens),
    output_tokens: num(u.output_tokens),
    cache_creation_input_tokens: num(u.cache_creation_input_tokens),
    cache_read_input_tokens: num(u.cache_read_input_tokens),
    cost_usd: num(result.total_cost_usd),
    duration_ms: num(result.duration_ms),
    duration_api_ms: num(result.duration_api_ms),
    models: Object.keys(result.modelUsage ?? {}),
  };
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
 * One sealed call from an empty temp dir; resolves to `{answer, usage}` — its structured output and
 * what it cost (`resultUsage`) — or rejects with the reason. ASYNC on purpose: a synchronous spawn would freeze the event loop for the whole call —
 * and with it a member's page route handlers, so in-page requests would queue and land as drift.
 */
export async function sealedCall({ rolePath, schema, message, timeoutMs = 180_000 }) {
  const cwd = mkdtempSync(join(tmpdir(), "study-sealed-"));
  let err = "";
  try {
    const stdout = await new Promise((done, fail) => {
      const child = spawn("claude", sealedArgs({ rolePath, schema }), {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      });
      let out = "";
      child.stdout.setEncoding("utf8").on("data", (chunk) => {
        out += chunk;
      });
      // The CLI reports a bad flag or schema ONLY on stderr; keep its tail so the failure says why.
      child.stderr.setEncoding("utf8").on("data", (chunk) => {
        err = `${err}${chunk}`.slice(-800);
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
      // A CLI that exits before reading (bad flags, signed out) breaks the pipe mid-write; with no
      // listener that EPIPE is an uncaught exception that kills the whole round, unlogged.
      child.stdin.on("error", (e) => {
        clearTimeout(timer);
        child.kill("SIGKILL");
        fail(new Error(`sealed call: the CLI stopped reading its message — ${e.message}`));
      });
      child.stdin.end(`${JSON.stringify(message)}\n`);
    });
    return { answer: parseResult(stdout, err), usage: resultUsage(stdout) };
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

/**
 * Which stub file answers call `n` of a role, given the numbers present: `n` itself, else the
 * highest below it (repeat), else none. `{n, repeated}` or null.
 * @param {number[]} present
 * @param {number} n
 */
export function stubPick(present, n) {
  if (present.includes(n)) return { n, repeated: false };
  const below = present.filter((p) => p < n);
  return below.length > 0 ? { n: Math.max(...below), repeated: true } : null;
}

/** A message as recorded: every image's bytes replaced by their sha256 and size. */
export function redactImages(message) {
  const content = message.message.content.map((b) => {
    if (b.type !== "image") return b;
    const bytes = Buffer.from(b.source.data, "base64");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    return { type: "image", sha256, bytes: bytes.length };
  });
  return { ...message, message: { ...message.message, content } };
}

/**
 * A caller: `call({role, rolePath, schema, message, timeoutMs?, n?})` → the structured answer. Real
 * (the sealed CLI) unless `stub` names a directory. Each call is recorded as
 * `<record>/<role>-<nnn>.json` when `record` is set — with its `usage` when the CLI answered — and
 * a recorded answer to the identical message is replayed instead of asked again (a resumed round
 * pays only for what it has not got).
 *
 * `n` numbers the call explicitly. Calls made in parallel finish in any order, so a counter would
 * hand a batch another batch's number on the next run, and the replay (and the stub, which answers
 * by number) would miss. A step that runs a role's calls at once numbers every one of them;
 * otherwise the caller counts per role.
 */
export function makeCaller({ stub, record } = {}) {
  const counts = new Map();
  return async function call({ role, rolePath, schema, message, timeoutMs, n: fixed }) {
    const n = fixed ?? (counts.get(role) ?? 0) + 1;
    if (fixed === undefined) counts.set(role, n);
    const entry = { role, n, rolePath, args: sealedArgs({ rolePath, schema: "<schema>" }) };
    entry.message = redactImages(message);
    const file = record ? join(record, `${role}-${String(n).padStart(3, "0")}.json`) : null;
    const save = (extra) => {
      if (!file) return;
      mkdirSync(record, { recursive: true });
      writeFileSync(file, `${JSON.stringify({ ...entry, ...extra }, null, 1)}\n`);
    };
    // A resumed round replays an answer it already paid for: same role, same call number, the very
    // same message (images compared by hash). The first full round's controls lost nothing but their
    // last call to a timeout, and re-asking 35 expert batches would have cost ~95 minutes each.
    const prior = file && existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
    if (prior?.answer && JSON.stringify(prior.message) === JSON.stringify(entry.message)) {
      save({ ...prior, replayed: true });
      return prior.answer;
    }
    try {
      const answer = stub
        ? stubAnswer(stub, role, n, schema)
        : await sealedCall({ rolePath, schema, message, timeoutMs });
      save({
        stub: answer.from ?? null,
        repeated: answer.repeated ?? false,
        usage: answer.usage ?? null,
        answer: answer.answer,
      });
      return answer.answer;
    } catch (e) {
      save({ error: e.message });
      throw e;
    }
  };
}

/** A stub's answer for call n of a role, checked against the role's schema. */
function stubAnswer(dir, role, n, schema) {
  const roleDir = join(dir, role);
  const present = existsSync(roleDir)
    ? readdirSync(roleDir)
        .map((f) => /^(\d+)\.json$/.exec(f)?.[1])
        .filter(Boolean)
        .map(Number)
    : [];
  const pick = stubPick(present, n);
  if (!pick) throw new Error(`stub: no ${role}/${n}.json (nor any earlier) in ${dir}`);
  const from = join(roleDir, `${pick.n}.json`);
  const answer = JSON.parse(readFileSync(from, "utf8"));
  const problems = schemaProblems(JSON.parse(schema), answer);
  if (problems.length > 0) throw new Error(`stub ${from}: ${problems.slice(0, 3).join("; ")}`);
  return { answer, from, repeated: pick.repeated };
}

/**
 * A JPEG at half its size, as base64 — drawn in a page of its OWN browser context, so a member's
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
