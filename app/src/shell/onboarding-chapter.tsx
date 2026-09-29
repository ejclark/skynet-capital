import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { fetchJoin } from "../live/join";
import { localSessionSuffix } from "../live/market-hours";
import { meetMoneypenny } from "../live/moneypenny";
import { fetchOnboarding, type Onboarding, type OnboardingStep } from "../live/onboarding";
import { AlpacaGuide } from "./alpaca-guide";
import { MilestonePanel } from "./milestone-panel";

/**
 * MILESTONE M·01 — ONBOARDING (#1119, from the Claude Design canvas "Alpaca onboarding process
 * streamline"; revised by the 2026-09-03 handoff "Streamlined Onboarding, Milestones & Moneypenny
 * Chat Rail"), a chapter of the Profile page's Milestones section since #3807 slice 2b — moved
 * from the retired `/onboarding` route as it was. Three steps between a new member and their first
 * trade, each marked done by the server's reading of a ledger (`/api/onboarding`) — never by
 * anything this chapter decides:
 *
 *   1. connect Alpaca — the five-step guide as progressive-disclosure accordions, the connect
 *      form inside step 5 (`alpaca-guide.tsx`), while the viewer has no linked human account
 *   2. meet Moneypenny — opens her rail with the intro; her first reply is the step (the
 *      engagement track's own milestone; a filed issue is a separate, harder achievement)
 *   3. make the first trade — rung 101 on the desk, with the session hours in the viewer's zone
 *
 * Step 2's button is the one way into her intro — the old `?moneypenny=intro` deep link had no
 * producer and was retired (#3816 slice 8). This chapter is the task checklist only —
 * account figures live on the Overview, and ladder/playbook progress on the other two chapters
 * (Eric, 2026-09-17).
 * @category onboarding
 */

function StepGlyph({ done, active }: { readonly done: boolean; readonly active: boolean }) {
  return (
    <span
      className={`ob-glyph${done ? " ob-done" : active ? " ob-active" : ""}`}
      aria-hidden="true"
    >
      {done ? "✓" : "○"}
    </span>
  );
}

/** The step's call to action — the rail or the desk, or nothing once done. */
function StepAction({ step }: { readonly step: OnboardingStep }): ReactElement | null {
  if (step.done) return null;
  if (step.id === "first-message")
    return (
      <button type="button" className="btn" onClick={() => void meetMoneypenny()}>
        Meet Moneypenny ›
      </button>
    );
  if (step.id === "first-trade")
    return (
      <Link className="btn btn-primary" to="/trade" search={{ play: "101" }}>
        Open Trade ›
      </Link>
    );
  return null;
}

/** Step 3's note carries the session window in the viewer's own zone after "4:00 PM ET". */
function stepDetail(step: OnboardingStep): string {
  return step.id === "first-trade"
    ? step.detail.replace("4:00 PM ET", `4:00 PM ET${localSessionSuffix()}`)
    : step.detail;
}

/**
 * NOT CONNECTED YET — the two exits a sign-in with no linked account has (moved here from the old
 * standings board's "Not connected" banner, #3816 slice 7). Brand new is the guide below; but an
 * account can already be on the leaderboard, syncing, with nothing tying it to this sign-in. The
 * old vague copy walked that member into a duplicate add and a key regeneration that revoked their
 * working pair (2026-08-25), so the don'ts are said out loud. The old fix pointed at a Rotate link a
 * member with no account can't reach — so the one exit named is the league owner, who links a
 * sign-in to an account without any keys.
 */
function AlreadyOnTheBoard(): ReactElement {
  return (
    <p className="ob-step-detail ob-step-warn">
      <b>Already see your account on the leaderboard?</b> It's there and syncing, but nothing ties
      it to this sign-in yet. Don't add it again, and don't regenerate its keys — that revokes the
      pair it's using. Ask the league owner to link your sign-in to it; no keys involved. Already
      regenerated them? Tell the league owner that too.
    </p>
  );
}

