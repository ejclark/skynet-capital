import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  fetchDeskThesis,
  type SafeguardLadderEntry,
  type SafeguardState,
  type ThesisData,
  type ThesisMarker,
} from "../live/desk";
import { fetchSettings, type OwnedAccount } from "../live/settings";
import { readChartPalette } from "./chart-mount";
import { mountThesisChart } from "./thesis-chart-mount";

/**
 * THE THESIS DRAWER'S SHELL (#3186 slices 4a + 4b) — a bot's standing call, its one-line thesis, a
 * track-record chart, an honest health readout, and a bot-controls cluster. Lives at
 * `/u/:id/thesis`, a section of the any-account page — this codebase has no slide-over/modal pattern
 * (the old timeline drawer, now `order-event-line.tsx`, was deliberately de-drawered after live-review feedback that a popup read
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
 * `ROLL_UNAVAILABLE_REASON`), never a fake backend. Each reason is visible text under the buttons,
 * tied by `aria-describedby` (#3807 slice 2e, dead end 8 — a title has no hover on a phone). Steering Rules (part of the same AC'd cluster)
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
  const whyId = useId();
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
        <button type="button" className="btn mc-btn" aria-describedby={`${whyId}-subscribe`}>
          Subscribe
        </button>
        <button type="button" className="btn mc-btn" aria-describedby={`${whyId}-steering`}>
          Steering Rules
        </button>
      </div>
      {/* Visible, never a title (#3807 slice 2e, dead end 8): a phone has no hover. */}
      <p id={`${whyId}-subscribe`} className="thesis-controls-why">
        {SUBSCRIBE_BOT_UNAVAILABLE_REASON}
      </p>
      <p id={`${whyId}-steering`} className="thesis-controls-why">
        {STEERING_RULES_UNAVAILABLE_REASON}
      </p>
    </fieldset>
  );
}

const SAFEGUARD_STATE_LABEL: Record<SafeguardState, string> = {
  off: "Off",
  watching: "Watching",
  "alert-only": "Alert only",
  enforcing: "Enforcing",
};

/** Four genuinely different SHAPES, not four fill levels of one — a quarter-filled circle has no
 *  glyph in several common stacks and fell back to a smudge in the 390px frame. Hollow circle,
 *  diamond, warning triangle, filled circle all render in core fonts and read apart at 12px. The
 *  state never depends on hue (CLAUDE.md: a standing reader is red/green colourblind); this is the
 *  third signal, after the word beside it and the stage's own border pattern. */
const SAFEGUARD_STATE_GLYPH: Record<SafeguardState, string> = {
  off: "○",
  watching: "◆",
  "alert-only": "▲",
  enforcing: "●",
};

/**
 * THE SAFEGUARD LADDER (#3194 slice 6a) — per play this bot ran, what each of its two safety
 * stages actually does today. Read-only: arming or downgrading a stage is slice 6b, and this
 * surface exists first on purpose — a member cannot consent to a safety net they cannot see.
 * Every word here comes from `safeguard-ladder-view.ts`, which is where the honesty invariant
 * lives (a stage never claims to act when the code only logs); this component renders it and
 * invents nothing.
 */
