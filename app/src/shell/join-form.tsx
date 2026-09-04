import type { ReactElement } from "react";
import { useId, useState } from "react";
import { type JoinIndex, type JoinInput, type JoinResult, joinRequest } from "../live/join";

/**
 * CONNECT YOUR ALPACA PAPER ACCOUNT — the form half of `/join`, redesigned from the Claude Design
 * canvas "Alpaca onboarding process streamline" (2026-09-02). Three things changed from phase 9c:
 *
 *  - **Pre-checks name the mistake before the network does.** A live key (no `PK` prefix), a
 *    secret too short to be the real one, a missing name — each gets the sentence that fixes it,
 *    and the request is never sent. The server re-checks every one (`onboarding-gates.ts`).
 *  - **The balance check is a state, not an error line.** A valid key on a paper account that is
 *    not at the league's $1,000,000 starting line comes back `reason: "balance"` with the figure
 *    found; the form renders the three-step reset walkthrough and a "start over" that clears the
 *    keys, because the remedy is a new account and a new pair, not a retry.
 *  - **The account-type picker is an operator control.** It renders for owners (and with no auth
 *    at all); a member joining sees one path — their own human account, with no hint that bots
 *    exist (they open to members in Season 2). Rendering only: the server decides who is an
 *    admin (`join-api-routes.ts`'s `canAddBots`), never this form.
 *
 *  Field wording follows the 2026-09-03 handoff: "key" and "secret", never "Key ID" / "Secret
 *  Key"; the key field stays readable (Alpaca shows it any time — only the secret is shown once).
 *
 * Honesty carried whole: paper keys only, keys pasted once and never displayed, refusals rendered
 * verbatim from the service, ownership stamped from the session — the form carries no identity.
 */

export const STARTING_LINE_LABEL = "$1,000,000.00";

/** The one shape check that tells a paper key from a live one — Alpaca paper ids start `PK`. */
const PAPER_KEY_PREFIX = /^PK/i;
/** A real Alpaca secret is ~40 characters; anything this short is a paste that missed. */
const MIN_SECRET_LENGTH = 8;

export const PRECHECK_COPY = {
  name: "Give yourself a display name — it's how you appear on the board.",
  liveKey:
    "That looks like a live key. We only accept paper keys — they start with PK. Flip the Alpaca dashboard to Paper (step 2) and generate a fresh pair.",
  shortSecret:
    "That secret looks too short — copy the full secret Alpaca shows when you generate the key (it's shown only once).",
  noClass: "Pick the class your bot runs.",
} as const;

/** The design's status line while the server runs the three checks, in order. */
export const CHECKING_LINE = "validate_keys · read_account · assert_balance $1,000,000";

interface Draft {
  readonly displayName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly kind: "human" | "bot";
  readonly personaId: string;
}

