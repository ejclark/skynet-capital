/**
 * The bots' copy of the members' handed-over convictions (#5482 slice 6c) — the records the app put
 * on the `/controls` wire (`convictions-wire.ts`), kept so every roster build can resolve a pointer
 * at one.
 *
 * A pointer resolves per ACCOUNT (`lookupFor`): a seeded record for any bot, as before; a member's
 * record only on the accounts it names, so one member's view never narrows or stops another
 * member's bot. Every received record is judged by the same store rules a seeded one is
 * (`ConvictionStore`: claims, dated falsifiers, ◆ pairs, narrow never widen), with the seeded
 * records stated first, so a member's record can never take a seeded id. A record refused there is
 * said once and held by no account, and a pair pointing at it runs exits-only (`steeredBy`).
 *
 * A poll that omits the field changes nothing; one that carries it replaces the set whole, so a view
 * taken back stops resolving. A set stamped older than the one held is ignored, so a reordered
 * response or an app rolled back onto an older file never rewinds what the bots steer by.
 */
import type { ConvictionsWire, WiredConviction } from "../autonomous/convictions-wire.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { SEEDED_CONVICTIONS } from "../playbooks/conviction-seeds.js";
import {
  CONVICTIONS,
  type ConvictionLookup,
  ConvictionStore,
} from "../playbooks/conviction-store.js";

export interface ConvictionsHolder {
  accept(wire: ConvictionsWire): void;
  /** Called when a poll changed what resolves — the rosters in force are rebuilt, because a record
   *  can arrive after the subscription that points at it (a restart on the kept snapshot). */
  onChange(listener: () => void): void;
  /** The records a pointer on this account resolves to: the seeded ones, then its own members'. */
  lookupFor(accountId: string): ConvictionLookup;
}

/** The received records the store keeps, by id; each refused one said through `log`. */
function judged(
  records: readonly WiredConviction[],
  log: (line: string) => void,
): ReadonlyMap<string, WiredConviction> {
  const store = new ConvictionStore([...SEEDED_CONVICTIONS, ...records.map((r) => r.conviction)]);
  for (const { id, problems } of store.refused) {
    log(`[playbooks] conviction "${id}" from the dashboard REFUSED — ${problems.join("; ")}`);
  }
  const kept = new Map<string, WiredConviction>();
  for (const record of records) {
    // Identity, not id: on a repeated id the store keeps the first one stated, never this one.
    if (store.get(record.conviction.id) === record.conviction) {
      kept.set(record.conviction.id, record);
    }
  }
  return kept;
}

export function convictionsHolder(log: (line: string) => void = console.error): ConvictionsHolder {
  let held: ReadonlyMap<string, WiredConviction> = new Map();
  let heldJson = "[]";
  let heldAt = 0;
  let changed: () => void = () => undefined;
  return {
    accept: (wire) => {
      if (wire.at < heldAt) return;
      heldAt = wire.at;
      const json = JSON.stringify(wire.records);
      if (json === heldJson) return;
      heldJson = json;
      held = judged(wire.records, log);
      changed();
    },
    onChange: (listener) => {
      changed = listener;
    },
    lookupFor:
      (accountId) =>
      (id): Conviction | undefined => {
        const seeded = CONVICTIONS.get(id);
        if (seeded) return seeded;
        const record = held.get(id);
        return record?.accounts.includes(accountId) ? record.conviction : undefined;
      },
  };
}
