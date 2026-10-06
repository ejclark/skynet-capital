// THE STABILITY BUDGET RUN — `npm run stability:budget` (#4612 slice 1, #4613).
//
// Runs an already-built server bundle the way production runs it — plain node, fly.toml's own env,
// every durable store under /data, a 512 MB container with no swap — on production-shaped data
// (`--days` of history for `--participants` accounts, seed.ts), then clicks what a member clicks:
// Accounts opened on a cold server exactly as the shell fires it, the same load with every
// participant's Pulse at once (twice), each Pulse alone, and a handful of other common GETs. It
// prints one markdown table per phase and exits non-zero on an OOM kill, a process exit, any 5xx,
// peak RSS over `--budget-mb`, an Accounts open that adds more than `--page-mb`, or a Pulse (inside
// that open, or fired alone) that takes longer than `--pulse-ms` or, alone, adds over `--pulse-mb`.
//
// Why it exists: the Accounts click that OOM-killed production was invisible to every check we
// had — offline mode serves empty in-memory ledgers, specs run on a handful of rows, and the
// memory was native ICU memory a heap cap or snapshot cannot see. This measures RSS (the process's
// VmHWM, reset per phase) and the cgroup's memory.peak, never the JS heap.
//
//   npm run build:server && npm run build --prefix app        # the bundle under test
//   npm run stability:budget                                   # 180 days × 12, budget 300 MB
//   npm run stability:budget -- --root ../base --days 56        # another tree's bundle, 56 days
//   npm run stability:budget -- --port 8831 --prefix stab1- --keep --json /tmp/run.json
//
// The default run is red until #4612 slice 7 (#4619) lands: at 180 days boot's whole-history read
// alone peaks near 300 MB and the Accounts open shares its loop with ops-status's whole-ledger read.
// It passes at 56 days, production's depth on 2026-10-04 (`--days 56`).
//
// How: the server runs in LIVE mode against stub-broker.mjs (offline mode would swap the ledgers
// out) on a private docker network; files reach the containers by `docker cp`, so nothing depends
// on what the docker host can bind-mount. Needs docker. The seed and the session cookie come from
// THIS tree; the bundle, app/dist, fly.toml and the research shelf come from `--root`.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mintSession } from "../crawl/mint-session.ts";
import {
  accountsBurst,
  accountsOpen,
  commonGets,
  flyCommand,
  flyEnv,
  procMemory,
  summary,
  verdict,
} from "./budget-lib.mjs";
import {
  brokerUrl,
  containerNames,
  dockerReachable,
  removeContainers,
  serverProbe,
  startContainers,
} from "./containers.mjs";
import { harnessRoster, OWNER_EMAIL, seedStores } from "./seed.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const SECRET = "stability-session-secret-0123456789";

function opt(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return typeof fallback === "boolean" ? true : process.argv[i + 1];
}
const root = resolve(opt("root", "."));
const days = Number(opt("days", "180"));
const participants = Number(opt("participants", "12"));
const budgets = {
  peakMb: Number(opt("budget-mb", "300")),
  pageMb: Number(opt("page-mb", "30")),
  pulseMb: Number(opt("pulse-mb", "30")),
  pulseMs: Number(opt("pulse-ms", "150")),
};
const memory = opt("memory", "512m");
const port = Number(opt("port", "8799"));
const names = containerNames(opt("prefix", "stability-"));
const keep = opt("keep", false);
const jsonOut = opt("json", "");

for (const need of ["dist/serve.mjs", "app/dist/index.html", "fly.toml"]) {
  if (!existsSync(join(root, need))) {
    console.error(`stability: ${join(root, need)} is missing — build the bundle under test first:`);
    console.error("  npm run build:server && npm run build --prefix app");
    process.exit(2);
  }
}
if (!dockerReachable()) {
  console.error("stability: docker is not reachable — this run needs a docker host.");
  process.exit(2);
}

// ---- seed: production's stores at production's paths (fly.toml's /data/… mapped onto a stage) --
const fly = readFileSync(join(root, "fly.toml"), "utf8");
const prodEnv = flyEnv(fly);
const stage = mkdtempSync(join(tmpdir(), "stability-"));
const data = join(stage, "data");
const onHost = (v) => join(data, (v ?? "").replace(/^\/data\/?/, ""));
const roster = harnessRoster(participants);
const t0 = performance.now();
const seeded = seedStores({
  days,
  participants,
  dirs: {
    history: onHost(prodEnv.SKYNET_HISTORY_DIR),
    activity: onHost(prodEnv.SKYNET_ACTIVITY_DIR),
    orderAudit: onHost(prodEnv.SKYNET_ORDER_AUDIT_DIR),
    feedbackLog: onHost(prodEnv.SKYNET_FEEDBACK_LOG_DIR),
    companionMessageLog: onHost(prodEnv.SKYNET_COMPANION_MESSAGE_LOG_DIR),
    insights: onHost(prodEnv.SKYNET_INSIGHTS_DIR),
  },
});
const seedMs = Math.round(performance.now() - t0);
const stubDir = join(stage, "stub");
mkdirSync(stubDir);
const accounts = roster.map((p) => [
  `stab-${p.id}`,
  { id: p.id, equity: seeded.lastEquity[p.id] ?? 100_000 },
]);
writeFileSync(join(stubDir, "accounts.json"), JSON.stringify(Object.fromEntries(accounts)));
writeFileSync(join(stubDir, "stub-broker.mjs"), readFileSync(join(HERE, "stub-broker.mjs")));

