/**
 * The bots' copy of the members' promoted plays (#5457 slice 3) — the specs the app put on the
 * `/controls` wire (`authored-plays-wire.ts`), kept so every roster build can compile them.
 *
 * It holds specs and nothing else: a spec trades only when its author's bot also holds a
 * subscription to it (`subscriptionRoster`), and `authoredRoster` compiles for ONE account, skipping
 * every spec that account did not author. A poll that omits the field changes nothing; one that
 * carries it replaces the set whole, so a play the app stopped listing stops compiling.
 */
import type { AuthoredPlaysWire } from "../autonomous/authored-plays-wire.js";
import {
  type AuthoredPlaySpec,
  type AuthoredRoster,
  authoredRoster,
} from "../playbooks/authored-play.js";

export interface AuthoredPlaysHolder {
  accept(wire: AuthoredPlaysWire): void;
  /** Called when a poll changed the set — the rosters in force are rebuilt, because a play can
   *  arrive after the subscription that names it (a restart on the kept snapshot). */
  onChange(listener: () => void): void;
  /** This account's own compiled plays (never another author's). */
  rosterFor(accountId: string): AuthoredRoster;
}

export function authoredPlaysHolder(): AuthoredPlaysHolder {
  let specs: readonly AuthoredPlaySpec[] = [];
  let changed: () => void = () => undefined;
  return {
    accept: (wire) => {
      const moved = JSON.stringify(wire.plays) !== JSON.stringify(specs);
      specs = wire.plays;
      if (moved) changed();
    },
    onChange: (listener) => {
      changed = listener;
    },
    rosterFor: (accountId) => authoredRoster(specs, accountId),
  };
}
