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

export function VerdictTable({
  playbooks,
}: {
  readonly playbooks: readonly PlaybookHeartbeat[] | null;
}): ReactElement {
  if (!playbooks) {
    return <p className="note">No playbook verdicts recorded yet.</p>;
  }
  return (
    <table className="hb-table">
      <thead>
        <tr>
          <th scope="col">Playbook</th>
          <th scope="col">Mode</th>
          <th scope="col">Last pass</th>
          <th scope="col">Held</th>
        </tr>
      </thead>
      <tbody>
        {playbooks.map((p) => (
          <tr key={`${p.playbookId}:${p.mode}`}>
            <td className="num">{p.playbookId}</td>
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
export function HeartbeatChip({ deskId }: { readonly deskId: string }): ReactElement | null {
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
          <VerdictTable playbooks={heartbeat.playbooks} />
        </div>
      ) : null}
    </div>
  );
}

/** Shape B — the Heartbeat section. */
export function HeartbeatSection({ deskId }: { readonly deskId: string }): ReactElement {
  const query = useHeartbeat(deskId);
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
        <VerdictTable playbooks={heartbeat.playbooks} />
      </section>
    </div>
  );
}
