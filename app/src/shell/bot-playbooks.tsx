import { type ReactElement, useId, useState } from "react";
import { botPlaybooks, playbooksCount } from "../live/bot-playbooks";
import { agoText, type Heartbeat, heartbeatLine } from "../live/heartbeat";
import { targetedCycle } from "./cycle-anchor";
import { DecisionsSection } from "./decisions-section";
import { useHeartbeat } from "./heartbeat";
import { CountedLine, PlaybookCards } from "./playbook-cards";
import { ShadowProbes } from "./shadow-probes";

/**
 * A BOT'S PLAYBOOKS (#5073 — #5037 round 2, Eric's pick R2: "I really like the visualization
 * details and crisp structure. I love polished high fidelity crispness"). One bot section, in
 * Heartbeat's old slot after Events, because the two were one thing drawn twice: Heartbeat is the
 * bot checking the market, and a playbook is a rule each check asks. So the bot's checks are the
 * strip on top, and the two lists of the same playbooks Heartbeat used to draw — the roll call and
 * the verdict table — are one card each under it (`live/bot-playbooks.ts` is the join).
 *
 * The check log is folded behind the strip ("Every check ›"). It arrives open when the reader came
 * for it: an old `?section=heartbeat` or `?section=decisions` link (`checksOpen`), or a fill's
 * "the whole pass" link whose `#cycle-…` hash names one round (#3961), which also includes the
 * checks that traded so that round is there to open.
 *
 * `showPlaybooks` false on a bot the viewer does not own (#885, docs/IA.md §5.2): the strip and
 * each card's state stay, the names, the roll call and the way to change them do not.
 */
export function BotPlaybooksSection({
  deskId,
  botName,
  showPlaybooks = true,
  checksOpen = false,
}: {
  readonly deskId: string;
  /** The bot's own name, for the strip's sentence; "This bot" when the page does not know it. */
  readonly botName?: string;
  readonly showPlaybooks?: boolean;
  readonly checksOpen?: boolean;
}): ReactElement {
  const query = useHeartbeat(deskId);
  // The round a fill's "why" pointed at, read once as this section mounts (`cycle-anchor.ts`).
  const [openCycle] = useState(targetedCycle);
  const [logOpen, setLogOpen] = useState(checksOpen || openCycle !== undefined);
  const logId = useId();
  if (query.isPending) return <p className="note">Reading this bot's checks…</p>;
  if (query.isError) return <p className="note">This bot's checks are unreachable right now.</p>;
  if (!query.data.available) {
    return <p className="note">No decision trail is wired in this deployment.</p>;
  }
  const { heartbeat } = query.data;
  const merged = botPlaybooks(heartbeat, showPlaybooks);
  return (
    <div className="pbb">
      <ChecksStrip
        heartbeat={heartbeat}
        name={botName ?? "This bot"}
        count={merged.cards.length}
        logId={logId}
        logOpen={logOpen}
        onToggleLog={() => setLogOpen((was) => !was)}
      />
      {logOpen ? (
        <CheckLog
          id={logId}
          deskId={deskId}
          showPlaybooks={showPlaybooks}
          {...(openCycle ? { openCycle } : {})}
        />
      ) : null}
      <CountedLine counts={merged.counts} />
      <PlaybookCards
        deskId={deskId}
        merged={merged}
        named={showPlaybooks}
        unmanaged={showPlaybooks ? (heartbeat.unmanaged ?? []) : []}
        none={heartbeat.playbooks === null && !heartbeat.rollCall}
      />
      <ShadowProbes deskId={deskId} />
    </div>
  );
}

/** The one fact beside the state word. "Running" is the only state whose detail moves every few
 *  seconds, so it says when the last check was rather than "checked the market". */
function stripDetail(h: Heartbeat): string {
  if (h.state === "beating" && h.sinceLastPassMs !== null) {
    return `last check ${agoText(h.sinceLastPassMs)} ago`;
  }
  return heartbeatLine(h).detail;
}

