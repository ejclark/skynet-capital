/**
 * AN EVENTSOURCE THAT COMES BACK (#4620) — the native reconnect covers a dropped socket, not a
 * refused one. Per the spec, a reconnect answered with a non-200 (the edge's 502 while a machine
 * restarts) or a wrong content-type moves the source to CLOSED for good: no retry, no error
 * after that, and a board that still wears its "live" pill. This wraps `new EventSource` so a
 * source that has been open once is reopened on a short backoff when it dies that way.
 *
 * A source that never opened is left alone on purpose: the quote and desk routes answer JSON
 * instead of a stream when they decline (no hub, no linked session), the first connect "errors
 * once", and the surface's own fallback carries it — retrying that every few seconds would be
 * a loop against a server that already said no.
 *
 * A reopened source is a NEW connection, so it carries no `Last-Event-ID`; every channel here
 * already treats the server's `hello` as "re-anchor", which is exactly what a reopen needs.
 */

const CLOSED = 2; // EventSource.CLOSED — a literal so a test double without the constants works

/** 1 s, 2 s, 4 s, 8 s, then 15 s: a restart that holds requests ~28 s is caught within ~15 s of
 *  the server coming back, inside the plan's 30 s line. */
export const reopenDelayMs = (attempt: number): number => Math.min(1000 * 2 ** attempt, 15_000);

/** Stop after ~10 minutes of refusals (a signed-out tab, a dead release) rather than forever. */
const MAX_ATTEMPTS = 40;

/**
 * Open `url` and hand every source it ever creates to `wire` (listeners go on there). Returns the
 * disposer the caller owns: it cancels a pending reopen and closes whichever source is current.
 */
export function openReconnectingSource(
  url: string,
  wire: (source: EventSource) => void,
): () => void {
  let current: EventSource | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let everOpened = false;
  let attempt = 0;
  let disposed = false;

  const open = () => {
    const source = new EventSource(url, { withCredentials: true });
    current = source;
    wire(source);
    source.addEventListener("open", () => {
      everOpened = true;
      attempt = 0;
    });
    source.addEventListener("error", () => {
      if (disposed || source.readyState !== CLOSED || !everOpened) return;
      if (attempt >= MAX_ATTEMPTS) return;
      timer = setTimeout(open, reopenDelayMs(attempt));
      attempt += 1;
    });
  };
  open();

  return () => {
    disposed = true;
    if (timer !== undefined) clearTimeout(timer);
    current?.close();
  };
}
