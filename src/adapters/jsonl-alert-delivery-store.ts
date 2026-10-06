import { join } from "node:path";
import {
  type AlertDeliveryPrefs,
  DELIVERY_OFF,
  parseChannel,
  parsePriority,
} from "../alerts/alert-delivery.js";
import type { AlertDeliveryRecord, AlertDeliveryStorePort } from "../ports/alert-delivery.js";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";

/**
 * THE DURABLE `AlertDeliveryStorePort` (#3407 P4 slice 3) — one append-only JSONL file per member
 * under `dir`, on the mounted volume, the same shape as the dismissals store beside it.
 *
 * Two line kinds in ONE file rather than two stores: a member's choice (`prefs`) and the
 * fingerprints already mailed to them (`sent`). They are read together on every delivery decision
 * and they share a lifetime — a member who turns delivery off wants both facts in one place — and
 * one file per member keeps "forget me" a single unlink.
 *
 * Append-only, last-prefs-line-wins: a member toggling the channel four times costs four lines and
 * reads back as the fourth. `consumerId` is written INTO each line rather than decoded from the
 * filename, so `listMembers` never has to reverse the filename sanitizer.
 *
 * Why durable rather than in-memory: the sent-ledger is what stops a redeploy re-mailing every
 * standing alert. An in-memory ledger would turn each deploy into a small mail storm, which is the
 * exact way a notification feature teaches members to ignore it.
 */

type Line =
  | {
      readonly kind: "prefs";
      readonly consumerId: string;
      readonly at: string;
      readonly channel: string;
      readonly minPriority: string;
      readonly destination?: string;
    }
  | {
      readonly kind: "sent";
      readonly consumerId: string;
      readonly at: string;
      readonly fingerprint: string;
    };

/** A stored prefs line back into the typed shape, or undefined when it is not one we understand —
 *  a line written by a future channel must read as "no choice", never as a wrong choice. */
function prefsFrom(line: Line & { readonly kind: "prefs" }): AlertDeliveryPrefs | undefined {
  const channel = parseChannel(line.channel);
  const minPriority = parsePriority(line.minPriority);
  if (!(channel && minPriority)) return undefined;
  return { channel, minPriority, ...(line.destination ? { destination: line.destination } : {}) };
}

export class JsonlAlertDeliveryStore implements AlertDeliveryStorePort {
  private readonly store: JsonlKeyedStore<Line>;

  constructor(
    dir: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.store = new JsonlKeyedStore<Line>(dir, (consumerId) =>
      join(dir, `${consumerId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async load(consumerId: string): Promise<AlertDeliveryRecord> {
    const lines = await this.store.list(consumerId);
    let prefs = DELIVERY_OFF;
    const sent = new Set<string>();
    for (const line of lines) {
      if (line.consumerId !== consumerId) continue;
      if (line.kind === "sent") sent.add(line.fingerprint);
      else prefs = prefsFrom(line) ?? prefs;
    }
    return { prefs, sent: [...sent] };
  }

  savePrefs(consumerId: string, prefs: AlertDeliveryPrefs): Promise<void> {
    return this.store.append(consumerId, {
      kind: "prefs",
      consumerId,
      at: this.now().toISOString(),
      channel: prefs.channel,
      minPriority: prefs.minPriority,
      ...(prefs.destination ? { destination: prefs.destination } : {}),
    });
  }

  recordSent(consumerId: string, fingerprint: string): Promise<void> {
    return this.store.append(consumerId, {
      kind: "sent",
      consumerId,
      at: this.now().toISOString(),
      fingerprint,
    });
  }

  async listMembers(): Promise<readonly string[]> {
    const lines = await this.store.list();
    return [...new Set(lines.filter((line) => line.kind === "prefs").map((l) => l.consumerId))];
  }
}

/** Build the store from the environment (`SKYNET_ALERT_DELIVERY_DIR`, default
 *  `data/alert-delivery`; pin it under `/data` in fly.toml so a deploy cannot erase it). */
export function createAlertDeliveryStore(env: NodeJS.ProcessEnv): AlertDeliveryStorePort {
  return new JsonlAlertDeliveryStore(env.SKYNET_ALERT_DELIVERY_DIR ?? "data/alert-delivery");
}
