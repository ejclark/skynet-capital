import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { balanceRead, type HealthLine, healthLine, playsByIdle } from "../live/book-health";
import { fetchDesk } from "../live/desk";
import { fetchPlaybookPerformance } from "../live/playbook-performance";
import { EnvPill } from "../ui";
import { BalanceFindings } from "./balance-findings";
import { BalancePlays } from "./balance-plays";
import { InitiatorSplit } from "./initiator-split";

/**
 * BALANCE — the book read as one system (#5493 slice 3; docs/IA.md §5.1). Eric, 2026-10-16: "look
 * at a portfolio view as a wholistic system with the ability to detect problem areas, imbalances,
 * stuck or ever green process". The head's line ("■ 1 gate · ◆ 2 signals ›", `book-health-line.tsx`)
 * is the glance; this is what it opens. One list, ranked, in the order a phone should read it
 * (CLAUDE.md → Mobile-first: 390px is the forcing constraint, the desktop adds room):
 *
 *   1. THE FINDINGS — gate first, then signal: what is out of balance, stuck, looping, concentrated
 *      or idle, each with the play behind it as a link into that playbook's own card.
 *   2. THE PLAYS — one row each, the most idle budget first: what it has committed, what is open,
 *      what it has closed. The numbers a finding is read against.
 *   3. THE CLOSED TRADES — who started the bots' closed trades, moved here from R&D → Playbooks
 *      (#5451 P3, Eric: "This is a high level metrics dashboard. It doesn't belong in the playbook
 *      list view, but a metrics view"). The one metrics home on the book, so the Profile, the
 *      Playbooks and the Leaderboard can link to it rather than each draw a second dashboard.
 *
 * The plan left the shape open — two tabs (health · performance) or one list ranked by findings
 * first (#5493, 2026-10-16). One list: a tab hides the half you did not open, and the findings are
 * the reason to be here. Wrong if, by 2026-11-16, the closed trades are the first thing a member
 * scrolls past to reach their findings — then the metrics earn their own section.
 *
 * Reads the account's own `["desk", id]` query, which the head line already holds, so it costs
 * nothing extra. A viewer who does not own the account is served counts only (#885) and never
 * reaches this section — it is `/accounts`, the viewer's own — but if the field arrives without
 * findings the section says so rather than drawing an empty list that reads as "all clear".
 */

/** "■ 1 gate · ◆ 2 signals" — the head line's words, as the heading's count. */
function Count({ line }: { readonly line: HealthLine }): ReactElement {
  return (
    <p className="bal-count" data-level={line.level} title={line.label}>
      {line.parts.map((part, i) => (
        <span key={part.level} data-level={part.level}>
          {i > 0 ? <span aria-hidden="true"> · </span> : null}
          <span aria-hidden="true">{part.glyph}</span> <b>{part.text}</b>
        </span>
      ))}
    </p>
  );
}

export function BalanceSection({
  deskId,
  accountName,
}: {
  readonly deskId: string;
  readonly accountName?: string | undefined;
}): ReactElement {
  const desk = useQuery({ queryKey: ["desk", deskId], queryFn: () => fetchDesk(deskId) });
  // The same key the Playbooks cards read (`playbooks-section.tsx`): one request, two screens.
  const performance = useQuery({
    queryKey: ["playbook-performance", deskId],
    queryFn: () => fetchPlaybookPerformance(deskId),
  });
  const name = accountName ?? "this account";

  if (desk.isPending) return <p className="note">Reading {name}'s book…</p>;
  if (desk.isError) return <p className="note">{name}'s book is unreachable right now.</p>;
  const read = balanceRead(desk.data.health);
  if (read.kind === "unread")
    return (
      <p className="note">
        The book can't be read right now, so nothing is said about its balance — not even that it is
        balanced.
      </p>
    );

  const line = healthLine(desk.data.health);
  const split = performance.data?.byInitiator;
  const mine = split?.mine;
  return (
    <div className="bal">
      <p className="bal-lede">
        Where {name}'s book is out of balance, stuck or looping, and the playbook behind each.
      </p>
      <section className="bal-block" aria-labelledby="bal-findings-h">
        <div className="bal-block-head">
          <h2 className="hb-h" id="bal-findings-h">
            Findings
          </h2>
          {line && line.parts.length > 0 ? <Count line={line} /> : null}
        </div>
        {read.kind === "owner" ? (
          <>
            {read.findings.length > 0 ? (
              <p className="bal-key">
                Signals are heads-ups. Gates are the stronger level; nothing is blocked yet.
              </p>
            ) : null}
            <BalanceFindings deskId={deskId} findings={read.findings} plays={read.plays} />
          </>
        ) : (
          <p className="note">
            This account's findings are its owner's to read — only the counts are shared.
          </p>
        )}
      </section>
      {read.kind === "owner" && read.plays.length > 0 ? (
        <section className="bal-block" aria-labelledby="bal-plays-h">
          <div className="bal-block-head">
            <h2 className="hb-h" id="bal-plays-h">
              Playbooks · most idle first
            </h2>
            <EnvPill />
          </div>
          <BalancePlays
            deskId={deskId}
            plays={playsByIdle(read.plays)}
            findings={read.findings}
            closed={performance.isPending ? undefined : (performance.data?.mine ?? null)}
          />
        </section>
      ) : null}
      {split ? (
        <section className="bal-block" aria-labelledby="bal-closed-h">
          <div className="bal-block-head">
            <h2 className="hb-h" id="bal-closed-h">
              Closed trades
            </h2>
          </div>
          <div className="bal-closed">
            {mine ? (
              <InitiatorSplit heading={`Who started ${name}'s closed trades`} split={mine} />
            ) : null}
            <InitiatorSplit
              heading="Who started the bots' closed trades — every bot"
              split={split.house}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
