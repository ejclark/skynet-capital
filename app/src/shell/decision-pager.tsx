import { useQuery } from "@tanstack/react-query";
import { type ReactElement, useMemo, useRef, useState } from "react";
import type { Decision } from "../live/desk";
import { fetchOptionPositions } from "../live/options";
import { OutcomeRange } from "./outcome-range";

/**
 * NEEDS A DECISION (#3689 slice 7, design handoff 3a): the Overview's attention layer, one card at
 * a time, replacing the considerations rail.
 *  - ‹ › page and wrap, and a swipe pages on touch. ✕ ("Not now") snoozes the card for this
 *    account and moves on. Snoozes persist per account in localStorage, like the default account.
 *  - "✦ Why, and details" opens the long caption, the clocks and Moneypenny's reason. It stays open
 *    while paging, because once you're reading details you probably want them on the next card too.
 *  - The primary action only drafts: it opens the contract on Trade to review. Nothing is placed
 *    from here, and the ↗ says so without a disclaimer.
 *  - Cards are ordered by money at stake (server-side). The pager hides entirely at zero.
 *  - A card flagged here still appears in the positions table: this is an attention layer, not
 *    where the position lives.
 */

const KIND_LABEL: Record<Decision["kind"], string> = {
  "at-risk": "At risk",
  "lock-in": "Lock in profit",
  idea: "Idea",
};

const snoozeKey = (accountId: string) => `skynet.decisions.snoozed.${accountId}`;

function readSnoozed(accountId: string): readonly string[] {
  try {
    const raw = window.localStorage.getItem(snoozeKey(accountId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeSnoozed(accountId: string, ids: readonly string[]): void {
  try {
    window.localStorage.setItem(snoozeKey(accountId), JSON.stringify(ids));
  } catch {
    // Private windows and blocked storage: the snooze just lasts this visit.
  }
}

const SWIPE_PX = 40;

export function DecisionPager({
  accountId,
  decisions,
}: {
  readonly accountId: string;
  readonly decisions: readonly Decision[];
}): ReactElement | null {
  const [snoozed, setSnoozed] = useState<readonly string[]>(() => readSnoozed(accountId));
  const [index, setIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const touchX = useRef<number | undefined>(undefined);

  const hasOptions = decisions.some((d) => d.range);
  const book = useQuery({
    queryKey: ["option-positions", accountId],
    queryFn: () => fetchOptionPositions(accountId),
    enabled: hasOptions,
    staleTime: 30_000,
  });
  const spots = useMemo(() => {
    const out = new Map<string, number>();
    if (book.data?.available) {
      for (const row of book.data.rows) if (row.spot !== undefined) out.set(row.symbol, row.spot);
    }
    return out;
  }, [book.data]);

  const live = decisions.filter((d) => !snoozed.includes(d.id));
  if (live.length === 0) return null;
  const at = Math.min(index, live.length - 1);
  const d = live[at] as Decision;
  const page = (step: number) => setIndex((at + step + live.length) % live.length);
  const snooze = () => {
    const next = [...snoozed, d.id];
    setSnoozed(next);
    writeSnoozed(accountId, next);
  };

  return (
    <section
      className="decisions"
      aria-label="Needs a decision"
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = undefined;
        if (start === undefined || end === undefined || Math.abs(end - start) < SWIPE_PX) return;
        page(end < start ? 1 : -1);
      }}
    >
      <header className="decisions-head">
        <span className="decisions-eyebrow">Needs a decision</span>
        <span className="decisions-count num" aria-live="polite">
          {at + 1} of {live.length}
        </span>
        <span className="decisions-dots" aria-hidden="true">
          {live.map((x, i) => (
            <span key={x.id} className={i === at ? "decisions-dot is-current" : "decisions-dot"} />
          ))}
        </span>
        <span className="decisions-order">most money at stake first</span>
        <span className="decisions-nav">
          <button type="button" aria-label="Previous decision" onClick={() => page(-1)}>
            ‹
          </button>
          <button type="button" aria-label="Next decision" onClick={() => page(1)}>
            ›
          </button>
        </span>
      </header>

      <article
        className={`decision decision--${d.kind}`}
        aria-label={`${KIND_LABEL[d.kind]}: ${d.display}`}
      >
        <div className="decision-main">
          <div className="decision-line">
            <span className="decision-sym">{d.display}</span>
            {d.plainName ? <span className="decision-plain">{d.plainName}</span> : null}
            <span className={`decision-pl num tone-${d.plTone}`}>{d.pl}</span>
          </div>
          {d.range ? <OutcomeRange range={d.range} spot={spots.get(d.symbol)} /> : null}
          <p className="decision-caption">{d.captionShort}</p>
        </div>
        <div className="decision-side">
          <div className="decision-kindline">
            <span className="decision-kind">{KIND_LABEL[d.kind]}</span>
            <button
              type="button"
              className="decision-snooze"
              aria-label="Not now"
              title="Not now"
              onClick={snooze}
            >
              ✕
            </button>
          </div>
          <h3 className="decision-title">{d.title}</h3>
          <div className="decision-actions">
            <button
              type="button"
              className="decision-why-toggle"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((o) => !o)}
            >
              ✦ Why, and details {detailsOpen ? "▴" : "▾"}
            </button>
            {d.secondary ? (
              <a className="decision-btn" href={d.secondary.href}>
                {d.secondary.label}
              </a>
            ) : null}
            <a className="decision-btn decision-btn--primary" href={d.primary.href}>
              {d.primary.label}
            </a>
          </div>
        </div>
        {detailsOpen ? (
          <div className="decision-details">
            <div>
              <p className="decision-caption-long">{d.caption}</p>
              <ul className="decision-clocks">
                {d.clocks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <p className="decision-why">{d.why}</p>
          </div>
        ) : null}
      </article>
    </section>
  );
}
