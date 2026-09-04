import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { fetchJoin } from "../live/join";
import { localSessionSuffix } from "../live/market-hours";
import { meetMoneypenny } from "../live/moneypenny";
import { fetchOnboarding, type Onboarding, type OnboardingStep } from "../live/onboarding";
import { fetchPlaybooks } from "../live/playbooks";
import { AlpacaGuide } from "../shell/alpaca-guide";
import { PageFrame } from "../shell/frame";
import { ProfileMeta } from "../shell/profile-meta";
import { ProfileRail } from "../shell/profile-rail";

/**
 * MILESTONE M·01 — ONBOARDING (#1119, from the Claude Design canvas "Alpaca onboarding process
 * streamline"; revised by the 2026-09-03 handoff "Streamlined Onboarding, Milestones & Moneypenny
 * Chat Rail"). Three steps between a new member and their first trade, each marked done by the
 * server's reading of a ledger (`/api/onboarding`) — never by anything this page decides:
 *
 *   1. connect Alpaca — the five-step guide as progressive-disclosure accordions, the connect
 *      form inside step 5 (`shell/alpaca-guide.tsx`), while the viewer has no linked human account
 *   2. meet Moneypenny — opens her rail with the intro; her first reply is the step (the
 *      engagement track's own milestone; a filed issue is a separate, harder achievement)
 *   3. make the first trade — rung 101 on the desk, with the session hours in the viewer's zone
 *
 * `?moneypenny=intro` opens the rail on arrival — the deep link every "Meet Moneypenny ›" outside
 * this page uses. Once connected the account tiles ride the same read: equity, buying power,
 * rungs earned, playbooks unlocked. Honesty rule as everywhere (docs/BRAND.md): the figures are
 * the live board's, labelled simulated, and a stale read says so rather than showing zeros.
 */

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        Open the trading desk ›
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

function AccountTiles({ data }: { readonly data: Onboarding }): ReactElement | null {
  const a = data.account;
  const playbooks = useQuery({
    queryKey: ["playbooks"],
    queryFn: fetchPlaybooks,
    enabled: a !== undefined,
  });
  if (!a) return null;
  return (
    <div className="ob-tiles">
      <div className="ob-tile ob-tile-lead">
        <span className="ob-k">Equity</span>
        <span className="ob-v num">{a.stale ? "—" : money(a.equity)}</span>
        <span className="ob-note">
          {a.stale ? "last account read failed" : "simulated · Alpaca paper"}
        </span>
      </div>
      <div className="ob-tile">
        <span className="ob-k">Buying power</span>
        <span className="ob-v num">{a.stale ? "—" : money(a.cash)}</span>
        <span className="ob-note">ready to deploy</span>
      </div>
      <div className="ob-tile">
        <span className="ob-k">Ladder</span>
        <span className="ob-v num">
          {a.rungsEarned}
          <span className="ob-unit"> / {a.rungsTotal} rungs</span>
        </span>
        <span className="ob-note">
          {a.nextUp ? `next up · ${a.nextUp.title.toLowerCase()}` : "ladder complete"}
        </span>
      </div>
      <div className="ob-tile">
        <span className="ob-k">Playbooks</span>
        <span className="ob-v num">
          {playbooks.data?.unlocked ?? "—"}
          <span className="ob-unit"> / {playbooks.data?.total ?? "—"} unlocked</span>
        </span>
        <span className="ob-note">
          <Link className="ob-tile-link" to="/playbooks">
            view playbooks ›
          </Link>
        </span>
      </div>
    </div>
  );
}

function OnboardingPage(): ReactElement {
  const { moneypenny } = Route.useSearch();
  const navigate = useNavigate();
  const onboarding = useQuery({
    queryKey: ["onboarding"],
    queryFn: fetchOnboarding,
    refetchOnWindowFocus: true,
  });
  // The deep link: arriving with `?moneypenny=intro` opens the rail with her intro, then drops
  // the param so a later visit or a remount doesn't fire it again.
  useEffect(() => {
    if (moneypenny !== "intro") return;
    void meetMoneypenny();
    void navigate({ to: "/onboarding", search: {}, replace: true });
  }, [moneypenny, navigate]);
  if (onboarding.isPending)
    return (
      <PageFrame rail={<ProfileRail current="onboarding" />}>
        <p className="note">Opening onboarding…</p>
      </PageFrame>
    );
  if (onboarding.isError || !onboarding.data)
    return (
      <PageFrame rail={<ProfileRail current="onboarding" />}>
        <p className="note">Onboarding is unreachable.</p>
      </PageFrame>
    );
  const data = onboarding.data;
  const name = data.account?.displayName ?? data.viewerName;
  const firstOpen = data.steps.findIndex((s) => !s.done);
  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
  return (
    <PageFrame rail={<ProfileRail current="onboarding" />}>
      <ProfileMeta />
      <header className="page-header">
        <div className="join-eyebrow">
          Milestone {data.milestone.code} · {data.milestone.title}
        </div>
        <h1>Welcome to the league{name ? `, ${name}` : ""}</h1>
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
      <section className="ob-panel">
        <div className="ob-panel-head">
          <h2 className="ob-panel-title">Onboarding</h2>
          <span className="ob-count num">
            {data.done} / {data.total} complete
          </span>
        </div>
        <div className="course-bar ob-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <ol className="ob-steps">
          {data.steps.map((step, i) =>
            step.id === "connect" ? (
              <ConnectStep
                key={step.id}
                step={step}
                data={data}
                onJoined={() => void onboarding.refetch()}
              />
            ) : (
              <Step key={step.id} step={step} active={i === firstOpen} />
            ),
          )}
        </ol>
      </section>
      <AccountTiles data={data} />
    </PageFrame>
  );
}

export const Route = createFileRoute("/onboarding")({
  // `?moneypenny=intro` opens the rail with her intro (M·01's step 2); anything else is dropped.
  validateSearch: (search: Record<string, unknown>) =>
    search.moneypenny === "intro" ? { moneypenny: "intro" as const } : {},
  component: OnboardingPage,
});
