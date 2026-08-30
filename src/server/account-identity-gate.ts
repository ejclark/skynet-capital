import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import type { Participant } from "../participants/participant.js";
import { createOptionTradeService, type SubmitOptionTrade } from "./option-trade-service.js";
import type { OrderAuditRecord } from "./order-audit-log.js";
import { createTradeService, type SubmitDeskTrade } from "./trade-service.js";

/**
 * THE ACCOUNT-IDENTITY GATE — the ONLY code in this repo allowed to turn a raw
 * broker credential factory into a usable client for a member-initiated trade. This is not a test
 * proving the check currently holds; it is the only place the capability to construct a client
 * exists at all for the desk path. `trade-service.ts` and `option-trade-service.ts` are open
 * (ordinary trading-feature work, community-owned), and neither one HOLDS a raw
 * `clientFactory`/`optionsClientFactory`/`findParticipant` — they receive only a bound
 * `VerifyAccess` closure and can never reach the broker except by calling it. An edit to either
 * open file that wants an unverified client has nowhere to get one; it would have to reintroduce
 * a raw factory field to their deps shape first, which is a visible, deliberate widening of this
 * file's own boundary, not an accidental one-line deletion.
 *
 * Eric, 2026-08-30: "dancing around protected areas is the wrong behavior... if those
 * areas need to change, we change them... the solution is to remove the shit, not spray febreze
 * to mask the smell." This file is that removal: the sensitive capability lives in one place,
 * small enough to review in full on every change, and everything downstream of a successful
 * verification is ordinary, open, buildable logic.
 */

export interface AccountIdentityDeps {
  /** Member-initiated trading is enabled for this deployment. */
  readonly tradingEnabled: boolean;
  /** Resolve a participant (with credentials) by id — the roster plus the self-service store. */
  readonly findParticipant: (id: string) => Participant | undefined;
  readonly clientFactory: TradingClientFactory;
  readonly optionsClientFactory: (participant: Participant) => AlpacaOptionsClient;
}

interface VerifiedAccountAccess {
  readonly participant: Participant;
  readonly client: AlpacaTradingClient;
  readonly optionsClient: AlpacaOptionsClient;
}

export type AccountAccessResult =
  | VerifiedAccountAccess
  | { readonly ok: false; readonly refusals: string[] };

/**
 * The structural gate every desk order passes first, shares and options alike: trading is
 * switched on, the requester IS the target account, and the account exists — answered with
 * that account's live clients (share and options together, so neither desk ever needs its own
 * raw factory access).
 */
export function verifyOwnAccount(
  deps: AccountIdentityDeps,
  participantId: string,
  requesterId: string | undefined,
): AccountAccessResult {
  if (!deps.tradingEnabled) {
    return { ok: false, refusals: ["Trading from the desk is switched off for this deployment."] };
  }
  if (!requesterId || requesterId !== participantId) {
    return { ok: false, refusals: ["You can only trade your own account."] };
  }
  const participant = deps.findParticipant(participantId);
  if (!participant) {
    return { ok: false, refusals: ["That account isn't on the board."] };
  }
  return {
    participant,
    client: deps.clientFactory(participant),
    optionsClient: deps.optionsClientFactory(participant),
  };
}

/** A verified-access lookup, bound to real deps — the only shape `trade-service.ts` and
 *  `option-trade-service.ts` ever see. Holding this closure grants no more than calling
 *  `verifyOwnAccount` directly would; it exists so open code never holds the raw factories. */
export type VerifyAccess = (
  participantId: string,
  requesterId: string | undefined,
) => AccountAccessResult;

export function bindAccountIdentityGate(deps: AccountIdentityDeps): VerifyAccess {
  return (participantId, requesterId) => verifyOwnAccount(deps, participantId, requesterId);
}

export interface ResolveDeskTradingDeps {
  readonly findParticipant: (id: string) => Participant | undefined;
  readonly clientFactory: TradingClientFactory;
  readonly optionsClientFactory: (participant: Participant) => AlpacaOptionsClient;
  /** True when an authenticator is configured for this deployment — the only on/off switch
   *  (Eric's ruling, 2026-08-21, #466): the moment a member's account carries an owner link,
   *  they may trade it, so there is deliberately no separate kill switch. */
  readonly authConfigured: boolean;
  /** Appends the per-order audit line after a successful broker submit. Optional so
   *  offline/test wiring can omit it. */
  readonly recordAudit?: (entry: OrderAuditRecord) => Promise<void>;
  readonly now?: () => Date;
}

/**
 * The composition root: builds the bound `VerifyAccess` closure and wires both desks to it.
 * Lives here, not in `trade-service.ts`, because it is the one place a raw `clientFactory` and
 * a verified-access closure are both in scope at once — keeping that pairing inside the
 * protected file is the whole point of the split.
 */
export function resolveDeskTrading(deps: ResolveDeskTradingDeps): {
  enabled: boolean;
  submit: SubmitDeskTrade;
  submitOption: SubmitOptionTrade;
} {
  const enabled = deps.authConfigured;
  const verifyAccess = bindAccountIdentityGate({
    tradingEnabled: enabled,
    findParticipant: deps.findParticipant,
    clientFactory: deps.clientFactory,
    optionsClientFactory: deps.optionsClientFactory,
  });
  return {
    enabled,
    submit: createTradeService({
      verifyAccess,
      ...(deps.recordAudit ? { recordAudit: deps.recordAudit } : {}),
      ...(deps.now ? { now: deps.now } : {}),
    }),
    submitOption: createOptionTradeService({
      verifyAccess,
      ...(deps.recordAudit ? { recordAudit: deps.recordAudit } : {}),
      ...(deps.now ? { now: deps.now } : {}),
    }),
  };
}
