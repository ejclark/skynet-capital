import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { CompanionTurn } from "../companion/companion-chat.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import type { CeremonyChannel } from "../observatory/ceremony-channel.js";
import type { EquitySample } from "../observatory/history-store.js";
import type { AccountAdmin } from "./account-forms.js";
import type { Authenticator } from "./auth/authenticator.js";
import type { ClaimDeps } from "./claim-form.js";
import type { CommunityProgressionService } from "./community-progression-service.js";
import type { CompanionMessageLogEntry } from "./companion-message-log.js";
import type { ControlsDeps } from "./controls-form.js";
import type { FeedbackRouteDeps } from "./feedback-routes.js";
import type { InviteDeps } from "./invite-form.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import type { OpsStatusDeps } from "./ops-status-routes.js";
import type { SubmitOptionTrade } from "./option-trade-service.js";
import type { OrderAuditRecord } from "./order-audit-log.js";
import type {
  AddParticipantInput,
  AddResult,
  RotateCredentialsInput,
  RotateResult,
} from "./participant-service.js";
import type { ProgressionService } from "./progression-service.js";
import type { SubscriptionStore } from "./subscription-store.js";
import type { SubmitDeskTrade } from "./trade-service.js";
import type { WireRouteDeps } from "./wire-routes.js";

/**
 * `FeedbackRouteDeps` and `WireRouteDeps` (each surface's own dependency list) are inherited
 * rather than repeated here — this config object IS what `serveFeedbackRoute`/`serveWireRoute`
 * receive as their deps, so duplicating those fields would drift the definitions apart with no
 * way to catch it.
 */
