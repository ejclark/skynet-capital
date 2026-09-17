import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { fetchDeskThesis, type ThesisData, type ThesisMarker } from "../live/desk";
import { fetchSettings, type OwnedAccount } from "../live/settings";
import { readChartPalette } from "./chart-mount";
import { mountThesisChart } from "./thesis-chart-mount";

/**
 * THE THESIS DRAWER'S SHELL (#3186 slices 4a + 4b) — a bot's standing call, its one-line thesis, a
 * track-record chart, an honest health readout, and a bot-controls cluster. Lives at
 * `/u/:id/thesis`, a sixth `DeskRail` sibling — this codebase has no slide-over/modal pattern
 * (`timeline-drawer.tsx` was deliberately de-drawered after live-review feedback that a popup read
 * as too far removed from what opened it), so "Drawer" here is a page, matching every other
 * desk-scoped view.
 *
 * THE BOT-CONTROLS CLUSTER SHIPS LOCKED (slice 4b), not wired: the issue's "Subscribe" is capital
 * subscribed into a BOT'S OWN persona-driven strategy (its own decision doc: "the seed of a
 * plug-and-play strategy marketplace") — a different, unbuilt mechanism from the house Playbook
 * Store's existing `PlaybookSubscription` (an account funding a declarative playbook template with
 * its own capital, `u.$id.playbooks.tsx`). Personas trade via code (`Persona.decide`), never a
 * subscribable playbook, and nothing routes a member's capital into another account's decision
 * loop. Building that mechanism now would mean inventing new capital-routing + risk-guard plumbing
 * with real paper-trading consequences — the same class of decision as the safeguard ladder (slice
 * 4d) — so the control ships visible · disabled · explained (the "Roll" precedent from slice 1's
 * `ROLL_UNAVAILABLE_REASON`), never a fake backend. Steering Rules (part of the same AC'd cluster)
 * has zero backing anywhere either, so it ships locked alongside it rather than as its own slice.
 */

export const SUBSCRIBE_BOT_UNAVAILABLE_REASON =
  "Subscribing capital into a bot's own strategy isn't wired yet — a persona trades from its own account today, with no mechanism to route another account's capital into its decisions.";

export const STEERING_RULES_UNAVAILABLE_REASON =
  "Steering Rules — deeper per-invalidator/event-response controls — aren't built yet.";

function BotControls({
  ownAccounts,
}: {
  readonly ownAccounts: readonly OwnedAccount[];
}): ReactElement {
  const [targetAccount, setTargetAccount] = useState(ownAccounts[0]?.id ?? "");
  const [capital, setCapital] = useState(0);
  return (
    <fieldset className="thesis-controls" disabled>
      <legend>Subscribe</legend>
      <div className="thesis-controls-field">
        <label htmlFor="thesis-target-account">Target account</label>
        {ownAccounts.length > 0 ? (
          <select
            id="thesis-target-account"
            value={targetAccount}
            onChange={(e) => setTargetAccount(e.target.value)}
          >
            {ownAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="note">No accounts to subscribe from.</span>
        )}
      </div>
      <div className="thesis-controls-field">
        <label htmlFor="thesis-capital">Capital allocated</label>
        <input
          id="thesis-capital"
          type="range"
          min={0}
          max={50_000}
          step={100}
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
        />
        <span className="num">${capital.toLocaleString("en-US")}</span>
      </div>
      <div className="thesis-controls-actions">
        <button
          type="button"
          className="btn mc-btn"
          title={SUBSCRIBE_BOT_UNAVAILABLE_REASON}
          aria-label={`Subscribe — ${SUBSCRIBE_BOT_UNAVAILABLE_REASON}`}
        >
          Subscribe
        </button>
        <button
          type="button"
          className="btn mc-btn"
          title={STEERING_RULES_UNAVAILABLE_REASON}
          aria-label={`Steering Rules — ${STEERING_RULES_UNAVAILABLE_REASON}`}
        >
          Steering Rules
        </button>
      </div>
    </fieldset>
  );
}

const VERDICT_LABEL: Record<ThesisData["call"]["verdict"], string> = {
  entering: "Entering",
  exiting: "Exiting",
  holding: "Holding",
  "standing aside": "Standing aside",
  "no data yet": "No data yet",
};

function CallBanner({ call }: { readonly call: ThesisData["call"] }): ReactElement {
  return (
    <div className={`thesis-call thesis-call-${call.verdict.replace(/\s+/g, "-")}`}>
      <p className="thesis-verdict">{VERDICT_LABEL[call.verdict]}</p>
      <p className="thesis-why">{call.why}</p>
      <dl className="thesis-call-meta">
        {call.window ? (
          <div>
            <dt>Window</dt>
            <dd className="num">{call.window}</dd>
          </div>
        ) : null}
        {call.invalidator ? (
          <div>
            <dt>Invalidator (as of the last cycle)</dt>
            <dd>{call.invalidator}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function MarkerList({
  markers,
}: {
  readonly markers: readonly ThesisMarker[];
}): ReactElement | null {
  if (markers.length === 0) return null;
  return (
    <ol className="thesis-markers">
      {markers.map((marker) => (
        <li key={marker.activityAnchor} className={`thesis-marker thesis-marker-${marker.kind}`}>
          <a href={`#${marker.activityAnchor}`}>
            {marker.n}. {marker.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

function ThesisChart({
  equity,
  markers,
}: {
  readonly equity: ThesisData["equity"];
  readonly markers: readonly ThesisMarker[];
}): ReactElement {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const mounted = mountThesisChart(el, equity, markers, readChartPalette());
    return () => mounted.dispose();
  }, [equity, markers]);

  if (equity.length === 0) return <p className="note">No equity history recorded yet.</p>;
  return (
    <>
      <div ref={container} className="thesis-chart-canvas" />
      <MarkerList markers={markers} />
    </>
  );
}

export function ThesisDrawer({ id }: { readonly id: string }): ReactElement {
  const thesis = useQuery({ queryKey: ["desk-thesis", id], queryFn: () => fetchDeskThesis(id) });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const ownAccounts = settings.data?.accounts.filter((a) => a.kind === "human") ?? [];

  if (thesis.isPending) return <p className="note">Reading the thesis…</p>;
  if (thesis.isError) return <p className="note">The thesis is unreachable.</p>;
  if (!(thesis.data.available && thesis.data.thesis)) {
    return (
      <p className="note">
        {thesis.data.kind === "human"
          ? "A human desk has no persona thesis to show."
          : "No thesis data is wired in this deployment."}
      </p>
    );
  }

  const data = thesis.data.thesis;
  return (
    <div className="thesis-drawer">
      {data.thesis ? <p className="thesis-paragraph">{data.thesis}</p> : null}
      <BotControls ownAccounts={ownAccounts} />
      <CallBanner call={data.call} />
      <p className="thesis-health">
        Health:{" "}
        <span
          className={
            data.health.measured ? `tone-${data.health.label === "steady" ? "pos" : "neg"}` : ""
          }
        >
          {data.health.label}
        </span>
        {data.health.detail ? (
          <span className="thesis-health-detail"> · {data.health.detail}</span>
        ) : null}
      </p>
      <ThesisChart equity={data.equity} markers={data.markers} />
    </div>
  );
}
