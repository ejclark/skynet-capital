import { useQuery } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import {
  fetchDeskHeartbeat,
  type Heartbeat,
  heartbeatLine,
  type PlaybookHeartbeat,
  sinceText,
  VERDICT_WORDS,
} from "../live/heartbeat";
import { targetedCycle } from "./cycle-anchor";
import { DecisionsSection } from "./decisions-section";

/**
 * THE BOT HEARTBEAT (#3687 slice 3, shapes A + B — Eric's pick 2026-09-24): a chip in the account
 * header that answers "is it alive?" on every tab, and a Heartbeat section with the detail. Both
 * read one query, refreshed at the replication poll's own 30s rhythm (a faster refetch can't see
 * newer passes than the bots process has sent).
 */

const REFRESH_MS = 30_000;

function useHeartbeat(deskId: string) {
  return useQuery({
    queryKey: ["desk-heartbeat", deskId],
    queryFn: () => fetchDeskHeartbeat(deskId),
    refetchInterval: REFRESH_MS,
  });
}

/** Which playbook each verdict belongs to is the owner's to see (#885, Eric 2026-08-29: "at this
 *  time, we do not show what playbooks others are using"; docs/IA.md §5.2 — a non-owned bot shows
 *  "state + verdict words, playbook ids withheld"). The server strips the id for anyone else
 *  (`desk-owner-gate.ts`); the column also stays off when `showPlaybook` is false or no line
 *  carries an id, so a non-owner's page never draws an empty or leaked Playbook column. */
export function VerdictTable({
  playbooks,
  showPlaybook = true,
}: {
  readonly playbooks: readonly PlaybookHeartbeat[] | null;
  readonly showPlaybook?: boolean;
}): ReactElement {
  if (!playbooks) {
    return <p className="note">No playbook verdicts recorded yet.</p>;
  }
  const named = showPlaybook && playbooks.some((p) => p.playbookId);
  return (
    <table className="hb-table">
      <thead>
        <tr>
          {named ? <th scope="col">Playbook</th> : null}
          <th scope="col">Mode</th>
          <th scope="col">Last pass</th>
          <th scope="col">Held</th>
        </tr>
      </thead>
      <tbody>
        {playbooks.map((p, i) => (
          <tr key={named ? `${p.playbookId}:${p.mode}` : `${i}:${p.mode}`}>
            {named ? <td className="num">{p.playbookId}</td> : null}
            <td>{p.mode}</td>
            <td>{VERDICT_WORDS[p.state]}</td>
            <td>{sinceText(p)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StateText({ heartbeat }: { readonly heartbeat: Heartbeat }): ReactElement {
  const line = heartbeatLine(heartbeat);
  return (
    <>
      <span aria-hidden="true">{line.glyph}</span> <b>{line.word}</b> · {line.detail}
      {heartbeat.halted ? ` · halted: ${heartbeat.halted}` : ""}
    </>
  );
}

/** Shape A — the header chip. Renders nothing until there is something true to say. */
export function HeartbeatChip({
  deskId,
  showPlaybooks = true,
}: {
  readonly deskId: string;
  readonly showPlaybooks?: boolean;
}): ReactElement | null {
  const query = useHeartbeat(deskId);
  const [open, setOpen] = useState(false);
  if (!query.data?.available) return null;
  const { heartbeat } = query.data;
  return (
    <div className="hb-chip-wrap">
      <button
        type="button"
        className="hb-chip"
        data-state={heartbeat.state}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <StateText heartbeat={heartbeat} />
      </button>
      {open ? (
        <div className="hb-pop">
          <VerdictTable playbooks={heartbeat.playbooks} showPlaybook={showPlaybooks} />
        </div>
      ) : null}
    </div>
  );
}

/** Shape B — the Heartbeat section. `showPlaybooks={false}` on a bot the viewer does not own
 *  (`/u/:id/decisions`) keeps the verdict table's ids and the passes' playbook chips off (#885). */
export function HeartbeatSection({
  deskId,
  showPlaybooks = true,
}: {
  readonly deskId: string;
  readonly showPlaybooks?: boolean;
}): ReactElement {
  const query = useHeartbeat(deskId);
  // The round a fill's "why" pointed at, read once as this section mounts (`cycle-anchor.ts`).
  const [openCycle] = useState(targetedCycle);
  // #3961: the trail hid every pass that traded, so a traded round's rejected siblings and refused
  // ideas showed nowhere. The reader includes them here; a member who followed a fill's link is
  // asking for exactly such a round, so that arrival opens with them already included.
  const [withTrades, setWithTrades] = useState(openCycle !== undefined);
  if (query.isPending) return <p className="note">Listening for the heartbeat…</p>;
  if (query.isError) return <p className="note">The heartbeat is unreachable right now.</p>;
  if (!query.data.available) {
    return <p className="note">No decision trail is wired in this deployment.</p>;
  }
  const { heartbeat } = query.data;
  const cadence = Math.round(heartbeat.cadenceMs / 1000);
  const stale = Math.round(heartbeat.staleAfterMs / 60_000);
  return (
    <div className="hb-section">
      <section className="hb-card" data-state={heartbeat.state}>
        <p className="hb-state">
          <StateText heartbeat={heartbeat} />
        </p>
        <p className="note">
          Passes run at most every {cadence}s while the market is open. Stale means no pass for{" "}
          {stale} min during market hours.
        </p>
      </section>
      <section className="hb-card">
        <h2 className="hb-h">What each playbook concluded on the last pass</h2>
        <VerdictTable playbooks={heartbeat.playbooks} showPlaybook={showPlaybooks} />
      </section>
      <section className="hb-log">
        <h2 className="hb-h">
          {withTrades
            ? "Every recorded pass"
            : "Passes that placed no trade — idle, blocked, halted"}
        </h2>
        <label className="hb-include">
          <input
            type="checkbox"
            checked={withTrades}
            onChange={(e) => setWithTrades(e.target.checked)}
          />
          Include the passes that placed a trade
        </label>
        <p className="note">
          {withTrades
            ? "A pass that traded shows its whole round: every order placed, rejected or skipped, the ideas the guards refused, and how many got through."
            : "Passes that did trade are left out — tick the box to read them here, or open one from its row on Activity."}
        </p>
        <DecisionsSection
          deskId={deskId}
          noTrades={!withTrades}
          emptyText={
            withTrades
              ? "No recorded passes yet — the next autonomous run writes the first."
              : "Every recorded pass placed a trade — tick the box above to read them."
          }
          showPlaybooks={showPlaybooks}
          {...(openCycle ? { openCycle } : {})}
        />
      </section>
    </div>
  );
}