export interface DashboardServerConfig extends FeedbackRouteDeps, WireRouteDeps {
  readonly hub: ObservatoryHub;
  /**
   * Derived ceremony transitions (`ceremony-channel.ts`). When wired, each one rides the board's
   * seq-numbered patch stream as a fire-once cue, so a celebration can never be delivered twice —
   * not on a reconnect, not on a replay. Omit (offline/tests) and the board simply carries no cues.
   */
  readonly ceremonies?: CeremonyChannel;
  /**
   * Legacy shared-password gate. Used only when `auth` is not configured (localhost/offline).
   * When set, every request must carry ?key=<password>.
   */
  readonly password?: string;
  /**
   * Per-user OAuth login. When present it supersedes `password`: unauthenticated requests are
   * redirected to `/login`, and identity comes from a signed session cookie (no ?key= in URLs).
   */
  readonly auth?: Authenticator;
  /**
   * Self-service onboarding handler. When provided, `GET /add` serves a form and `POST /add`
   * registers a new account. Omit to disable the feature (e.g. offline mode).
   */
  readonly addParticipant?: (input: AddParticipantInput) => Promise<AddResult>;
  /**
   * Self-service credential rotation. When provided, `GET /rotate` serves a compact form and
   * `POST /rotate` swaps an EXISTING account's key/secret in place — the sanctioned path for
   * "I regenerated my Alpaca key," so it never has to be pasted into the wrong slot elsewhere.
   * Omit to disable (e.g. offline mode).
   */
  readonly rotateCredentials?: (input: RotateCredentialsInput) => Promise<RotateResult>;
  /**
   * Day-2 account management (`/account`): profile edits and removal. Omit to disable
   * (offline mode, or no store secret). Authorization rules live in account-service.ts.
   */
  readonly accountAdmin?: AccountAdmin;
  /**
   * `GET/POST /invite` — the owner's guest list. Omit to disable (offline mode, or no auth).
   * Owners are the env-configured identities; everyone they invite lands in the volume-backed
   * allowlist store and may sign in but not invite (see `invite-form.ts`).
   */
  readonly invite?: InviteDeps;
  /**
   * `GET/POST /claim` — the owner's account-link table: attach an account that is already on the
   * board, but carries no owner, to a member's sign-in. Omit to disable (offline mode, or no
   * auth). Owner-gated inside the handler itself, exactly like `/invite`.
   */
  readonly claim?: ClaimDeps;
  /**
   * `GET/POST /u/:id?tab=settings` — Mission Control, the owner's switchboard for the autonomous
   * fleet, served as an account's Settings tab. Omit to disable (offline mode, or no auth).
   * Owner-gated inside the handler itself. The old `/controls` URL redirects here.
   */
  readonly controls?: ControlsDeps;
  /**
   * `GET /ops-status` — the owner's read-only bots/deploy health panel. Omit to disable (offline
   * mode, or no auth) — no separate URL then exists, same as `/invite`/`/claim`. Owner-gated
   * inside the handler itself, exactly like every other owner-only page.
   */
  readonly opsStatus?: OpsStatusDeps;
  /**
   * Reads a participant's recorded equity/realized history for the individual view's performance panel.
   * Omit to leave the panel showing the honest "still accruing" seam (e.g. offline with no store).
   */
  readonly readHistory?: (participantId: string) => Promise<readonly EquitySample[]>;
  /** Re-reads this account from the broker before its desk renders, so the screen shows what Alpaca
   *  holds rather than only what the fill stream delivered. Rate-limited and failure-swallowing
   *  in `createBrokerSync`; omit (offline/tests) and the desk renders live memory as before. */
  readonly refreshParticipant?: (participantId: string) => Promise<void>;
  /**
   * Reads a bot's autonomous decision audit trail for the individual view's decisions panel
   * (Phase 2.1). Omit to show the honest "not recorded yet" seam. Keyed by participant id, which for
   * a bot equals its persona id.
   */
  readonly readDecisions?: (participantId: string) => Promise<readonly DecisionRecord[]>;
  /**
   * Reads a participant's durable trade-activity ledger (`activity-store.ts`) for the history and
   * analysis tabs. Omit to leave those views bounded by the broker's recent-order window — they
   * stay honest about it via the backfill caveat.
   */
  readonly readTradeActivity?: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  /**
   * Reads a participant's per-order audit lines (`order-audit-log.ts`) so the record views can say
   * WHO placed each order, not just how the ledger learned about it (`order-origin.ts`, #782).
   * Omit and every row classifies `unknown` — no marker, exactly today's rendering.
   */
  readonly readOrderAudit?: (participantId: string) => Promise<readonly OrderAuditRecord[]>;
  /**
   * Per-participant progression derived from the fill + audit ledgers — drives the Milestones
   * page and (with training wheels on) the desk's trade-type gate. Omit and `/learn` renders
   * a browsable journey at zero while the desk behaves as wheels-off.
   */
  readonly progression?: ProgressionService;
  /**
   * The community track's progression — the feedback-given milestone, derived from the
   * feedback log, never the trade ladder. Omit and `/feedback` shows the count with no fanfare.
   */
  readonly communityProgression?: CommunityProgressionService;
  /**
   * Member-initiated trading from the desk (`/trade`). On whenever OAuth is configured (Eric's
   * ruling, 2026-08-21, #466: no separate switch) — with it off, the desk still renders its
   * ticket, visibly disabled and honest about why.
   */
  readonly tradingEnabled?: boolean;
  /** The execution seam (`trade-service.ts`). Absent = no order path is wired at all. */
  readonly submitTrade?: SubmitDeskTrade;
  /** The options execution seam (`option-trade-service.ts`), behind the same switch. */
  readonly submitOptionTrade?: SubmitOptionTrade;
  /** Options data (chains/spot) via a participant's own credentials, for the /trade ticket. */
  readonly optionsClientFor?: (participantId: string) => AlpacaOptionsClient | undefined;
  /** Stock order data (Open Orders panel, order cancel) via a participant's own credentials. */
  readonly tradingClientFor?: (participantId: string) => AlpacaTradingClient | undefined;
  /**
   * Resolve the signed-in session's email to the participant it owns (`Participant.ownerEmail`)
   * — the ONLY link a session may trade or self-manage through. Reads the roster + store
   * directly; `ParticipantSnapshot` deliberately omits `ownerEmail` so it's never handed to a
   * browser. Omit when OAuth isn't configured.
   */
  readonly resolveOwnerId?: (email: string) => string | undefined;
  /**
   * Every participant id the session's email owns — the Portfolio index (`/u`) lists these.
   * Same ownership link as `resolveOwnerId`, plural; omit to fall back to that single id.
   */
  readonly resolveOwnerIds?: (email: string) => readonly string[];
  /**
   * True when this email is on the env owner allowlist. Widens the `/rotate` account picker
   * (`dashboard-identity.ts`'s `rotatableAccountOptions`) to every roster account for an owner —
   * matching `participant-service.ts`'s `refuseRotation`, which already lets an owner rotate any
   * host-configured account regardless of `ownerEmail`. Never widens `/account`'s edit/remove
   * picker, whose authorization has no such bypass. Omit when OAuth isn't configured.
   */
  readonly isOwnerEmail?: (email: string) => boolean;
  /**
   * Every host-configured (env-roster) participant id, for the same picker. An owner's OWN
   * account is a roster row too — without this, an owner whose `SKYNET_HUMAN_<ID>_EMAIL` was
   * never set (or points elsewhere) resolves to zero or the wrong owned accounts and the picker
   * never shows the one account they most need (2026-08-27: reported live — the field resolved to
   * an owned bot instead of the reporter's own account, and locked, with no way to pick another).
   */
  readonly rosterIds?: () => ReadonlySet<string>;
  /**
   * The companion chat turn — `undefined` (inert) until `ANTHROPIC_API_KEY` is set, the
   * exact same env var and gate `coachFeedback` uses. `/api/companion*` answers "not switched on
   * yet" honestly when this is absent, same doctrine as every other optional AI-backed lane.
   */
  readonly companion?: CompanionTurn;
  /**
   * The ladder-gate's own evidence (`companion-message-log.ts`) — reads for the member's own
   * opaque id. Used directly by `/api/companion/ack` to check "already recorded" before writing;
   * the progression service reads the same store through its own (participant-id-aware) binding.
   */
  readonly readMessages?: (opaqueMemberId: string) => Promise<readonly CompanionMessageLogEntry[]>;
  /** Record one real message as ladder-gate evidence — called once, on the first message a member
   *  ever sends the rail (`/api/companion/ack`), regardless of how it's routed. */
  readonly recordMessage?: (opaqueMemberId: string) => Promise<void>;
  /**
   * The Playbook Store (issue #885) — an account's own playbook subscriptions and capital
   * sub-allocations. Omit to disable (offline mode) — the catalog still browses, just with no
   * subscribe/unsubscribe action wired.
   */
  readonly subscriptions?: SubscriptionStore;
}
