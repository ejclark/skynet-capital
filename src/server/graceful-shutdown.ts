import type { Server } from "node:http";
import { drainSseStreams } from "./sse.js";

/**
 * Drain-on-SIGTERM for the dashboard (#4616, slice 4 of #4612). Fly stops the old machine with
 * SIGTERM and SIGKILLs it `kill_timeout` seconds later; with no handler every deploy cut live
 * requests off mid-response (10.8–28.7 s holds measured on ~50 deploys a day). The order matters:
 *
 *   1. stop accepting — `server.close()` (new connections now go to the next machine / are refused);
 *   2. end every SSE stream with a `retry:` hint — they never finish by themselves, so without this
 *      step `close()` never calls back and Fly's SIGKILL is what actually ends the process;
 *   3. keep dropping idle keep-alive sockets while in-flight requests finish;
 *   4. exit 0 — or force exit 0 when `budgetMs` runs out, still inside the kill timeout.
 *
 * `budgetMs` is deliberately under `kill_timeout` in fly.toml: an exit we chose is a clean one, an
 * exit Fly chose (SIGKILL) is the "unclean restart" slice 6 raises an incident on.
 */
export const DRAIN_BUDGET_MS = 8_000;
/** What every open EventSource is told to wait before reconnecting — long enough that a booting
 *  replacement is up, short enough that a member does not see the board go stale. */
export const SSE_RETRY_MS = 2_000;
const SWEEP_MS = 100;

export interface ShutdownSeams {
  /** Signals to listen on. Default SIGTERM and SIGINT (a dev Ctrl-C drains the same way). */
  signals?: NodeJS.Signals[];
  budgetMs?: number;
  log?: (line: string) => void;
  exit?: (code: number) => void;
  /** Where the handler registers; `process` in production. */
  on?: (signal: NodeJS.Signals, handler: () => void) => void;
}

/** Wire the drain onto `server`. Returns the drain itself so a spec can call it directly. */
export function installGracefulShutdown(server: Server, seams: ShutdownSeams = {}): () => void {
  const budgetMs = seams.budgetMs ?? DRAIN_BUDGET_MS;
  const log = seams.log ?? (() => undefined); // library code: the caller owns the console
  const exit = seams.exit ?? ((code: number) => process.exit(code));
  const on = seams.on ?? ((signal, handler) => process.once(signal, handler));
  let draining = false;

  const drain = (): void => {
    if (draining) return; // a second signal must not restart the clock or double-close
    draining = true;
    log("[shutdown] signal received — draining");
    const forced = setTimeout(() => {
      log(`[shutdown] ${budgetMs} ms budget spent — exiting with requests still open`);
      exit(0);
    }, budgetMs);
    forced.unref();
    // A request that finishes AFTER this point leaves its keep-alive socket idle, and `close()`
    // waits on that socket too — so keep sweeping until the server reports closed.
    const sweep = setInterval(() => server.closeIdleConnections(), SWEEP_MS);
    sweep.unref();
    server.close(() => {
      clearTimeout(forced);
      clearInterval(sweep);
      log("[shutdown] drained — exiting");
      exit(0);
    });
    const streams = drainSseStreams(SSE_RETRY_MS);
    if (streams > 0)
      log(`[shutdown] closed ${streams} live stream(s) with retry ${SSE_RETRY_MS} ms`);
    server.closeIdleConnections();
  };

  for (const signal of seams.signals ?? ["SIGTERM", "SIGINT"]) on(signal, drain);
  return drain;
}
