// THE CHANGE-SESSION DRIVER (#change-scenarios) — one simulated member, one change scenario, one
// fresh faculty world; graded by what the account looks like afterwards.
//
//   npx tsx scripts/faculty/drive.mjs --scenario <scenario.json> --out <fresh dir>
//        [--viewport phone|desktop] [--actor sealed|scripted:<actions.json>] [--port 8800]
//        [--stub <dir>]
//
// THE LOOP is the member study's (scripts/study/drive.mjs → play · sealedActor · scriptedActor):
// the viewport frame → the blind member's turn → that action through the recorder → repeat, until
// `done`, `give_up` or the cap. Three things differ, each because a change is not a read:
//
//  1. THE WORLD IS LIVE. A fresh faculty server (scripts/faculty/world.mjs) boots per session on
//     its own port, so every member starts from the same book and nobody's order leaks into the
//     next run; the recorder opens it through scripts/faculty/live-world.mjs, and writes land.
//  2. THE ORACLE READS THE ACCOUNT (scripts/faculty/oracle.mjs): the orders and positions before
//     the first tap and after the last, diffed against the scenario's `end` spec — plus every
//     UNINTENDED write (an unasked order, a cancelled order nobody named, a position that moved).
//  3. THE CAP IS WIDER: min(2.5 × optimal, 24). Entering an order is taps AND typing — a quantity
//     field is a tap and a type — so the reading study's 15 would fail a member mid-form.
//
// A scenario file:  { id, member, viewport?, email?, participant?, start, optimal, scenario, end }
// — `scenario` is what the member hears (second person, no interface label, never a route);
// `member` names docs/members/<member>.md, whose card (§1 · §3 · §4) the member reads.
//
// Out: turns.jsonl, trace.jsonl + frames/ (the recorder's), before.json / after.json (the account),
// summary.json (verdict, unintended writes, ease, metrics, the world's write log).

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { signSession } from "../../src/server/auth/session.ts";
import { VIEWPORTS } from "../crawl/steps.mjs";
import { play, scriptedActor, sealedActor } from "../study/drive.mjs";
import { taskMetrics } from "../study/metrics.mjs";
import { memberCard } from "../study/packets.mjs";
import { makeCaller, ROLES, signedIn } from "../study/sealed.mjs";
import { close, open, readTrace } from "../study/session.mjs";
import { deviceLine } from "../study/task-file.mjs";
import { gradeChange } from "./oracle.mjs";
import { facultyBootEnv, facultyFixturesDir } from "./world.mjs";

const SECRET = "e2e-dev-secret";
const MAX_ACTIONS = 24;
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** min(2.5 × optimal, 24), never below 1 — the change study's cap (see 3. above). */
export const changeCap = (optimal = 8) =>
  Math.max(1, Math.min(Math.floor(2.5 * optimal), MAX_ACTIONS));

function args(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const o = {
    scenario: get("--scenario"),
    out: get("--out"),
    viewport: get("--viewport"),
    actor: get("--actor") ?? "sealed",
    port: Number(get("--port") ?? 8800),
    stub: get("--stub"),
  };
  if (!(o.scenario && o.out))
    throw new Error(
      "usage: drive.mjs --scenario <file> --out <dir> [--viewport] [--actor] [--port]",
    );
  return o;
}

