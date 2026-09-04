/**
 * Boot-time wiring for the account/desk-trading seam: the Day-2 account service (`/account`
 * edit + remove), the live-roster/`findParticipant`/`clientFor` helpers every downstream
 * wire-up (access, ops-status, broker sync, desk trading) shares, and — a tick later, once
 * `findParticipant` exists — the broker's authoritative slow-sync loop, the per-order audit
 * log, and desk trading itself (`resolveDeskTrading`). Pulled out of `serve-dashboard.ts` to
 * keep that file's own complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate),
 * mirroring `setupAccess` in `dashboard-access.ts`. Two functions, not one, because the file's
 * own access/ops-status wiring sits between them and reads `liveRoster`/`findParticipant`.
 */
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { ActivityEventBus } from "../observatory/activity-event.js";
import { publishingOrderAuditLog } from "../observatory/activity-publishing.js";
import { createBrokerSync } from "../observatory/broker-sync.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../observatory/events.js";
import { mergeRoster, type Participant } from "../participants/participant.js";
import type { ParticipantStore } from "../participants/participant-store.js";
import { resolveDeskTrading } from "../server/account-identity-gate.js";
import { createAccountService } from "../server/account-service.js";
import type { ObservatoryHub } from "../server/observatory-hub.js";
import { createOrderAuditLog, type OrderAuditLog } from "../server/order-audit-log.js";

export interface AccountDeskAccessDeps {
  readonly hub: ObservatoryHub;
  readonly store: ParticipantStore;
  readonly envRoster: readonly Participant[];
  readonly owners: ReadonlySet<string>;
  readonly clientFactory: TradingClientFactory;
  readonly stopParticipantStream: (id: string) => void;
}

export interface AccountDeskAccess {
  readonly accounts: ReturnType<typeof createAccountService>;
  /** Env roster merged with the store, read fresh on every call — never cached, so a runtime
   *  add/rotate takes effect on the next read, not the next restart. */
  readonly liveRoster: () => readonly Participant[];
  readonly findParticipant: (id: string) => Participant | undefined;
  /** A per-account broker client, or undefined for an id that isn't on the live roster. */
  readonly clientFor: <T>(id: string, make: (p: Participant) => T) => T | undefined;
}

/**
 * Day-2 account management (/account): profile edits + removal for self-service accounts. Host
 * -configured roster accounts are off-limits here — including a rotation's store row under a
 * roster id — so the same tier /rotate enforces is enforced on edit/remove too. Also resolves
 * the live-roster helpers desk trading is on whenever OAuth is configured — no separate kill
 * switch. Resolved through the LIVE merge (not the boot-time roster) so a credential rotated at
 * runtime takes effect on the next order, not the next restart.
 */
export function wireAccountDeskAccess(deps: AccountDeskAccessDeps): AccountDeskAccess {
  const accounts = createAccountService({
    hub: deps.hub,
    store: deps.store,
    clientFactory: deps.clientFactory,
    stopStream: deps.stopParticipantStream,
    findRosterParticipant: (id) => deps.envRoster.find((p) => p.id === id),
    isOwnerEmail: (email) => deps.owners.has(email.toLowerCase()),
  });

  const liveRoster = () => mergeRoster(deps.envRoster, deps.store.load());
  const findParticipant = (id: string) => liveRoster().find((p) => p.id === id);
  const clientFor = <T>(id: string, make: (p: Participant) => T): T | undefined => {
    const participant = findParticipant(id);
    return participant ? make(participant) : undefined;
  };

  return { accounts, liveRoster, findParticipant, clientFor };
}

export interface DeskTradingDeps {
  readonly env: NodeJS.ProcessEnv;
  readonly hub: ObservatoryHub;
  /** Where a reconciled snapshot goes; the hub's `apply`. */
  readonly apply: (event: ObservatoryEvent) => void;
  readonly findParticipant: (id: string) => Participant | undefined;
  readonly clientFactory: TradingClientFactory;
  readonly optionsClientFactory: (participant: Participant) => AlpacaOptionsClient;
  /** True when an authenticator is configured for this deployment — desk trading's only on/off
   *  switch (Eric's ruling, 2026-08-21, #466). */
  readonly authConfigured: boolean;
  readonly activityEventBus: ActivityEventBus;
}

export interface DeskTradingWiring {
  readonly brokerSync: ReturnType<typeof createBrokerSync>;
  readonly orderAudit: OrderAuditLog;
  readonly desk: ReturnType<typeof resolveDeskTrading>;
}

/**
 * The broker's last word: the fill stream is the fast path, this starts the authoritative slow
 * one that repairs whatever it missed — a socket gap, a restart, an order placed outside this
 * app. Reads the LIVE roster (via `findParticipant`), so a runtime-added or rotated account is
 * covered too. Also builds the per-order audit log and resolves desk trading against it.
 */
export function wireDeskTrading(deps: DeskTradingDeps): DeskTradingWiring {
  const brokerSync = createBrokerSync({
    getState: () => deps.hub.getState(),
    apply: deps.apply,
    findParticipant: deps.findParticipant,
    clientFactory: deps.clientFactory,
  });
  brokerSync.start();

  const orderAudit = publishingOrderAuditLog(createOrderAuditLog(deps.env), deps.activityEventBus);
  const desk = resolveDeskTrading({
    findParticipant: deps.findParticipant,
    clientFactory: deps.clientFactory,
    optionsClientFactory: deps.optionsClientFactory,
    authConfigured: deps.authConfigured,
    recordAudit: (entry) => orderAudit.record(entry),
  });

  return { brokerSync, orderAudit, desk };
}
