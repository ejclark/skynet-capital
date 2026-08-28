import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { type DecisionCycle, fetchDesk, fetchDeskDecisions } from "../live/desk";
import { DeskRail } from "../shell/desk-rail";
import { PageFrame } from "../shell/frame";

/**
 * THE BOT'S MIND (#738 phase 3a) — the decision-cycle viewer on the Actions-run template. Every
 * cycle is a run row: a status glyph readable at a glance, the one-line headline (counts or the
 * halt reason verbatim), and an expandable body showing what the persona wanted, what the guards
 * left standing, and what happened. Cycles that were halted or drew a rejection arrive OPEN —
 * the failed stage is the one a reader came for (the Actions pattern, unchanged).
 */

function OutcomeLine({ outcome }: { readonly outcome: DecisionCycle["outcomes"][number] }) {
  return (
    <li className="cycle-outcome">
      <span className={`cycle-action cycle-action-${outcome.action}`}>{outcome.action}</span>
      <span className="cycle-intent num">
        {outcome.side.toUpperCase()} {outcome.quantity} {outcome.symbol}
      </span>
      {outcome.playbook ? <span className="chip chip-bot">{outcome.playbook}</span> : null}
      {outcome.fill ? <span className="num cycle-fill">{outcome.fill}</span> : null}
      {outcome.resultStatus && !outcome.fill ? (
        <span className="cycle-fill">{outcome.resultStatus}</span>
      ) : null}
      <span className="cycle-reason">“{outcome.reason}”</span>
    </li>
  );
}

function CycleRow({ cycle }: { readonly cycle: DecisionCycle }): ReactElement {
  // Halted and rejected cycles arrive open — the reader came for the failure.
  const [open, setOpen] = useState(cycle.status === "halted" || cycle.status === "rejected");
  const when = new Date(cycle.at);
  const stamp = Number.isNaN(when.getTime())
    ? cycle.at
    : when.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  return (
    <li className={`cycle cycle-${cycle.status}`}>
      <button
        type="button"
        className="cycle-row"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="cycle-glyph" aria-hidden="true" />
        <span className="cycle-headline">{cycle.headline}</span>
        <span className={`chip chip-${cycle.mode === "live" ? "human" : "bot"}`}>
          {cycle.mode.toUpperCase()}
        </span>
        <span className="cycle-when num">{stamp}</span>
      </button>
      {open ? (
        <div className="cycle-body">
          <p className="cycle-guards num">
            {cycle.rawCount} intent{cycle.rawCount === 1 ? "" : "s"} from the persona →{" "}
            {cycle.guardedCount} past the guards
          </p>
          {cycle.halted ? <p className="cycle-halt">⛔ {cycle.halted}</p> : null}
          {cycle.outcomes.length > 0 ? (
            <ul className="cycle-outcomes">
              {cycle.outcomes.map((outcome) => (
                <OutcomeLine
                  key={`${outcome.symbol}-${outcome.side}-${outcome.quantity}-${outcome.action}-${outcome.reason}`}
                  outcome={outcome}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function DecisionsPage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const decisions = useQuery({
    queryKey: ["desk-decisions", id],
    queryFn: () => fetchDeskDecisions(id),
    refetchOnWindowFocus: true,
  });

  if (desk.isPending || decisions.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the audit trail…</p>
      </PageFrame>
    );
  if (desk.isError || decisions.isError)
    return (
      <PageFrame>
        <p className="note">The audit trail is unreachable.</p>
      </PageFrame>
    );

  const d = desk.data.desk;
  const trail = decisions.data;
  return (
    <PageFrame rail={<DeskRail id={d.id} name={d.name} kind={d.kind} current="decisions" />}>
      <header className="page-header">
        <h1>{d.name} — decisions</h1>
        <p>
          Every autonomous cycle, replayable: what the persona wanted, what the risk guards left
          standing, and what happened. Reasons are the persona's own words.
        </p>
      </header>
      {trail.kind !== "bot" ? (
        <p className="note">
          {d.name} is a human desk — decision cycles are a bot's audit trail. The fill timeline on
          the Active view is the human record.
        </p>
      ) : !trail.available ? (
        <p className="note">
          No decision audit trail is wired in this deployment (the runner records one when
          SKYNET_AUDIT_DIR is set).
        </p>
      ) : trail.cycles.length === 0 ? (
        <p className="note">No recorded cycles yet — the next autonomous run writes the first.</p>
      ) : (
        <ul className="cycles">
          {trail.cycles.map((cycle) => (
            <CycleRow key={cycle.at} cycle={cycle} />
          ))}
        </ul>
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/u/$id/decisions")({ component: DecisionsPage });