/** Boot one faculty server; resolves when it is live. */
function boot(port) {
  const fixtures = facultyFixturesDir();
  const env = {
    ...process.env,
    ...facultyBootEnv({ port, bridgePort: port + 1, fixtures }),
    SKYNET_RESEARCH_DIR: "e2e/fixtures/research",
  };
  const child = spawn(
    process.execPath,
    [resolve("node_modules/tsx/dist/cli.mjs"), "src/scripts/serve-dashboard.ts"],
    {
      env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const stop = () => {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* gone */
    }
  };
  return new Promise((ok, fail) => {
    let log = "";
    const timer = setTimeout(() => {
      stop();
      fail(new Error(`faculty server on ${port} did not come up:\n${log.slice(-2000)}`));
    }, 90_000);
    const watch = (chunk) => {
      log += chunk;
      if (log.includes("Observatory live on port")) {
        clearTimeout(timer);
        ok({ origin: `http://localhost:${port}`, stop });
      }
    };
    child.stdout.on("data", watch);
    child.stderr.on("data", watch);
  });
}

/** The account as the oracle reads it: the desk's orders and its positions by symbol. */
export async function readAccount(origin, cookie, participantId) {
  const headers = { cookie: `skynet_session=${cookie}` };
  const q = encodeURIComponent(participantId);
  const orders = await (
    await fetch(`${origin}/api/trade/orders?participantId=${q}`, { headers })
  ).json();
  const desk = await (await fetch(`${origin}/api/desk/${q}`, { headers })).json();
  const positions = {};
  for (const p of desk?.desk?.positions ?? []) positions[p.symbol] = Number(p.quantity);
  // The member's watchlist — the session's own, no participant (watchlist-route.ts), so a change
  // scenario can grade a list change as well as an order (the catalog's AC rows).
  const watch = await (await fetch(`${origin}/api/trade/watchlist`, { headers }))
    .json()
    .catch(() => ({}));
  const watchlist = (watch?.watching ?? []).map((w) => (typeof w === "string" ? w : w.symbol));
  return { orders: [...(orders.working ?? []), ...(orders.recent ?? [])], positions, watchlist };
}

export async function driveChange(o) {
  const scenarioText = readFileSync(o.scenario, "utf8");
  const scenario = JSON.parse(scenarioText);
  const viewport = o.viewport ?? scenario.viewport ?? "phone";
  const vp = VIEWPORTS[viewport];
  const out = resolve(o.out);
  if (existsSync(join(out, "turns.jsonl"))) throw new Error(`${out} already holds a run`);
  mkdirSync(out, { recursive: true });
  const card = memberCard(readFileSync(`docs/members/${scenario.member}.md`, "utf8"), {
    cutoff: new Date().toISOString().slice(0, 10),
    name: scenario.member,
  }).text;
  writeFileSync(join(out, "card.md"), card);
  const email = scenario.email ?? "crawl@example.test";
  const participant = scenario.participant ?? "human-eric";
  const cookie = signSession(
    { email, provider: "google", name: "Faculty", exp: Date.now() + 6 * 3600_000 },
    SECRET,
  );

  const server = await boot(o.port);
  let summary;
  try {
    const before = await readAccount(server.origin, cookie, participant);
    writeFileSync(join(out, "before.json"), `${JSON.stringify(before, null, 2)}\n`);
    const world = {
      name: "faculty",
      origin: server.origin,
      cookie,
      pinnedInstant: new Date().toISOString(),
    };
    const session = await open({
      world,
      viewport,
      startPath: scenario.start ?? "/app",
      runDir: out,
    });
    const cap = changeCap(scenario.optimal);
    let played;
    try {
      const actor =
        o.actor === "sealed"
          ? sealedActor({
              card,
              device: deviceLine(vp),
              scenario: scenario.scenario,
              size: vp.viewport,
              browser: session.page.context().browser(),
              call: makeCaller({ stub: o.stub && resolve(o.stub), record: join(out, "requests") }),
              rolePath: join(o.roles ?? ROLES, "actor.md"),
            })
          : scriptedActor(o.actor.slice("scripted:".length), session);
      played = await play(session, actor, cap, join(out, "turns.jsonl"));
      played.ease = await actor.ease({ turns: played.turns });
    } finally {
      await close(session);
    }
    // A write the page sent as its last act may still be in the air; give the server a beat.
    await new Promise((r) => setTimeout(r, 750));
    const after = await readAccount(server.origin, cookie, participant);
    writeFileSync(join(out, "after.json"), `${JSON.stringify(after, null, 2)}\n`);
    const verdict = gradeChange(before, after, scenario.end ?? {}, new Date());
    const trace = existsSync(join(out, "trace.jsonl")) ? readTrace(out) : [];
    const { findings, ...metrics } = taskMetrics(trace, {
      startPath: session.startPath,
      optimal: scenario.optimal,
    });
    const last = played.turns.at(-1);
    summary = {
      scenario: scenario.id,
      member: scenario.member,
      viewport,
      actor: o.actor,
      cap,
      turns: played.turns.length,
      refusedTurns: played.turns.filter((t) => t.refused).length,
      ended: played.ended,
      said: last?.action?.answer ?? last?.action?.why ?? null,
      verdict,
      ease: played.ease,
      maxConfusion: Math.max(0, ...played.turns.map((t) => Number(t.confusion ?? 0))),
      metrics,
      findings,
      writes: session.shell.log?.writes ?? [],
      inputs: { scenario: sha256(scenarioText), card: sha256(card) },
      frames: session.frames,
    };
    writeFileSync(join(out, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    server.stop();
  }
  return summary;
}

if (process.argv[1]?.endsWith("faculty/drive.mjs")) {
  const o = args(process.argv.slice(2));
  if (o.actor === "sealed" && !o.stub) {
    const auth = signedIn();
    if (!auth.ok) {
      console.error(`faculty: refusing the sealed actor — ${auth.why}`);
      process.exit(2);
    }
  }
  driveChange(o).then(
    (s) => {
      const v = s.verdict;
      console.log(
        `faculty: ${s.scenario} · ${s.member} @${s.viewport} · ${s.turns} turn(s), ended ${s.ended} · ` +
          `${v.success ? "SUCCESS" : "FAIL"} (${v.reason}) · unintended ${v.unintended.length} · ease ${s.ease?.score}`,
      );
    },
    (err) => {
      console.error(err instanceof Error ? err.stack : err);
      process.exitCode = 1;
    },
  );
}
