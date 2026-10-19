import { fetchJson } from "../http/fetch-json.js";
import { isRecord } from "../storage/parse-guards.js";
import { type AuthoredPlaysWire, parseAuthoredPlaysWire } from "./authored-plays-wire.js";
import { parseShadowOrders, type ShadowOrders } from "./authored-shadow-wire.js";
import {
  CONTROLS_BRIDGE_PATH,
  type ControlsState,
  EMPTY_CONTROLS,
  parseControlsState,
  suspendedReason,
} from "./bot-controls.js";
import {
  controlsPollGateHeaders,
  controlsPollHeaders,
  type PersonaGateVerdict,
} from "./controls-poll-wire.js";
import { type ConvictionsWire, parseConvictionsWire } from "./convictions-wire.js";
import { parseDecisionsCursor } from "./decision-wire.js";
import { controlsPollRosterHeaders, type HouseRosterReport } from "./house-roster-wire.js";
import {
  BRIDGE_REQUEST_TIMEOUT_MS,
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "./insight-record.js";
import { parseSubscriptionsSnapshot, type SubscriptionsSnapshot } from "./subscriptions-wire.js";

/**
 * The `bots` process's view of the owner's Mission Control (`/controls` on the internal bridge —
 * same origin as the insight relay, `SKYNET_INSIGHTS_BRIDGE_URL`, so prod needs zero new config).
 *
 * Failure semantics are deliberate and **fail-open to last-known**: an unreachable bridge keeps
 * the last snapshot (or, before any fetch succeeds, the empty state = env defaults). A network
 * blip must never suspend the fleet by accident — the halt file and the circuit breakers remain
 * the hard stops; this client is the owner's convenience channel, not the safety system.
 */
export interface BotControlsClient {
  /** One blocking fetch (bounded) — used at boot to apply mode/hardcore overrides. */
  fetchOnce(): Promise<ControlsState | null>;
  /** Begin background polling (unref'd). Safe to call when disabled (no-op). */
  start(): void;
  stop(): void;
  /** The dynamic check for the `blockedReason` seam. Non-null = do not trade this bot. */
  suspendedReason(botId: string): string | null;
  /** The owner's stored forced-pick count for this bot, as of the last poll (#4535 slice 2b);
   *  undefined = none stored, so the env count stands. Read at every scout scan, never cached. */
  betaPicks(botId: string): number | undefined;
  /** The owner's stored after-close staging flag for this bot, as of the last poll (#4535 slice
   *  4b); undefined = none stored, so the env's `+stage` stands. Read at every staging pass. */
  betaStage(botId: string): boolean | undefined;
  /**
   * Records one persona's boot-time readiness-gate verdict (#666) — merged by id and reported on
   * every subsequent poll, so the ops-status panel can show which personas are live vs pinned to
   * `observe`, and why, with no Fly credential. Safe to call before `start()`; a no-op on the
   * disabled client. `buildLiveBot` calls this once per bot as it wires each one.
   */
  reportPersonaGate(verdict: PersonaGateVerdict): void;
  /**
   * Records this boot's `SKYNET_PLAYBOOKS` house roster and the bot accounts it runs on, reported
   * on every subsequent poll so the dashboard can seed each house bot's own subscriptions from it
   * (#4535 slice 1b, `house-roster-wire.ts`). Same shape as `reportPersonaGate`: safe before
   * `start()`, a no-op on the disabled client, latest call wins.
   */
  reportHouseRoster(report: HouseRosterReport): void;
  /** True when a bridge URL is configured (used only for honest boot logging). */
  readonly enabled: boolean;
}

const POLL_MS = 30_000;

/** Parse one field of a poll body and hand it to its hook when it parsed. A hook that throws never
 *  fails the poll it rides on, nor the hooks after it. `unreadable` hears a field that was sent but
 *  did not parse, where keeping the last value quietly would hide that it is going stale. */
function relay<T>(
  body: unknown,
  field: string,
  parse: (raw: unknown) => T | undefined,
  hook: ((value: T) => void) | undefined,
  unreadable?: () => void,
): void {
  try {
    const raw = isRecord(body) ? body[field] : undefined;
    const value = parse(raw);
    if (value !== undefined) hook?.(value);
    else if (raw !== undefined) unreadable?.();
  } catch {
    /* never let a downstream hook fail the poll it rides on */
  }
}

const DISABLED_CLIENT: BotControlsClient = {
  fetchOnce: async () => null,
  start: () => undefined,
  stop: () => undefined,
  suspendedReason: () => null,
  betaPicks: () => undefined,
  betaStage: () => undefined,
  reportPersonaGate: () => undefined,
  reportHouseRoster: () => undefined,
  enabled: false,
};

export function resolveBotControls(
  env: NodeJS.ProcessEnv = process.env,
  /** Fires after every AUTHENTICATED poll that returns a parsed state — the credential-sync
   *  client's hook (`bot-credentials-client.ts`), so a rotation reaches the running process within
   *  one poll interval without this file needing to know that client exists. */
  onFetched?: (state: ControlsState) => void,
  /** Fires after every AUTHENTICATED poll, regardless of whether the body parsed as a valid
   *  `ControlsState` — the decision-replication client's hook (`decision-replication-client.ts`).
   *  The cursor is parsed from the RAW body, not from `ControlsState`, because it isn't part of
   *  that persisted shape (`decision-wire.ts`'s module doc). Absent/malformed parses to `{}`. */
  onDecisionsCursor?: (cursor: Readonly<Record<string, number>>) => void,
  /** Fires after every AUTHENTICATED poll whose body carried a well-formed Playbook Store snapshot
   *  — the subscription-swap hook (`subscription-sync.ts`, issue #3595). Parsed from the RAW body
   *  for the same reason the cursor above is: it is not part of the persisted `ControlsState`
   *  shape. An app build that predates the field, or a payload that fails
   *  `parseSubscriptionsSnapshot`, simply never fires this — which leaves the fleet on the last
   *  roster it received, never on a partial one. */
  onSubscriptions?: (snapshot: SubscriptionsSnapshot) => void,
  /** Fires after every AUTHENTICATED poll whose body carried a well-formed set of shadow tests
   *  (`authored-shadow-wire.ts`, #5457 slice 2) — the whole set every time, so a play taken out of
   *  its test simply stops appearing. Parsed from the RAW body like the two above. An app that
   *  predates the field never fires this, and the bots keep the tests they have. */
  onAuthoredShadow?: (orders: ShadowOrders) => void,
  /** Fires after every AUTHENTICATED poll whose body carried a well-formed set of PROMOTED plays
   *  (`authored-plays-wire.ts`, #5457 slice 3) — specs only, whole every time. It fires BEFORE the
   *  subscriptions hook on the same poll, so a roster the subscription swap builds already sees
   *  the plays. An app that predates the field never fires this. */
  onAuthoredPlays?: (wire: AuthoredPlaysWire) => void,
  /** Fires after every AUTHENTICATED poll whose body carried a well-formed set of the members'
   *  handed-over convictions (`convictions-wire.ts`, #5482 slice 6c) — records only, whole every
   *  time. It fires BEFORE the subscriptions hook on the same poll, so a roster the subscription
   *  swap builds already resolves a pointer at one. An app that predates the field never fires it. */
  onConvictions?: (wire: ConvictionsWire) => void,
  /** The per-fetch budget; prod always takes the shared `BRIDGE_REQUEST_TIMEOUT_MS`. A spec that
   *  runs the bridge on the same event loop as a loaded full suite passes a generous one, so a
   *  starved loop is not mistaken for an unreachable bridge (#4978). */
  options: { readonly timeoutMs?: number } = {},
): BotControlsClient {
  const url = env.SKYNET_INSIGHTS_BRIDGE_URL;
  if (!url) return DISABLED_CLIENT;
  const endpoint = `${url.replace(/\/+$/, "")}${CONTROLS_BRIDGE_PATH}`;
  const timeoutMs = options.timeoutMs ?? BRIDGE_REQUEST_TIMEOUT_MS;
  // This process's own word about which commit it is running, stamped onto every poll so the
  // owner's ops-status panel can answer "on what commit?" without a Fly credential (#666).
  const selfReport = controlsPollHeaders(env.GIT_SHA);
  // Filled in by `reportPersonaGate` as `buildLiveBot` wires each bot; read fresh on every poll
  // (not captured once like `selfReport`) since it only settles after boot has built the roster.
  const gateVerdicts = new Map<string, PersonaGateVerdict>();
  let houseRoster: HouseRosterReport | undefined;

  let snapshot: ControlsState = EMPTY_CONTROLS;
  let timer: ReturnType<typeof setInterval> | undefined;

  const fetchOnce = async (): Promise<ControlsState | null> => {
    try {
      const controller = new AbortController();
      const abort = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchJson(
          "GET",
          endpoint,
          {
            [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET,
            ...selfReport,
            ...controlsPollGateHeaders(
              gateVerdicts.size > 0 ? [...gateVerdicts.values()] : undefined,
            ),
            ...controlsPollRosterHeaders(houseRoster),
          },
          undefined,
          controller.signal,
        );
        if (response.status < 200 || response.status >= 300) return null;
        const parsed = parseControlsState(response.body);
        if (parsed) {
          snapshot = parsed;
          try {
            onFetched?.(parsed);
          } catch {
            /* never let a downstream hook fail the poll it rides on */
          }
        }
        // Each additive field, parsed from the RAW body and relayed to its hook. The order is load-
        // bearing: convictions and plays land before the subscriptions whose rosters resolve them.
        const body = response.body;
        relay(body, "decisionsCursor", parseDecisionsCursor, onDecisionsCursor);
        relay(body, "convictions", parseConvictionsWire, onConvictions, () =>
          process.emitWarning(
            "[playbooks] the dashboard's members' convictions did not read whole — the bots keep steering by the last set they read",
          ),
        );
        relay(body, "authoredPlays", parseAuthoredPlaysWire, onAuthoredPlays);
        relay(body, "subscriptions", parseSubscriptionsSnapshot, onSubscriptions);
        relay(body, "authoredShadow", parseShadowOrders, onAuthoredShadow);
        return parsed;
      } finally {
        clearTimeout(abort);
      }
    } catch {
      return null; // unreachable bridge = keep last-known; never throw into the trade loop
    }
  };

  return {
    enabled: true,
    fetchOnce,
    start: () => {
      if (timer) return;
      timer = setInterval(() => void fetchOnce(), POLL_MS);
      if (typeof timer.unref === "function") timer.unref();
    },
    stop: () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    },
    suspendedReason: (botId) => suspendedReason(snapshot, botId),
    betaPicks: (botId) => snapshot.bots[botId]?.betaPicks,
    betaStage: (botId) => snapshot.bots[botId]?.betaStage,
    reportPersonaGate: (verdict) => {
      gateVerdicts.set(verdict.id, verdict);
    },
    reportHouseRoster: (report) => {
      houseRoster = report;
    },
  };
}
