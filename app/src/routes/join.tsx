import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { fetchJoin } from "../live/join";
import { PageFrame } from "../shell/frame";
import { JoinForm, STARTING_LINE_LABEL } from "../shell/join-form";

/**
 * JOIN THE BOARD (#738 phase 9c → redesigned 2026-09-02 from the Claude Design canvas "Alpaca
 * onboarding process streamline"): connecting an Alpaca paper account is STEP 1 OF 3 of
 * onboarding — Moneypenny and the first trade are the other two, and this page says so and points
 * at them, without claiming a state it cannot see (the desk verifies fills; feedback is its own
 * ledger). The five guide steps are flat cards now, all visible at once: a member on this page is
 * doing them in order, and an accordion hid the $1,000,000 reset — the one step Alpaca's defaults
 * get wrong for them. The form itself is `shell/join-form.tsx`.
 */

const GUIDE: readonly { readonly title: string; readonly body: ReactElement | string }[] = [
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
    body: "Drop the Key ID and Secret into the form and give yourself a display name. We verify the keys and the $1,000,000 balance, and you land on the board.",
  },
];

function Guide(): ReactElement {
  return (
    <ol className="join-guide" aria-label="Five steps to connect">
      {GUIDE.map((step, i) => (
        <li key={step.title} className="join-guide-step">
          <span className="join-n num" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <div className="join-guide-title">{step.title}</div>
            <div className="join-guide-body">{step.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Steps 2 and 3 of onboarding — named and linked, never marked done from here. */
function WhatsNext(): ReactElement {
  return (
    <aside className="join-next" aria-label="After you connect">
      <span className="join-next-k">Then</span>
      <Link to="/feedback">
        <span className="join-n num" aria-hidden="true">
          2
        </span>
        Meet Moneypenny — file your first feedback
      </Link>
      <Link to="/trade">
        <span className="join-n num" aria-hidden="true">
          3
        </span>
        Make your first trade on the desk
      </Link>
    </aside>
  );
}

function Done({ displayName }: { readonly displayName: string }): ReactElement {
  return (
    <div className="join-done">
      <span className="status status-live">
        <span className="status-dot" />
        PAPER · LIVE
      </span>
      <h2>You're on the board</h2>
      <p>
        <b>{displayName}</b> is live on the observatory at {STARTING_LINE_LABEL}. Two steps of
        onboarding remain.
      </p>
      <div className="join-done-actions">
        <Link className="btn btn-primary set-save" to="/feedback">
          Meet Moneypenny ›
        </Link>
        <Link className="btn set-save" to="/" search={{ by: "equity" }}>
          To the accounts board
        </Link>
      </div>
    </div>
  );
}

function JoinPage(): ReactElement {
  const join = useQuery({ queryKey: ["join"], queryFn: fetchJoin });
  const [joined, setJoined] = useState<{ readonly displayName: string } | undefined>();
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
        <div className="join-eyebrow">
          <Link to="/onboarding">Onboarding</Link> · step 1 of 3
        </div>
        <h1>Connect your Alpaca paper account</h1>
        <p>
          Skynet Capital is a league for learning to trade — for real, without real losses. You
          trade the live market through an Alpaca <b>paper</b> account, climb a ladder from stocks
          to options one fill at a time, and earn your rank on the leaderboard. Five short steps get
          you connected: create the account, switch to Paper, set the balance to $1,000,000,
          generate keys, paste them here.
        </p>
      </header>
      {!join.data.wired ? (
        <p className="note">Joining isn't wired in this deployment.</p>
      ) : joined ? (
        <Done displayName={joined.displayName} />
      ) : (
        <>
          <Guide />
          <JoinForm data={join.data} onJoined={setJoined} />
          <p className="join-caveat">
            Paper keys only · balance verified at {STARTING_LINE_LABEL} USD · alpaca.markets → Paper
            Trading → API Keys. Keys are checked with read-only calls, then stored encrypted; a
            human account only ever places the orders you submit from the desk yourself. Already on
            the board and just regenerated your key?{" "}
            <Link to="/settings">Rotate it in Settings</Link> instead — adding again is refused as a
            duplicate.
          </p>
          <WhatsNext />
        </>
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/join")({ component: JoinPage });