function SafeguardLadder({
  ladder,
}: {
  readonly ladder: readonly SafeguardLadderEntry[] | null | undefined;
}): ReactElement | null {
  // A deployment whose thesis payload predates this field: draw nothing rather than an empty
  // section that would read as "no safeguards".
  if (ladder === undefined) return null;
  return (
    <section className="thesis-ladder">
      <h3 className="thesis-ladder-heading">Safeguards</h3>
      {ladder === null || ladder.length === 0 ? (
        <p className="note">
          No decision pass on hand says which plays this bot runs, so its safeguards can’t be read
          yet.
        </p>
      ) : (
        ladder.map((entry, i) => (
          <div className="thesis-ladder-play" key={`${entry.playbookId ?? i}:${entry.mode}`}>
            <p className="thesis-ladder-play-name">
              {entry.playbookId ?? `Play ${i + 1}`} · {entry.mode}
            </p>
            {entry.stages === null ? (
              <p className="note">
                Not one of the house plays, so its safeguards can’t be read here.
              </p>
            ) : (
              <ol className="thesis-ladder-stages">
                {entry.stages.map((stage) => (
                  <li
                    className={`thesis-ladder-stage thesis-ladder-stage-${stage.state}`}
                    key={stage.stage}
                  >
                    <p className="thesis-ladder-stage-name">
                      Stage {stage.stage} — {stage.name}
                      <span className="thesis-ladder-state">
                        <span aria-hidden="true">{SAFEGUARD_STATE_GLYPH[stage.state]} </span>
                        {SAFEGUARD_STATE_LABEL[stage.state]}
                      </span>
                    </p>
                    <p className="thesis-ladder-stage-does">{stage.does}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))
      )}
    </section>
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

/** Where a marker's order row lives (#3807 slice 2d, dead end 5): the `#act-<orderId>` anchors exist
 *  only on an Activity table, so a marker links to the Activity of the page it is on — the
 *  any-account page's own (`/u/:id/activity`), or the Profile page's for that account. */
type ActivityHome = "page" | "profile";

/** A fill without a resolved decision renders exactly as before: a plain link, no fake affordance.
 *  One carrying `reasoning` gets a closed-by-default expand — a fill isn't a failure state that
 *  demands to arrive open, unlike `CycleRow`'s halted/rejected cycles. */
function MarkerRow({
  marker,
  deskId,
  activity,
}: {
  readonly marker: ThesisMarker;
  readonly deskId: string;
  readonly activity: ActivityHome;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <li className={`thesis-marker thesis-marker-${marker.kind}`}>
      <div className="thesis-marker-row">
        {activity === "page" ? (
          <Link to="/u/$id/activity" params={{ id: deskId }} hash={marker.activityAnchor}>
            {marker.n}. {marker.label}
          </Link>
        ) : (
          <Link
            to="/accounts"
            search={{ account: deskId, section: "activity" }}
            hash={marker.activityAnchor}
          >
            {marker.n}. {marker.label}
          </Link>
        )}
        {marker.reasoning ? (
          <button
            type="button"
            className="thesis-marker-toggle"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide reasoning" : "Why?"}
          </button>
        ) : null}
      </div>
      {open && marker.reasoning ? (
        <div className="thesis-marker-detail">
          <p className="cycle-reason">“{marker.reasoning.reason}”</p>
          {marker.reasoning.expectation ? (
            <p className="cycle-expectation">Expected: {marker.reasoning.expectation}</p>
          ) : null}
          {marker.reasoning.guardDelta ? (
            <p className="cycle-guard-delta">{marker.reasoning.guardDelta}</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function MarkerList({
  markers,
  deskId,
  activity,
}: {
  readonly markers: readonly ThesisMarker[];
  readonly deskId: string;
  readonly activity: ActivityHome;
}): ReactElement | null {
  if (markers.length === 0) return null;
  return (
    <ol className="thesis-markers">
      {markers.map((marker) => (
        <MarkerRow
          key={marker.activityAnchor}
          marker={marker}
          deskId={deskId}
          activity={activity}
        />
      ))}
    </ol>
  );
}

function ThesisChart({
  equity,
  markers,
  deskId,
  activity,
}: {
  readonly equity: ThesisData["equity"];
  readonly markers: readonly ThesisMarker[];
  readonly deskId: string;
  readonly activity: ActivityHome;
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
      <MarkerList markers={markers} deskId={deskId} activity={activity} />
    </>
  );
}

export function ThesisDrawer({
  id,
  activity = "profile",
}: {
  readonly id: string;
  /** Which page's Activity the fill markers open — the one this drawer is rendered on. */
  readonly activity?: ActivityHome;
}): ReactElement {
  const thesis = useQuery({ queryKey: ["desk-thesis", id], queryFn: () => fetchDeskThesis(id) });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const ownAccounts = settings.data?.accounts.filter((a) => a.kind === "human") ?? [];

  if (thesis.isPending) return <p className="note">Reading the thesis…</p>;
  if (thesis.isError) return <p className="note">The thesis is unreachable.</p>;
  if (!(thesis.data.available && thesis.data.thesis)) {
    return (
      <p className="note">
        {thesis.data.kind === "human"
          ? "A human account has no persona thesis to show."
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
      <SafeguardLadder ladder={thesis.data.ladder} />
      <ThesisChart equity={data.equity} markers={data.markers} deskId={id} activity={activity} />
    </div>
  );
}