function ConnectStep({
  step,
  data,
  onJoined,
}: {
  readonly step: OnboardingStep;
  readonly data: Onboarding;
  readonly onJoined: () => void;
}): ReactElement {
  // Open by default while there's nothing connected; an admin can reopen it afterwards to add
  // another account (a bot) — the form's one home is here (Eric, 2026-09-03), not a join page.
  const [open, setOpen] = useState(!step.done);
  const join = useQuery({ queryKey: ["join"], queryFn: fetchJoin });
  const canReopen = step.done && join.data?.canAddBots === true;
  return (
    <li className={`ob-step${step.done ? " ob-step-done" : ""}`}>
      <div className="ob-step-head">
        <StepGlyph done={step.done} active={!step.done} />
        <div className="ob-step-body">
          <div className="ob-step-title">{step.title}</div>
          <div className="ob-step-detail">{step.detail}</div>
          {step.done ? null : <AlreadyOnTheBoard />}
        </div>
        {step.done && data.account ? (
          <span className="status status-live">
            <span className="status-dot" />
            PAPER · LIVE
          </span>
        ) : null}
        {!step.done || canReopen ? (
          <button type="button" className="btn" onClick={() => setOpen(!open)}>
            {open ? "Hide steps" : step.done ? "Add another account ›" : "Set up ›"}
          </button>
        ) : null}
      </div>
      {open && (!step.done || canReopen) ? (
        <div className="ob-connect">
          <AlpacaGuide join={join.data} onJoined={onJoined} />
        </div>
      ) : null}
    </li>
  );
}

function Step({
  step,
  active,
}: {
  readonly step: OnboardingStep;
  readonly active: boolean;
}): ReactElement {
  return (
    <li className={`ob-step${step.done ? " ob-step-done" : ""}`}>
      <div className="ob-step-head">
        <StepGlyph done={step.done} active={active} />
        <div className="ob-step-body">
          <div className="ob-step-title">{step.title}</div>
          <div className="ob-step-detail">{stepDetail(step)}</div>
        </div>
        <StepAction step={step} />
      </div>
    </li>
  );
}

export function OnboardingChapter({
  onJoined,
}: {
  /** A connect just landed — the Profile page re-reads the accounts its head resolves from. */
  readonly onJoined?: () => void;
}): ReactElement {
  const onboarding = useQuery({
    queryKey: ["onboarding"],
    queryFn: fetchOnboarding,
    refetchOnWindowFocus: true,
  });
  if (onboarding.isPending) return <p className="note">Opening onboarding…</p>;
  if (onboarding.isError || !onboarding.data)
    return <p className="note">Onboarding is unreachable.</p>;
  const data = onboarding.data;
  const name = data.account?.displayName ?? data.viewerName;
  const firstOpen = data.steps.findIndex((s) => !s.done);
  return (
    <>
      <header className="page-header">
        <div className="join-eyebrow">
          Milestone {data.milestone.code} · {data.milestone.title}
        </div>
        <h2>Welcome to the league{name ? `, ${name}` : ""}</h2>
        <p>
          Skynet Capital is a league for learning to trade — for real, without real losses. You
          trade the live market through an Alpaca <b>paper</b> account, climb a ladder from stocks
          to options one fill at a time, and earn your rank on the leaderboard. Three things stand
          between you and your first trade.
        </p>
      </header>
      {!data.linked ? (
        <p className="note">
          Onboarding tracks the signed-in member — this deployment has no sign-in, so nothing here
          can be marked done.
        </p>
      ) : null}
      <MilestonePanel title="Onboarding" done={data.done} total={data.total}>
        <ol className="ob-steps">
          {data.steps.map((step, i) =>
            step.id === "connect" ? (
              <ConnectStep
                key={step.id}
                step={step}
                data={data}
                onJoined={() => {
                  void onboarding.refetch();
                  onJoined?.();
                }}
              />
            ) : (
              <Step key={step.id} step={step} active={i === firstOpen} />
            ),
          )}
        </ol>
      </MilestonePanel>
    </>
  );
}
