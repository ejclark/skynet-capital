import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { fetchJoin } from "../live/join";
import { meetMoneypenny } from "../live/moneypenny";
import { AlpacaGuide } from "../shell/alpaca-guide";
import { PageFrame } from "../shell/frame";
import { STARTING_LINE_LABEL } from "../shell/join-form";

/**
 * JOIN THE BOARD (#738 phase 9c → redesigned 2026-09-02 from the Claude Design canvas "Alpaca
 * onboarding process streamline"; guide revised 2026-09-03): connecting an Alpaca paper account
 * is STEP 1 OF 3 of onboarding — Moneypenny and the first trade are the other two, and this page
 * says so and points at them, without claiming a state it cannot see (the desk verifies fills;
 * feedback is its own ledger). The guide is the same five accordions the Onboarding page embeds
 * (`shell/alpaca-guide.tsx`, one component, two mounts) with the form inside step 5; this route
 * stays as the standalone deep link for "connect an account" — a member already on the board who
 * adds a second one, or an owner adding a bot.
 */

/** Steps 2 and 3 of onboarding — named and linked, never marked done from here. */
function WhatsNext(): ReactElement {
  return (
    <aside className="join-next" aria-label="After you connect">
      <span className="join-next-k">Then</span>
      <button type="button" className="join-next-btn" onClick={() => void meetMoneypenny()}>
        <span className="join-n num" aria-hidden="true">
          2
        </span>
        Meet Moneypenny, and file your first feedback
      </button>
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
        <button
          type="button"
          className="btn btn-primary set-save"
          onClick={() => void meetMoneypenny()}
        >
          Meet Moneypenny ›
        </button>
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
          you connected: create the account, switch to Paper, increase the balance to $1,000,000,
          generate keys, paste them here.
        </p>
      </header>
      {joined ? (
        <Done displayName={joined.displayName} />
      ) : (
        <>
          <div className="join-guide">
            <AlpacaGuide join={join.data} onJoined={setJoined} />
          </div>
          <p className="join-caveat">
            Already on the board and just regenerated your key?{" "}
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
