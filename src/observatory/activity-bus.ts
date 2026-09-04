import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type {
  ActivityEvent,
  ActivityEventBus,
  ActivitySubscription,
  PublishedListener,
} from "./activity-event.js";
import { InMemoryActivityEventBus } from "./in-memory-activity-event-bus.js";

export { InMemoryActivityEventBus };

/**
 * THE ACTIVITY EVENT BUS — the durable, subscribable home for `ActivityEvent`s (#1211). Publishing
 * doubles as durable storage (append-only JSONL, one file per participant — same pattern as
 * `JsonlActivityStore` / `JsonlOrderAuditLog`) and as a live fan-out to whatever is subscribed right
 * now (Moneypenny's context, a future triage view). A subscriber that isn't running when an event
 * publishes still finds it on the next `list()` — the durable log is the source of truth; the live
 * fan-out is a convenience for a process that wants to react as things happen, not the only way in.
 *
 * The `ActivityEventBus` interface itself lives in `activity-event.ts`, alongside the envelope it
 * carries — see the note there for why (this file and `in-memory-activity-event-bus.ts` must not
 * import each other's types, or the two implementations form a cycle).
 */

/** File-backed bus: one append-only JSONL file per participant under `dir`, plus in-process fan-out
 *  for live subscribers. Durability follows `JsonlActivityStore`'s exact shape; only the fan-out is new. */
export class JsonlActivityEventBus implements ActivityEventBus {
  private readonly store: JsonlKeyedStore<ActivityEvent>;
  private readonly listeners = new Set<PublishedListener>();

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<ActivityEvent>(dir, (participantId) =>
      join(dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async publish(event: ActivityEvent): Promise<void> {
    await this.store.append(event.actor.participantId, event);
    for (const listener of this.listeners) listener(event);
  }

  list(participantId?: string): Promise<ActivityEvent[]> {
    return this.store.list(participantId);
  }

  subscribe(listener: PublishedListener): ActivitySubscription {
    this.listeners.add(listener);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }
}

/**
 * Build the bus from the environment. Deliberately NOT its own `SKYNET_*` var: it nests under
 * `SKYNET_ACTIVITY_DIR` (already pinned to the mounted volume in `fly.toml`, which is
 * envelope-protected deploy topology) so the durable event log inherits persistence for free,
 * with no new entry needed there or in `runtime/volume-guard.ts`'s `PERSISTED_STORES`.
 */
export function createActivityEventBus(env: NodeJS.ProcessEnv): ActivityEventBus {
  const activityDir = env.SKYNET_ACTIVITY_DIR ?? "data/activity";
  return new JsonlActivityEventBus(join(activityDir, "events"));
}

/** Offline runs get an in-memory bus, same reasoning as `createBootActivityStore`: a fixture replay
 *  loop must not compound a fabricated event log across restarts. */
export function createBootActivityEventBus(env: NodeJS.ProcessEnv, mode: string): ActivityEventBus {
  return mode === "offline" ? new InMemoryActivityEventBus() : createActivityEventBus(env);
}

/**
 * The bots app's own local bus (#1211 slice 2 — `AlpacaBrokerAdapter.submit`'s "no audit line at
 * all" gap). `fly.bots.toml` mounts a volume dedicated to that app, "never shared with the
 * dashboard's" — there is no `SKYNET_ACTIVITY_DIR` there and adding one is a deploy-topology
 * change (`envelope.json`: `fly.toml`/`fly.bots.toml` are protected — spend + deploy topology,
 * Eric's call). So this nests under whichever durable dir the bots app already has: the same
 * `SKYNET_ACTIVITY_DIR` check first (in case a future deploy ever sets it), else the
 * already-mounted, already-approved `SKYNET_AUDIT_DIR` (`/data/audit` on that volume) — a
 * `activity-events` subfolder there can never collide with `JsonlAuditStore`'s own
 * `<personaId>.jsonl` files sitting directly in that same dir. Dark (`undefined`) when neither is
 * set, same posture as `autonomous-sinks.ts`'s `auditStore` — no durable dir configured means no
 * bus this run, never a silent fallback to an ephemeral path a restart would lose anyway.
 *
 * This closes the "no audit line at all" gap durably; it does NOT merge bot events into the
 * dashboard's own `/data/activity` log — the two apps' volumes stay genuinely separate until a
 * later slice designs a cross-app bridge (the same shape `SKYNET_INSIGHTS_BRIDGE_URL` already is
 * for Mission Control controls) to unify them for Eric's triage view.
 */
export function createBotActivityEventBus(env: NodeJS.ProcessEnv): ActivityEventBus | undefined {
  if (env.SKYNET_ACTIVITY_DIR)
    return new JsonlActivityEventBus(join(env.SKYNET_ACTIVITY_DIR, "events"));
  if (env.SKYNET_AUDIT_DIR)
    return new JsonlActivityEventBus(join(env.SKYNET_AUDIT_DIR, "activity-events"));
  return undefined;
}
