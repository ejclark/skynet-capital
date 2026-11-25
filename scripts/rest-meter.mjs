#!/usr/bin/env node
// REST METER — run any command and count the GitHub calls it makes, by caller (#8289 slice 2).
//
//   npm run rest:meter -- npm run rank
//   npm run rest:meter -- --log /tmp/calls.jsonl -- node scripts/stuck-pr-scan.mjs
//
// WHY. Every session draws on one 5,000/hr REST allowance, and a surge emptied it 28 minutes
// before the refill (2026-11-24). Five cuts on #8289 each found their spender the same way — a
// logging `gh`/`curl`/`fetch` put on PATH by hand for one run, then thrown away: `npm test` 40
// calls (#8470), `rank` 278 (#8471), `ship.sh open`'s incident scan 267 (#8482), stuck-pr-scan 32
// (#8486), rank's REST fallback 368 (#8489). Slice 1's caller lines (rest-budget.mjs) cannot do
// this job: they fire only under 1,000 left, and only from code that reads the headers, so raw
// `gh` calls and every `fetch` stay invisible. This makes the measurement one line, before a cut
// and after it.
//
// HOW. The command runs with a temp dir first on PATH holding `gh` and `curl` shims, and with
// NODE_OPTIONS importing rest-meter-hook.mjs, which wraps `fetch`. Both append one JSON line per
// call to a log; `summarize` classifies the log afterwards. The calls are REAL — this meters, it
// does not stub — so a metered run spends what it counts.
//
// WHAT IT CANNOT SEE. A `gh api --paginate` is one invocation but N requests (shown as `+`). A
// `gh pr …`/`gh issue …` subcommand is counted as a gh command, not split into REST and GraphQL
// (most are GraphQL). `https.request` and undici called directly are not wrapped; nothing in
// scripts/ uses them for GitHub today.
//
// The summary goes to stderr, so the command's own stdout stays clean; the exit status is the
// command's.
import { spawnSync } from "node:child_process";
import {
  accessSync,
  constants as fsConstants,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { constants as osConstants, tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isMain } from "./is-main.mjs";

const HOOK = join(dirname(fileURLToPath(import.meta.url)), "rest-meter-hook.mjs");
const SHIMMED = ["gh", "curl"];
const GITHUB_API_HOSTS = new Set(["api.github.com", "uploads.github.com"]);

// `gh api` flags that take a value, so the endpoint is the first argument that is neither a flag
// nor one of these values (gh's own `api --help`).
const GH_API_VALUE_FLAGS = new Set([
  "-X",
  "--method",
  "-H",
  "--header",
  "-f",
  "--raw-field",
  "-F",
  "--field",
  "--input",
  "-q",
  "--jq",
  "-t",
  "--template",
  "--hostname",
  "--cache",
  "-p",
  "--preview",
]);
// gh commands that make no API request.
const GH_OFFLINE = new Set(["--version", "version", "help", "--help", "config", "completion"]);

/** A REST path with ids folded, so 30 check-run reads group as one endpoint. Pure. */
export function normalizePath(path) {
  return String(path)
    .split("?")[0]
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/+/, "")
    .replace(/^repos\/[^/]+\/[^/]+(\/|$)/, "repos/{repo}$1")
    .replace(/\b[0-9a-f]{40}\b/g, ":sha")
    .replace(/(^|\/)\d+(?=\/|$)/g, "$1:n");
}

/** The script a command line runs, plus its subcommand when it has one. Pure. */
export function callerOf(commandLine) {
  const words = String(commandLine ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const at = words.findIndex((w) => /\.(mjs|cjs|js|sh|ts)$/.test(w));
  if (at === -1) return words.slice(0, 2).join(" ") || "(unknown)";
  const script = words[at].match(/(?:^|\/)(scripts\/.*)$/)?.[1] ?? words[at];
  const sub = words[at + 1];
  return sub && /^[a-z][a-z-]*$/.test(sub) ? `${script} ${sub}` : script;
}

function classifyUrl(url, method) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "other" };
  }
  if (!GITHUB_API_HOSTS.has(parsed.hostname)) return { kind: "other" };
  if (parsed.pathname === "/graphql") return { kind: "graphql", endpoint: "graphql" };
  return { kind: "rest", endpoint: `${method} ${normalizePath(parsed.pathname)}` };
}

