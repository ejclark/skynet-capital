import type { IncomingMessage, ServerResponse } from "node:http";
import type { CeremonyChannel } from "../observatory/ceremony-channel.js";
import type { DashboardData } from "../observatory/dashboard-data.js";
import type { NavContext } from "../observatory/dashboard-shell.js";
import type { LeaderMetric } from "../observatory/standings-metric.js";
import { type StandingsPatchOptions, standingsFieldOps } from "../observatory/standings-patch.js";
import { renderStandingsContent, type StandingsOptions } from "../observatory/standings-view.js";
import type { WorldTransition } from "../observatory/world-transitions.js";
import { type WorldPatch, WorldPatchChannel } from "../universe/patch-channel.js";
import { projectWorld } from "../universe/project.js";
import { diffWorld, type WorldCue } from "../universe/world-patch.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import { sseFrame } from "./sse.js";

/**
 * THE LIVE BOARD'S TRANSPORT — `/events` as a seq-numbered patch channel, and `/board/frame` as the
 * honest fallback for the changes a patch cannot express.
 *
 * Before this, `/events` pushed a freshly rendered page body on every hub tick and the client did
 * `root.innerHTML = …`, which destroyed all client state ~4 times a second. Now the hub drives ONE
 * server-wide channel (not one render per viewer), and each connection turns a numbered patch into
 * the ops its own query string implies — so a viewer on `?by=return` and one on `?by=equity` share
 * the same seq run and each still sees their own metric.
 *
 * The per-viewer half is why the channel carries the state PAIR as its context: on reconnect the
 * replayed patches are re-formatted for that connection's metric, rather than replaying text that
 * was formatted for whoever happened to be connected at the time.
 */

/** What each numbered patch remembers so a per-viewer view can derive its own display ops later. */
interface BoardPatchContext {
  readonly prev: DashboardData;
  readonly next: DashboardData;
}

export type BoardPatchChannel = WorldPatchChannel<BoardPatchContext>;

export function createBoardChannel(): BoardPatchChannel {
  return new WorldPatchChannel<BoardPatchContext>();
}

/** A derived ceremony transition, flattened onto the wire. Detail is carried verbatim. */
function toCue(transition: WorldTransition): WorldCue {
  return {
    id: transition.id,
    type: transition.type,
    participantId: transition.participantId,
    at: transition.at,
    detail:
      transition.type === "took_profit"
        ? { realized: transition.realized }
        : { committed: transition.committed },
  };
}

/**
 * Fold hub state (and ceremony cues) into the numbered channel. Called ONCE per server: the diff is
 * computed a single time per tick no matter how many viewers are connected, which is the other half
 * of what made the old full-render channel expensive. Returns an unsubscribe.
 */
export function driveBoardChannel(
  hub: ObservatoryHub,
  channel: BoardPatchChannel,
  ceremonies?: CeremonyChannel,
): () => void {
  let prev = hub.getState();
  let prevWorld = projectWorld(prev.participants);
  const offHub = hub.subscribe((next) => {
    const nextWorld = projectWorld(next.participants);
    const ops = diffWorld(prevWorld, nextWorld);
    const context: BoardPatchContext = { prev, next };
    prev = next;
    prevWorld = nextWorld;
    // Published even when the WORLD ops are empty: a change the world model doesn't carry (realized
    // P/L, a display-only figure) still moved the board, and the context is what expresses it.
    channel.publish(next.generatedAt, ops, context);
  });
  // Ceremonies ride the same seq run so "fire once" is one guarantee, not two. They are flavor over
  // the state, never a change to it, so the context pair is deliberately identical.
  const offCeremony = ceremonies?.subscribe((transition) => {
    const state = hub.getState();
    channel.publish(state.generatedAt, [{ kind: "cue", cue: toCue(transition) }], {
      prev: state,
      next: state,
    });
  });
  return () => {
    offHub();
    offCeremony?.();
  };
}

/** `Last-Event-ID` (the browser's own reconnect header), or undefined when this is a fresh connect. */
function lastEventId(req: IncomingMessage): number | undefined {
  const raw = req.headers["last-event-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const seq = Number.parseInt(value, 10);
  return Number.isInteger(seq) ? seq : undefined;
}

function writePatch(
  res: ServerResponse,
  patch: WorldPatch<BoardPatchContext>,
  opts: StandingsPatchOptions,
): void {
  const ops = [...patch.ops, ...standingsFieldOps(patch.context.prev, patch.context.next, opts)];
  // Written even when empty: the seq run must stay gapless, or the next patch reads as a gap and
  // costs the viewer a needless full frame.
  res.write(sseFrame(JSON.stringify({ seq: patch.seq, at: patch.at, ops }), "patch", patch.seq));
}

/**
 * The `/events` stream. A fresh connection is told the current head so it can ignore anything the
 * server-rendered page already showed; a reconnecting one replays exactly what it missed, or is told
 * to resync when its position has fallen out of the buffer. It never carries HTML.
 */
export function streamBoardPatches(
  req: IncomingMessage,
  res: ServerResponse,
  channel: BoardPatchChannel,
  metric: LeaderMetric,
  compare: Pick<StandingsOptions, "aId" | "bId">,
): void {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  const opts: StandingsPatchOptions = { metric, ...compare };
  const resumeAt = lastEventId(req);

  if (resumeAt === undefined) {
    res.write(sseFrame(JSON.stringify({ seq: channel.head }), "hello"));
  } else {
    const replay = channel.since(resumeAt);
    if (replay.ok) {
      res.write(sseFrame(JSON.stringify({ seq: resumeAt }), "hello"));
      for (const patch of replay.patches) writePatch(res, patch, opts);
    } else {
      // An honest admission, not a partial history: the client takes one fresh frame instead of
      // patching around a hole. No cue from the missed window is replayed, so nothing double-fires.
      res.write(sseFrame(JSON.stringify({ seq: replay.head }), "resync"));
    }
  }

  const unsubscribe = channel.subscribe((patch) => writePatch(res, patch, opts));
  req.on("close", unsubscribe);
}

/**
 * `/board/frame` — the same Standings content the page was server-rendered with, re-served whole.
 * The client asks for this only when a patch could not be applied honestly (a row appeared, the
 * cohort lead flipped, a seq gap). Behind the same auth gate as the board itself.
 */
export function serveBoardFrame(
  res: ServerResponse,
  hub: ObservatoryHub,
  nav: NavContext,
  metric: LeaderMetric,
  compare: Pick<StandingsOptions, "aId" | "bId">,
): void {
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(renderStandingsContent(hub.getState(), { nav, metric, ...compare }));
}