/** The bot's checks — is it running, how often, and the one sentence that joins it to the cards
 *  below: every check asks every playbook what to do. A week of checks drawn as a strip, with the
 *  trades marked and "none missed" counted, is slice 2 (it needs the week from the server); this
 *  slice says only what the payload can prove — "on time" means the newest check is inside the
 *  two-minute window, not that no check was ever late. */
function ChecksStrip({
  heartbeat,
  name,
  count,
  logId,
  logOpen,
  onToggleLog,
}: {
  readonly heartbeat: Heartbeat;
  readonly name: string;
  readonly count: number;
  readonly logId: string;
  readonly logOpen: boolean;
  readonly onToggleLog: () => void;
}): ReactElement {
  const { glyph, word } = heartbeatLine(heartbeat);
  const detail = stripDetail(heartbeat);
  const cadence = Math.round(heartbeat.cadenceMs / 1000);
  const stale = Math.round(heartbeat.staleAfterMs / 60_000);
  return (
    <section className="pbb-strip" data-state={heartbeat.state} aria-label={`${name}'s checks`}>
      <div className="pbb-strip-head">
        <p className="pbb-strip-state">
          <span aria-hidden="true">{glyph}</span> <b>{word}</b>
          {detail ? <span className="pbb-strip-detail"> · {detail}</span> : null}
        </p>
        {heartbeat.state === "beating" ? (
          <p className="pbb-strip-ok">
            <span aria-hidden="true">✓</span> on time
          </p>
        ) : null}
      </div>
      {heartbeat.halted ? (
        <p className="pbb-strip-halt">
          <b>Halted</b> · {heartbeat.halted}
        </p>
      ) : null}
      <p className="pbb-strip-why">
        {name} checks the market about every {cadence} seconds while it's open.
        {count > 0 ? (
          <>
            {" "}
            <b>Each check asks the {playbooksCount(count)} below what to do.</b>
          </>
        ) : null}
      </p>
      {heartbeat.state === "stale" ? (
        <p className="pbb-strip-why">
          Not checking means no check for {stale} min while the market is open, or none in all of
          the last session while it's closed.
        </p>
      ) : null}
      <div className="pbb-strip-foot">
        <button
          type="button"
          className="pbb-log-toggle"
          aria-expanded={logOpen}
          aria-controls={logId}
          onClick={onToggleLog}
        >
          Every check{" "}
          <span className="pbb-chev" aria-hidden="true">
            ›
          </span>
        </button>
      </div>
    </section>
  );
}

/** Every check, newest first — the old Heartbeat's log (#3687 slice 4), unfolded from the strip.
 *  The checks that traded stay out until the reader includes them (#3961): their orders already
 *  have rows on Activity, and the log is for the checks that left no other trace. */
function CheckLog({
  id,
  deskId,
  showPlaybooks,
  openCycle,
}: {
  readonly id: string;
  readonly deskId: string;
  readonly showPlaybooks: boolean;
  readonly openCycle?: string;
}): ReactElement {
  // A member who followed a fill's link is asking for exactly such a round, so that arrival opens
  // with the traded checks already included.
  const [withTrades, setWithTrades] = useState(openCycle !== undefined);
  return (
    <section className="pbb-log hb-log" id={id} aria-label="Every check">
      <h2 className="hb-h">
        {withTrades
          ? "Every check, newest first"
          : "Checks that placed no trade — idle, blocked, halted"}
      </h2>
      <label className="hb-include">
        <input
          type="checkbox"
          checked={withTrades}
          onChange={(e) => setWithTrades(e.target.checked)}
        />
        Include the checks that placed a trade
      </label>
      <p className="note">
        {withTrades
          ? "A check that traded shows its whole round: every order placed, rejected or skipped, the ideas the guards refused, and how many got through."
          : "Checks that did trade are left out — tick the box to read them here, or open one from its row on Activity."}
      </p>
      <DecisionsSection
        deskId={deskId}
        noTrades={!withTrades}
        emptyText={
          withTrades
            ? "No recorded checks yet — the next autonomous run writes the first."
            : "Every recorded check placed a trade — tick the box above to read them."
        }
        showPlaybooks={showPlaybooks}
        {...(openCycle ? { openCycle } : {})}
      />
    </section>
  );
}