// ---- boot: live mode, the roster from env exactly as production reads it, Alpaca = the stub ---
removeContainers(names);
const broker = brokerUrl(names);
try {
  startContainers({
    names,
    image: opt("image", "node:24-slim"),
    memory,
    port,
    root,
    stubDir,
    dataDir: data,
    command: flyCommand(fly),
    env: {
      ...prodEnv,
      ALPACA_PAPER_BASE_URL: broker,
      ALPACA_DATA_BASE_URL: broker,
      SKYNET_SESSION_SECRET: SECRET,
      SKYNET_GOOGLE_CLIENT_ID: "stability-fake-client",
      SKYNET_GOOGLE_CLIENT_SECRET: "stability-fake-secret",
      SKYNET_ALLOWED_EMAILS: OWNER_EMAIL,
      SKYNET_STORE_SECRET: "stability-store-secret-0123456789",
      ...Object.fromEntries(
        roster.flatMap((p) => [
          [p.keyVar, `stab-${p.id}`],
          [p.secretVar, "stability"],
          ...(p.emailVar ? [[p.emailVar, OWNER_EMAIL]] : []),
        ]),
      ),
    },
  });
} catch (e) {
  removeContainers(names); // never leave a half-built pair holding the port
  rmSync(stage, { recursive: true, force: true });
  throw e;
}
const server = serverProbe(names.server);
const mem = () => procMemory(server.status());
const git = (...a) => spawnSync("git", ["-C", root, ...a], { encoding: "utf8" });
const dirty = git("diff", "--quiet", "HEAD").status ? "-dirty" : "";
const report = {
  root,
  commit: `${git("log", "-1", "--format=%h").stdout.trim()}${dirty}`,
  days,
  participants,
  memory,
  seeded,
  seedMs,
  budgets,
  phases: [],
};

function finish(code) {
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(report, null, 1));
  if (keep) console.log(`\nkept: containers ${names.server}, ${names.broker}; data ${stage}`);
  else {
    removeContainers(names);
    rmSync(stage, { recursive: true, force: true });
  }
  process.exit(code);
}

const cookie = `skynet_session=${encodeURIComponent(mintSession(OWNER_EMAIL, SECRET))}`;
async function hit(path) {
  const start = performance.now();
  const ms = () => Math.round(performance.now() - start);
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { cookie },
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    const body = await res.arrayBuffer();
    return { path, status: res.status, ms: ms(), kb: Math.round(body.byteLength / 1024) };
  } catch (e) {
    return { path, status: `ERR ${e.cause?.code ?? e.name}`, ms: ms() };
  }
}

/** Fire `paths` together (a page load) or one by one, each with its own reset peak and delta. */
async function phase(name, note, paths, together) {
  server.resetPeak();
  const beforeMb = mem().rss;
  const start = performance.now();
  const rows = [];
  if (together) rows.push(...(await Promise.all(paths.map(hit))));
  else
    for (const path of paths) {
      server.resetPeak();
      const pre = mem().rss;
      const row = await hit(path);
      if (!server.state().running) {
        rows.push(row);
        break;
      }
      const peak = mem().hwm;
      rows.push({ ...row, addMb: peak - pre, peakMb: peak });
    }
  const wallMs = Math.round(performance.now() - start);
  const alive = server.state().running;
  // A dead container has no /proc to read: its phase records no peak, and the verdict says why.
  const peaks = () => (together ? [mem().hwm] : rows.map((r) => r.peakMb ?? 0));
  const peakMb = alive ? Math.max(beforeMb, ...peaks()) : undefined;
  report.phases.push({ name, note, rows, wallMs, beforeMb, ...(alive ? { peakMb } : {}) });
  return alive;
}

/** Boot, click every phase, judge. Returns the exit code; a throw is caught by the caller. */
async function measure() {
  if (!(await server.ready())) {
    console.error(`stability: the server never said "Observatory live":\n${server.logs()}`);
    return 1;
  }
  await new Promise((r) => setTimeout(r, 3000)); // boot reconcile, ladder sweep, first sampler tick
  const boot = mem();
  report.boot = { peakMb: boot.hwm, settledMb: boot.rss, anonMb: boot.anon };

  const ids = roster.map((p) => p.id);
  const owner = roster.find((p) => p.emailVar)?.id ?? ids[0];
  const bot = roster.find((p) => p.kind === "bot")?.id ?? owner;
  const burst = accountsBurst(owner, ids);
  const plan = [
    ["accounts-open", "a member opens Accounts, cold: what the shell fires", accountsOpen(owner)],
    ["accounts-every-pulse", "the same page load with every desk's Pulse at once", burst],
    ["accounts-every-pulse-again", "the same burst, warm", burst],
    ["pulse-each", "each participant's Pulse, alone", burst.filter((p) => p.endsWith("/pulse"))],
    ["common", "other common GETs, one by one", commonGets(bot)],
  ];
  for (const [name, note, paths] of plan)
    if (!(await phase(name, note, paths, !["pulse-each", "common"].includes(name)))) break;

  report.state = server.state();
  if (report.state.running) report.cgroupPeakMb = server.cgroupPeakMb();
  report.verdict = verdict({
    phases: report.phases,
    state: report.state,
    budgets,
    bootPeakMb: report.boot.peakMb,
  });
  console.log(summary(report));
  return report.verdict.ok ? 0 : 1;
}

// Whatever happens after boot — a docker exec on a container that died between reads, a cgroup v1
// host with no memory.peak — the containers and the stage dir go, and the run exits non-zero.
let code = 1;
try {
  code = await measure();
} catch (e) {
  console.error(`stability: the run crashed after boot — ${e?.stack ?? e}`);
} finally {
  finish(code);
}
