// MONEYPENNY'S CHAT IN A STUDY WORLD (#8005 slice 4) — the ONE module a world session imports to
// put the dock's chat in a simulated member's hands. Area-agnostic: any composed world whose
// definition says `chat: true` gets it, whichever area's worlds (cross-feature, Trade, the bot
// pages) a session builds.
//
//   const chat = await startWorldChat({ run, world, viewer, log: <session>/chat.jsonl,
//                                       record: <session>/requests, mode: "live" });
//   openWorld({ answer, at, frame, chat });   // world-route.mjs routes the chat's writes here
//   …
//   await chat.close();
//
// WHAT IT ANSWERS (only POSTs; every read stays the composed world's):
//   /api/companion/chat      production's route and engine in a pinned child (world-chat-server.mjs),
//                            the model a sealed call (chat-transport.mjs) — her answer streams back
//                            as production's SSE frames;
//   /api/feedback            a draft the member sends: recorded, NEVER filed. The page is told it was
//                            filed as world filing #90001… (shell-artifacts.mjs declares it);
//   /api/feedback/followup   a follow-up the member sends: recorded, never posted.
//
// EVERY DRAFT IS A FINDING, NEVER AN ISSUE: each exchange and each send is one line of the
// session's `chat.jsonl` (the session folder's CHAT_LOG); round-findings.mjs → fromChat turns the
// filing drafts she made into findings of class `chat` (round-contract.mjs) — its own column, not
// blind (her prompt is production's, not the key's, but she was not a member).
//
// MODES: "live" (the sealed CLI), "stub" (answers from `<stub>/moneypenny/<n>.json`, no sign-in,
// for dry runs), "off" (production's route with the companion switched off: "isn't switched on
// yet"). Prove it on one exchange, no browser:
//
//   node --import tsx scripts/study/world-chat.mjs --probe --run <compose dir> --world <name> \
//     --viewer <who> --out <fresh dir> [--page <path>] [--stub <dir>] --say "<message>" [--say …]
//
// Each `--say` is one member turn; her reply joins the history before the next, as the dock sends it.

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./compat.mjs";
import { worldInstant } from "./worlds/instant.mjs";

/** The header the child reads the member's viewer from (a world viewer id, never an email). */
export const VIEWER_HEADER = "x-study-viewer";
export const CHAT_PATH = "/api/companion/chat";
export const FILE_PATH = "/api/feedback";
export const FOLLOWUP_PATH = "/api/feedback/followup";
/** A session's chat record, beside its turns and trace. */
export const CHAT_LOG = "chat.jsonl";
/** The first number a world tells the page a sent draft was "filed" as — never a real issue. */
export const WORLD_FILING_BASE = 90_001;
export const MODES = ["live", "stub", "off"];

/** Is this request one the chat answers? Only its writes; reads stay the composed world's. */
export const chatHandles = ({ method, path }) =>
  method === "POST" && [CHAT_PATH, FILE_PATH, FOLLOWUP_PATH].includes(path);

/** An SSE body as frames, `data` parsed as JSON where it is JSON. */
export function parseSse(text) {
  return String(text ?? "")
    .split("\n\n")
    .filter((f) => f.trim())
    .map((frame) => {
      let event = "message";
      const data = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      const raw = data.join("\n");
      try {
        return { event, data: JSON.parse(raw) };
      } catch {
        return { event, data: raw };
      }
    });
}

/** The draft kinds an answer's frames carry, by the frame the route writes for each. */
const DRAFT_FRAMES = {
  handoff: "filing",
  followup: "followup",
  conviction: "view",
  "research-ask": "research-question",
};

/** What she drafted in one answer: `[{kind, draft}]`. Filings and follow-ups are friction a member
 *  voiced; a view or a research question is the product in use (kept, not a finding). */
export const draftsOf = (frames) =>
  frames
    .filter((f) => DRAFT_FRAMES[f.event])
    .map((f) => ({ kind: DRAFT_FRAMES[f.event], draft: f.data }));

/** Her words in one answer, joined from its deltas, and how it ended. */
export function replyOf(frames) {
  const text = frames
    .filter((f) => f.event === "delta")
    .map((f) => f.data?.text ?? "")
    .join("");
  const end = frames.findLast((f) => f.event === "done" || f.event === "error");
  return {
    text,
    ended: end?.event ?? "cut-off",
    ...(end?.event === "error" ? { error: end.data?.error } : {}),
  };
}

/** The member's last message in a chat request body, and the page they asked from. */
export function askedOf(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const last = messages.findLast((m) => m?.role === "user");
  return { said: typeof last?.content === "string" ? last.content : "", page: body?.page ?? null };
}

/** What the page is told when a member sends a draft: filed, under a world number. */
export const filedAnswer = (k) => ({
  ok: true,
  number: WORLD_FILING_BASE + k,
  url: `https://github.com/ejclark/skynet-capital/issues/${WORLD_FILING_BASE + k}`,
});

const parseBody = (body) => {
  try {
    return JSON.parse(String(body ?? ""));
  } catch {
    return null;
  }
};

const HERE = dirname(fileURLToPath(import.meta.url));

/** Start the child on the world's own instant (the run's manifest); resolves to its port once it
 *  prints `{"ready": <port>}`. */
