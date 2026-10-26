import type { IncomingMessage, ServerResponse } from "node:http";
import type { CeremonyChannel } from "../observatory/ceremony-channel.js";
import type { DashboardData } from "../observatory/dashboard-data.js";
import type { LeaderMetric } from "../observatory/standings-metric.js";
import { type StandingsPatchOptions, standingsFieldOps } from "../observatory/standings-patch.js";
import type { StandingsOptions } from "../observatory/standings-view.js";
import type { WorldTransition } from "../observatory/world-transitions.js";
import { type WorldPatch, WorldPatchChannel } from "../universe/patch-channel.js";
import { projectWorld } from "../universe/project.js";
import { diffWorld, type WorldCue } from "../universe/world-patch.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import { openSseStream, sseFrame } from "./sse.js";

/**
 * THE LIVE BOARD'S TRANSPORT — `/events` as a seq-numbered patch channel. The honest fallback for
 * the changes a patch cannot express is the client re-reading `/api/board` (`content-api-routes.ts`);
 * the old HTML fragment route, `/board/frame`, had no caller left in the app and was removed
 * (#3816 slice 8).
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

/** `boot` is pinned only where payloads are hashed for determinism (the study worlds); a server
 *  leaves it unset so every process start names a new run of seqs (#4620). */
export function createBoardChannel(boot?: string): BoardPatchChannel {
  return new WorldPatchChannel<BoardPatchContext>(boot === undefined ? {} : { boot });
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
        : transition.type === "deployed_capital"
          ? { committed: transition.committed }
          : { level: transition.level },
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

/** The SSE id a patch carries: `boot:seq`, so a browser's own reconnect header names the run too. */
const eventId = (boot: string, seq: number) => `${boot}:${seq}`;

/**
 * `Last-Event-ID` (the browser's own reconnect header) as `{ boot, seq }`, or undefined when this is
 * a fresh connect. An id that is not `boot:seq` (a pre-boot-id client, a mangled header) parses to a
 * boot nothing matches, which resolves to a resync — never to a guess.
 */
function lastEventId(req: IncomingMessage): { boot: string; seq: number } | undefined {
  const raw = req.headers["last-event-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const cut = value.lastIndexOf(":");
  const seq = Number.parseInt(value.slice(cut + 1), 10);
  return { boot: cut < 0 ? "" : value.slice(0, cut), seq: Number.isInteger(seq) ? seq : -1 };
}

function writePatch(
  res: ServerResponse,
  channel: BoardPatchChannel,
  patch: WorldPatch<BoardPatchContext>,
  opts: StandingsPatchOptions,
): void {
  const ops = [...patch.ops, ...standingsFieldOps(patch.context.prev, patch.context.next, opts)];
  // Written even when empty: the seq run must stay gapless, or the next patch reads as a gap and
  // costs the viewer a needless full frame.
  res.write(
    sseFrame(
      JSON.stringify({ boot: channel.boot, seq: patch.seq, at: patch.at, ops }),
      "patch",
      eventId(channel.boot, patch.seq),
    ),
  );
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
  openSseStream(res);
  const opts: StandingsPatchOptions = { metric, ...compare };
  const resumeAt = lastEventId(req);
  const { boot } = channel;

  if (resumeAt === undefined) {
    res.write(sseFrame(JSON.stringify({ boot, seq: channel.head }), "hello"));
  } else {
    // A client from an earlier run of this server (a restart) holds seqs that mean nothing here, even
    // when they happen to fall inside the new buffer — the id's boot is checked before its seq.
    const replay = resumeAt.boot === boot ? channel.since(resumeAt.seq) : undefined;
    if (replay?.ok) {
      res.write(sseFrame(JSON.stringify({ boot, seq: resumeAt.seq }), "hello"));
      for (const patch of replay.patches) writePatch(res, channel, patch, opts);
    } else {
      // An honest admission, not a partial history: the client takes one fresh frame instead of
      // patching around a hole. No cue from the missed window is replayed, so nothing double-fires.
      res.write(sseFrame(JSON.stringify({ boot, seq: channel.head }), "resync"));
    }
  }

  const unsubscribe = channel.subscribe((patch) => writePatch(res, channel, patch, opts));
  req.on("close", unsubscribe);
}
