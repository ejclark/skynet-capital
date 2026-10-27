// What one `/api` request gets inside a study world (#4943 slice 2) — the pure half of
// world-route.mjs, so the contract is specced without a browser (tests/scripts/study-worlds.spec.ts).
// Area-agnostic: the world's own answer function decides bodies; this decides what KIND of answer.

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** True when a request asks for a Server-Sent Events stream (the shell's `/events`, a quote feed). */
export function wantsEventStream(path, accept = "") {
  return path === "/events" || String(accept).includes("text/event-stream");
}

/**
 * Decide what one `/api` request gets.
 *  - an event stream → `stream` (the local server holds it open);
 *  - a write (POST/PUT/PATCH/DELETE) → `write`: recorded by the caller and never sent, answered
 *    with the world's write answer when it has one, else a benign `{ok: true}`;
 *  - a read the world answers → `json` with its status (200 when absent);
 *  - a read it does not → `unstubbed`, which the caller flags and answers 404.
 *
 * @param {{method: string, url: URL, accept?: string}} req
 * @param {(req: {method: string, url: URL, path: string, params: URLSearchParams})
 *          => {status?: number, body: unknown} | undefined} answer
 */
export function routeRequest(req, answer) {
  const path = req.url.pathname;
  if (wantsEventStream(path, req.accept)) return { kind: "stream" };
  const found = answer({ method: req.method, url: req.url, path, params: req.url.searchParams });
  if (WRITE_METHODS.has(req.method)) {
    return found === undefined
      ? { kind: "write", status: 200, body: { ok: true } }
      : { kind: "write", status: found.status ?? 200, body: found.body };
  }
  return found === undefined
    ? { kind: "unstubbed" }
    : { kind: "json", status: found.status ?? 200, body: found.body };
}