/** The client-side gate: the first sentence that applies, or undefined when the draft may go. */
export function precheck(draft: Draft): string | undefined {
  if (!draft.displayName.trim()) return PRECHECK_COPY.name;
  if (!PAPER_KEY_PREFIX.test(draft.apiKey.trim())) return PRECHECK_COPY.liveKey;
  if (draft.apiSecret.trim().length < MIN_SECRET_LENGTH) return PRECHECK_COPY.shortSecret;
  if (draft.kind === "bot" && !draft.personaId) return PRECHECK_COPY.noClass;
  return undefined;
}

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ClassPicker({
  data,
  personaId,
  onPick,
}: {
  readonly data: JoinIndex;
  readonly personaId: string;
  readonly onPick: (id: string) => void;
}): ReactElement {
  return (
    <fieldset className="join-classes">
      <legend>
        Choose a class <small>— the persona your bot runs</small>
      </legend>
      <div className="join-class-grid">
        {data.classes.map((c) => (
          <label key={c.id} className={`join-class${personaId === c.id ? " sel" : ""}`}>
            <input
              type="radio"
              name="personaId"
              checked={personaId === c.id}
              onChange={() => onPick(c.id)}
            />
            <span className="join-class-name">{c.name}</span>
            <span className="join-class-id num">{c.id}</span>
            <span className="join-class-thesis">{c.thesis}</span>
            {c.legend ? <span className="join-class-legend">{c.legend}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** The reset walkthrough for a paper account off the starting line — the remedy is a fresh pair. */
function BalanceStop({
  found,
  onStartOver,
}: {
  readonly found: number | undefined;
  readonly onStartOver: () => void;
}): ReactElement {
  return (
    <div className="join-stop" role="alert">
      <p>
        <b>Balance check failed.</b> Your paper account reports{" "}
        <b className="num">{found === undefined ? "a different balance" : usd(found)}</b> — the
        league requires exactly <b className="num">{STARTING_LINE_LABEL}</b> so everyone starts from
        the same capital. To fix it:
      </p>
      <ol className="join-stop-steps">
        <li>In the Alpaca paper dashboard, delete this paper account.</li>
        <li>
          Create a fresh one and set the balance to $1,000,000 <b>before</b> generating keys (step 3
          above).
        </li>
        <li>Generate new keys and paste them here again.</li>
      </ol>
      <button type="button" className="btn" onClick={onStartOver}>
        Start over with new keys
      </button>
    </div>
  );
}

export function JoinForm({
  data,
  onJoined,
  request = joinRequest,
}: {
  readonly data: JoinIndex;
  /** Fires once the server has stored the account — the page owns what to show next. */
  readonly onJoined: (result: { readonly id: string; readonly displayName: string }) => void;
  /** Injected for tests; defaults to the live `/api/join` POST. */
  readonly request?: (input: JoinInput) => Promise<JoinResult>;
}): ReactElement {
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [kind, setKind] = useState<"human" | "bot">("human");
  const [personaId, setPersonaId] = useState("");
  const [timezone, setTimezone] = useState("");
  const [busy, setBusy] = useState(false);
  const [stop, setStop] = useState<string | undefined>();
  const [balance, setBalance] = useState<{ readonly found?: number } | undefined>();
  const nameId = useId();
  const keyId = useId();
  const secretId = useId();
  const kindId = useId();
  const tzId = useId();

  const clearStops = () => {
    setStop(undefined);
    setBalance(undefined);
  };

  const submit = async () => {
    const refusal = precheck({ displayName, apiKey, apiSecret, kind, personaId });
    if (refusal) {
      setStop(refusal);
      return;
    }
    clearStops();
    setBusy(true);
    try {
      const result = await request({
        displayName: displayName.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        kind,
        ...(kind === "bot" && personaId ? { personaId } : {}),
        ...(timezone ? { timezone } : {}),
      });
      if (result.ok) onJoined({ id: result.id, displayName: result.displayName });
      else if (result.reason === "balance") setBalance({ found: result.found });
      else setStop(result.error);
    } catch (error) {
      setStop(String(error));
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => {
    setApiKey("");
    setApiSecret("");
    clearStops();
  };

  return (
    <div className="set-fields join-form">
      <div className="join-grid">
        <div className="field">
          <label htmlFor={nameId}>
            Display name <small>— what you want people to see</small>
          </label>
          <input
            id={nameId}
            value={displayName}
            maxLength={60}
            placeholder="e.g. Uncle Joe"
            onChange={(e) => {
              setDisplayName(e.target.value);
              setStop(undefined);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={keyId}>Alpaca paper account: key</label>
          <input
            id={keyId}
            className="num"
            value={apiKey}
            autoComplete="off"
            spellCheck={false}
            placeholder="Key"
            onChange={(e) => {
              setApiKey(e.target.value);
              clearStops();
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={secretId}>Alpaca paper account: secret</label>
          <input
            id={secretId}
            className="num"
            type="password"
            value={apiSecret}
            autoComplete="off"
            spellCheck={false}
            placeholder="••••••••••••"
            onChange={(e) => {
              setApiSecret(e.target.value);
              clearStops();
            }}
          />
        </div>
        {data.canAddBots ? (
          <div className="field">
            <label htmlFor={kindId}>
              Account type <small className="join-owner-tag">ADMIN</small>
            </label>
            <select id={kindId} value={kind} onChange={(e) => setKind(e.target.value as never)}>
              <option value="human">Human (manual trading)</option>
              <option value="bot">Bot — a persona trades it</option>
            </select>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor={tzId}>
            Time zone <small>(optional)</small>
          </label>
          <select id={tzId} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="">No preference — show UTC-relative</option>
            {data.timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {kind === "bot" && data.canAddBots ? (
        <ClassPicker data={data} personaId={personaId} onPick={setPersonaId} />
      ) : null}
      {stop ? (
        <p className="join-stop" role="alert">
          {stop}
        </p>
      ) : null}
      {balance ? <BalanceStop found={balance.found} onStartOver={startOver} /> : null}
      <div className="join-actions">
        <button
          type="button"
          className="btn btn-primary set-save"
          disabled={busy}
          onClick={() => void submit()}
        >
          {busy ? "Checking…" : "Add my account"}
        </button>
        {busy ? <span className="join-checking num">{CHECKING_LINE}</span> : null}
      </div>
    </div>
  );
}