function spawnServer({ run, world, record, stub, mode }) {
  const manifest = JSON.parse(readFileSync(join(run, "manifest.json"), "utf8"));
  const child = spawn(
    process.execPath,
    [
      ...process.execArgv,
      join(HERE, "world-chat-server.mjs"),
      "--run",
      run,
      "--world",
      world,
      "--record",
      record,
      ...(mode === "stub" ? ["--stub", stub] : []),
      ...(mode === "off" ? ["--off"] : []),
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, TZ: "UTC", STUDY_INSTANT: worldInstant(manifest, world) },
    },
  );
  let err = "";
  child.stderr.setEncoding("utf8").on("data", (c) => {
    err = `${err}${c}`.slice(-2000);
  });
  const ready = new Promise((ok, fail) => {
    let out = "";
    child.stdout.setEncoding("utf8").on("data", (c) => {
      out += c;
      const line = out.split("\n").find((l) => l.startsWith("{"));
      if (line) ok(JSON.parse(line).ready);
    });
    child.on("exit", (code) =>
      fail(
        new Error(`world chat exited ${code} before ready: ${err.trim().split("\n").at(-1) ?? ""}`),
      ),
    );
  });
  return { child, ready, stderr: () => err };
}

/**
 * Start Moneypenny for one member session in one composed world.
 * @param {{run: string, world: string, viewer: string, log: string, record: string,
 *          mode?: "live"|"stub"|"off", stub?: string}} opts
 * @returns {Promise<{handles: Function, respond: Function, close: () => Promise<void>,
 *                    exchanges: () => number}>}
 */
export async function startWorldChat({ run, world, viewer, log, record, mode = "live", stub }) {
  if (!MODES.includes(mode)) throw new Error(`world chat: mode must be ${MODES.join(" | ")}`);
  if (mode === "stub" && !stub) throw new Error("world chat: stub mode needs a stub dir");
  mkdirSync(dirname(resolve(log)), { recursive: true });
  const server = spawnServer({
    run: resolve(run),
    world,
    record: resolve(record),
    stub: stub && resolve(stub),
    mode,
  });
  const port = await server.ready;
  const origin = `http://127.0.0.1:${port}`;
  let n = 0;
  let filed = 0;
  const write = (entry) => appendFileSync(log, `${JSON.stringify({ n: n++, ...entry })}\n`);

  async function respond({ path, body }) {
    if (path === CHAT_PATH) {
      const res = await fetch(`${origin}${CHAT_PATH}`, {
        method: "POST",
        headers: { "content-type": "application/json", [VIEWER_HEADER]: viewer },
        body: body ?? "",
      });
      const text = await res.text();
      const contentType = res.headers.get("content-type") ?? "application/json";
      const frames = contentType.includes("text/event-stream") ? parseSse(text) : [];
      write({
        kind: "chat",
        mode,
        ...askedOf(parseBody(body)),
        status: res.status,
        reply:
          frames.length > 0
            ? replyOf(frames)
            : { text: "", ended: "refused", error: parseBody(text)?.error ?? text },
        drafts: draftsOf(frames),
      });
      return { status: res.status, contentType, body: text };
    }
    if (path === FILE_PATH) {
      filed += 1;
      const answer = filedAnswer(filed);
      write({ kind: "sent", what: "filing", draft: parseBody(body), answer });
      return { status: 200, contentType: "application/json", body: JSON.stringify(answer) };
    }
    const answer = { ok: true, outcome: "unchanged" };
    write({ kind: "sent", what: "followup", draft: parseBody(body), answer });
    return { status: 200, contentType: "application/json", body: JSON.stringify(answer) };
  }

  return {
    handles: chatHandles,
    respond,
    exchanges: () => n,
    close: async () => {
      if (server.child.exitCode === null) {
        const gone = new Promise((ok) => server.child.once("exit", ok));
        server.child.kill("SIGTERM");
        await gone;
      }
    },
  };
}

/** `--probe`: one exchange through the child, no browser — the proof the chat answers from the
 *  world. Writes `<out>/chat.jsonl` and `<out>/requests/`, prints her reply and any draft. */
async function probe(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const says = argv.flatMap((a, i) => (a === "--say" && argv[i + 1] ? [argv[i + 1]] : []));
  const out = resolve(get("--out") ?? "");
  if (!(get("--run") && get("--world") && get("--viewer") && get("--out") && says.length > 0)) {
    throw new Error(
      'usage: world-chat.mjs --probe --run <dir> --world <name> --viewer <who> --out <dir> [--page <path>] [--stub <dir>] --say "<message>" [--say …]',
    );
  }
  if (existsSync(join(out, CHAT_LOG))) throw new Error(`${out} already holds a probe`);
  mkdirSync(out, { recursive: true });
  const stub = get("--stub");
  const chat = await startWorldChat({
    run: get("--run"),
    world: get("--world"),
    viewer: get("--viewer"),
    log: join(out, CHAT_LOG),
    record: join(out, "requests"),
    mode: stub ? "stub" : "live",
    ...(stub ? { stub } : {}),
  });
  try {
    const messages = [];
    for (const [i, said] of says.entries()) {
      messages.push({ role: "user", content: said });
      const body = JSON.stringify({ messages, page: get("--page") ?? "/app/" });
      const answer = await chat.respond({ method: "POST", path: CHAT_PATH, body });
      const frames = parseSse(answer.body);
      writeFileSync(join(out, `answer-${i + 1}.sse`), answer.body);
      const reply = replyOf(frames);
      messages.push({ role: "assistant", content: reply.text });
      console.log(
        JSON.stringify(
          { turn: i + 1, status: answer.status, reply, drafts: draftsOf(frames) },
          null,
          1,
        ),
      );
    }
  } finally {
    await chat.close();
  }
}

if (isMain(import.meta.url) && process.argv.includes("--probe")) {
  probe(process.argv.slice(2)).catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  });
}
