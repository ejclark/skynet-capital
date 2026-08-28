import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import { fetchJoin, type JoinIndex, type JoinResult, joinRequest } from "../live/join";
import { PageFrame } from "../shell/frame";

/**
 * JOIN THE BOARD (#738 phase 9c) — `/add` in the shell: the five-step Alpaca onboarding, the
 * form, and the class picker for bots. The honesty of the old page carries whole: paper keys
 * only, the league's $1,000,000 starting line stated, keys pasted once and never displayed, and
 * refusals rendered verbatim from the service (a duplicate add points at rotation instead).
 * Ownership is the session's server-side — the form carries no identity field at all.
 */

const STEPS: readonly { readonly title: string; readonly body: ReactElement | string }[] = [
  {
    title: "Create a free Alpaca account",
    body: (
      <>
        Go to{" "}
        <a href="https://alpaca.markets/" target="_blank" rel="noopener noreferrer">
          alpaca.markets
        </a>{" "}
        and sign up — it's free and needs no funding. <b>Paper trading is simulated money</b>, so
        there's nothing to deposit.
      </>
    ),
  },
  {
    title: "Switch to Paper Trading",
    body: (
      <>
        In the Alpaca dashboard, use the toggle near the top-left to switch from <b>Live</b> to{" "}
        <b>Paper</b>. This is important — we only ever use paper keys.
      </>
    ),
  },
  {
    title: "Set your paper balance to $1,000,000",
    body: (
      <>
        Alpaca paper accounts default to $100,000. Everyone in the league starts from the same
        capital, so use the paper dashboard's reset option to set your balance to exactly{" "}
        <b>$1,000,000 USD</b> before generating your keys.
      </>
    ),
  },
  {
    title: "Generate your paper API keys",
    body: (
      <>
        On the paper dashboard's right side, find <b>API Keys</b> and click <b>Generate</b>. Copy
        the <b>Key ID</b> and <b>Secret Key</b> — the secret shows only once, so grab it now.
      </>
    ),
  },
  {
    title: "Paste them below",
    body: "Drop the Key ID and Secret into the form and give yourself a display name. That's it — you'll land on the board.",
  },
];

function Steps(): ReactElement {
  return (
    <div className="join-steps">
      {STEPS.map((step, i) => (
        <details key={step.title} className="join-step" open={i === 0}>
          <summary>
            <span className="join-step-n num">{i + 1}</span> {step.title}
          </summary>
          <div className="join-step-body">{step.body}</div>
        </details>
      ))}
    </div>
  );
}

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

function JoinForm({ data }: { readonly data: JoinIndex }): ReactElement {
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [kind, setKind] = useState<"human" | "bot">("human");
  const [personaId, setPersonaId] = useState("");
  const [timezone, setTimezone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<JoinResult | undefined>();
  const nameId = useId();
  const keyId = useId();
  const secretId = useId();
  const kindId = useId();
  const tzId = useId();
  const ready =
    displayName.trim() !== "" &&
    apiKey.trim() !== "" &&
    apiSecret.trim() !== "" &&
    (kind === "human" || personaId !== "");

  const submit = async () => {
    setBusy(true);
    try {
      setResult(
        await joinRequest({
          displayName: displayName.trim(),
          apiKey,
          apiSecret,
          kind,
          ...(kind === "bot" && personaId ? { personaId } : {}),
          ...(timezone ? { timezone } : {}),
        }),
      );
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setBusy(false);
    }
  };

  if (result?.ok)
    return (
      <div className="join-done">
        <span className="join-done-icon" aria-hidden="true">
          🎉
        </span>
        <h2>You're on the board</h2>
        <p>
          <b>{result.displayName}</b> is now live on the observatory.
        </p>
        <Link className="btn btn-primary set-save" to="/" search={{ by: "equity" }}>
          ← To the standings
        </Link>
      </div>
    );

  return (
    <div className="set-fields join-form">
      <div className="field">
        <label htmlFor={nameId}>Display name</label>
        <input
          id={nameId}
          value={displayName}
          maxLength={60}
          placeholder="e.g. Uncle Joe"
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={keyId}>Alpaca paper API key</label>
        <input
          id={keyId}
          type="password"
          value={apiKey}
          autoComplete="off"
          spellCheck={false}
          placeholder="PK…"
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={secretId}>Alpaca paper API secret</label>
        <input
          id={secretId}
          type="password"
          value={apiSecret}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setApiSecret(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={kindId}>Account type</label>
        <select id={kindId} value={kind} onChange={(e) => setKind(e.target.value as never)}>
          <option value="human">Human — you trade it yourself</option>
          <option value="bot">Bot — a persona trades it autonomously</option>
        </select>
      </div>
      {kind === "bot" ? (
        <ClassPicker data={data} personaId={personaId} onPick={setPersonaId} />
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
      <button
        type="button"
        className="btn btn-primary set-save"
        disabled={!ready || busy}
        onClick={() => void submit()}
      >
        {busy ? "Verifying against Alpaca…" : "Add my account"}
      </button>
      {result && !result.ok ? <p className="set-err">{result.error}</p> : null}
      <p className="note">
        Paper keys only · balance set to $1,000,000 USD · alpaca.markets → Paper Trading → API Keys.
        Already on the board and just regenerated your key?{" "}
        <Link to="/settings">Rotate it in Settings</Link> instead — adding again is refused as a
        duplicate.
      </p>
    </div>
  );
}

function JoinPage(): ReactElement {
  const join = useQuery({ queryKey: ["join"], queryFn: fetchJoin });
  if (join.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the door…</p>
      </PageFrame>
    );
  if (join.isError || !join.data)
    return (
      <PageFrame>
        <p className="note">The join page is unreachable.</p>
      </PageFrame>
    );
  return (
    <PageFrame>
      <header className="page-header">
        <h1>Connect your Alpaca account</h1>
        <p>
          Your account trades on <b>Alpaca</b> paper money. Follow the steps to grab your keys, then
          paste them below — we read them <b>only</b> to show your balance and trades. Nothing is
          ever placed on your behalf.
        </p>
      </header>
      {!join.data.wired ? (
        <p className="note">Joining isn't wired in this deployment.</p>
      ) : (
        <>
          <Steps />
          <JoinForm data={join.data} />
        </>
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/join")({ component: JoinPage });