function classifyCurl(args) {
  const url = [...args].reverse().find((a) => /^https?:\/\//.test(a));
  if (!url) return { kind: "other" };
  const x = args.findIndex((a) => a === "-X" || a === "--request");
  const sends = args.some((a) => /^(-d|--data.*|-F|--form|-T|--upload-file)$/.test(a));
  const method = x >= 0 ? String(args[x + 1]).toUpperCase() : sends ? "POST" : "GET";
  return classifyUrl(url, method);
}

/** `gh api`'s endpoint (the first bare argument), its `-X` method, and whether it sends fields. */
function parseGhApi(args) {
  const out = { endpoint: null, method: null, fields: false };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (GH_API_VALUE_FLAGS.has(a)) {
      if (a === "-X" || a === "--method") out.method = String(args[i + 1]).toUpperCase();
      else if (/^(-f|-F|--raw-field|--field|--input)$/.test(a)) out.fields = true;
      i++;
    } else if (a.startsWith("--method=")) out.method = a.slice(9).toUpperCase();
    else if (/^--(field|raw-field|input)=/.test(a)) out.fields = true;
    else if (!a.startsWith("-") && out.endpoint === null) out.endpoint = a;
  }
  return out;
}

function classifyGh(args) {
  if (args.length === 0 || GH_OFFLINE.has(args[0])) return { kind: "none" };
  if (args[0] === "auth")
    return args[1] === "status" ? { kind: "gh-cli", endpoint: "gh auth status" } : { kind: "none" };
  if (args[0] !== "api") return { kind: "gh-cli", endpoint: `gh ${args.slice(0, 2).join(" ")}` };
  const { endpoint, method, fields } = parseGhApi(args);
  if (endpoint === "graphql") return { kind: "graphql", endpoint: "graphql" };
  return {
    kind: "rest",
    endpoint: `${method ?? (fields ? "POST" : "GET")} ${normalizePath(endpoint ?? "")}`,
    paginated: args.includes("--paginate"),
  };
}

/**
 * What one logged call cost: `rest`, `graphql`, `gh-cli` (a gh subcommand, mostly GraphQL),
 * `none` (no request) or `other` (not GitHub's API). Pure.
 */
export function classify(entry) {
  if (entry.via === "fetch") return classifyUrl(entry.url, entry.method ?? "GET");
  if (entry.via === "curl") return classifyCurl(entry.args ?? []);
  return classifyGh(entry.args ?? []);
}

/** Per-caller and per-endpoint counts for a run's log entries. Pure. */
export function summarize(entries) {
  const totals = { rest: 0, graphql: 0, ghCli: 0, paginated: 0 };
  const callers = new Map();
  const endpoints = new Map();
  for (const e of entries) {
    const c = classify(e);
    if (c.kind === "none" || c.kind === "other") continue;
    const who = callerOf(e.caller);
    const row = callers.get(who) ?? { caller: who, rest: 0, graphql: 0, ghCli: 0, paginated: 0 };
    const key = c.kind === "gh-cli" ? "ghCli" : c.kind;
    row[key]++;
    totals[key]++;
    if (c.paginated) {
      row.paginated++;
      totals.paginated++;
    }
    callers.set(who, row);
    if (c.kind === "rest") endpoints.set(c.endpoint, (endpoints.get(c.endpoint) ?? 0) + 1);
  }
  const cost = (r) => r.rest * 1000 + r.ghCli * 10 + r.graphql;
  return {
    totals,
    callers: [...callers.values()].sort((a, b) => cost(b) - cost(a)),
    endpoints: [...endpoints.entries()]
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count || a.endpoint.localeCompare(b.endpoint)),
  };
}

