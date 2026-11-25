// REST METER HOOK — the recording half of `npm run rest:meter` (scripts/rest-meter.mjs, #8289).
//
// Two jobs, one tiny module, because both run inside processes the meter does not own:
//
//   1. AS A PRELOAD (`NODE_OPTIONS=--import <this file>`), every Node process the metered command
//      starts wraps `globalThis.fetch` and logs each request's URL. `fetch` never passes through
//      curl, so slice 1's caller lines could not see stuck-pr-scan's or incident-scan's reads
//      (#8482's detail); this is how those get counted.
//   2. AS THE gh/curl SHIM (`node <this file> gh|curl <args…>`, exec'd by the meter's PATH shims),
//      it logs the call with the command line of the process that made it, then runs the real
//      binary with the same stdio and exits with its status.
//
// Every entry is one JSON line appended to $REST_METER_LOG. Nothing here classifies or counts:
// that is rest-meter.mjs's pure `summarize`, so a spec can drive it without a process. Without
// $REST_METER_LOG this module does nothing at all, so a stray preload costs one env read.
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { constants } from "node:os";
import { isMain } from "./is-main.mjs";

const LOG = process.env.REST_METER_LOG;

function record(entry) {
  if (!LOG) return;
  try {
    appendFileSync(LOG, `${JSON.stringify({ ...entry, at: Date.now() })}\n`);
  } catch {
    // a meter that cannot write must never break the command it is watching
  }
}

/** The command line of process `pid`, from /proc where there is one, else `ps`. */
function commandLine(pid) {
  try {
    return readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").filter(Boolean).join(" ");
  } catch {
    const ps = spawnSync("ps", ["-o", "args=", "-p", String(pid)], { encoding: "utf8" });
    return (ps.stdout ?? "").trim();
  }
}

const run = isMain(import.meta.url);

if (LOG && !run && typeof globalThis.fetch === "function") {
  const real = globalThis.fetch;
  globalThis.fetch = function meteredFetch(input, init) {
    const url = typeof input === "string" ? input : (input?.url ?? String(input));
    const method = (init?.method ?? input?.method ?? "GET").toUpperCase();
    record({ via: "fetch", url, method, caller: process.argv.slice(1, 4).join(" ") });
    return real.call(this, input, init);
  };
}

if (run) {
  const [tool, ...args] = process.argv.slice(2);
  const real = process.env[`REST_METER_REAL_${String(tool).toUpperCase()}`];
  if (!real) {
    console.error(`rest-meter: no real ${tool} recorded for this run`);
    process.exit(127);
  }
  record({ via: tool, args, caller: commandLine(process.ppid) });
  const out = spawnSync(real, args, { stdio: "inherit" });
  if (out.error) {
    console.error(`rest-meter: ${tool}: ${out.error.message}`);
    process.exit(127);
  }
  process.exit(out.status ?? 128 + (constants.signals[out.signal] ?? 1));
}