/** The table printed after a metered run. Pure. */
export function formatSummary({ totals, callers, endpoints }, { topEndpoints = 10 } = {}) {
  const plus = totals.paginated ? "+" : "";
  const lines = [
    `rest-meter: ${totals.rest}${plus} REST · ${totals.graphql} GraphQL · ${totals.ghCli} gh commands`,
  ];
  if (callers.length === 0) return lines.join("\n");
  const pad = (v, n) => String(v).padStart(n);
  lines.push(`  ${pad("REST", 6)} ${pad("GraphQL", 7)} ${pad("gh cmd", 6)}  caller`);
  for (const r of callers)
    lines.push(
      `  ${pad(`${r.rest}${r.paginated ? "+" : ""}`, 6)} ${pad(r.graphql, 7)} ${pad(r.ghCli, 6)}  ${r.caller}`,
    );
  if (endpoints.length) {
    lines.push("  top REST endpoints:");
    for (const { endpoint, count } of endpoints.slice(0, topEndpoints))
      lines.push(`  ${pad(count, 6)}  ${endpoint}`);
  }
  if (totals.paginated)
    lines.push(`  + ${totals.paginated} paginated gh api call(s): each may be several requests`);
  return lines.join("\n");
}

/** The first executable `name` on PATH outside `skip`, or null. */
function which(name, path, skip) {
  for (const dir of path.split(delimiter)) {
    if (!dir || resolve(dir) === skip) continue;
    try {
      accessSync(join(dir, name), fsConstants.X_OK);
      return join(dir, name);
    } catch {
      // not here
    }
  }
  return null;
}

function parseArgs(argv) {
  const opts = { log: null, json: null, command: [] };
  let i = 0;
  for (; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      i++;
      break;
    }
    if (a === "--log") opts.log = argv[++i];
    else if (a === "--json") opts.json = argv[++i];
    else break;
  }
  opts.command = argv.slice(i);
  return opts;
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.command.length === 0) {
    console.error(
      "usage: npm run rest:meter -- [--log <file>] [--json <file>] [--] <command> [args…]",
    );
    return 2;
  }
  const scratch = mkdtempSync(join(tmpdir(), "rest-meter-"));
  const bin = join(scratch, "bin");
  const log = opts.log ? resolve(opts.log) : join(scratch, "calls.jsonl");
  writeFileSync(log, "");
  const env = { ...process.env, REST_METER_LOG: log };
  mkdirSync(bin);
  for (const tool of SHIMMED) {
    const real = which(tool, process.env.PATH ?? "", resolve(bin));
    if (!real) continue;
    env[`REST_METER_REAL_${tool.toUpperCase()}`] = real;
    const shim = join(bin, tool);
    writeFileSync(
      shim,
      `#!/usr/bin/env bash\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(HOOK)} ${tool} "$@"\n`,
      { mode: 0o755 },
    );
  }
  env.PATH = `${bin}${delimiter}${process.env.PATH ?? ""}`;
  env.NODE_OPTIONS =
    `${process.env.NODE_OPTIONS ?? ""} --import=${pathToFileURL(HOOK).href}`.trim();

  const run = spawnSync(opts.command[0], opts.command.slice(1), { stdio: "inherit", env });
  const entries = readFileSync(log, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const summary = summarize(entries);
  console.error(formatSummary(summary));
  if (opts.json) writeFileSync(opts.json, `${JSON.stringify(summary, null, 2)}\n`);
  rmSync(scratch, { recursive: true, force: true });
  if (run.error) {
    console.error(`rest-meter: ${opts.command[0]}: ${run.error.message}`);
    return 127;
  }
  return run.status ?? 128 + (osConstants.signals[run.signal] ?? 1);
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
