import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDeskActivity } from "../live/desk";
import { type FormClose, readForm, streakLabel } from "./form-data";

/**
 * FORM (#3689 slice 3b, design handoff 3a): the last closed trades as ✓/✕ squares in the net-worth
 * card's footer, with the current win run. Each square is a link to that trade's Activity row
 * (`#act-<orderId>`); hover or focus shows what it was. The glyph says win or loss, so the square
 * never relies on green versus red alone.
 *
 * Shares the `["desk-activity", id]` cache with the Trade page's recent-orders strip. Renders
 * nothing until there's at least one close: an empty strip reads like a losing record.
 */

const GLYPH = { win: "✓", loss: "✕", flat: "=" } as const;
const WORD = { win: "Win", loss: "Loss", flat: "Even" } as const;

function Square({
  close,
  accountId,
}: {
  readonly close: FormClose;
  readonly accountId: string;
}): ReactElement {
  return (
    <Link
      to="/accounts"
      search={{ account: accountId, section: "activity" }}
      hash={`act-${close.orderId}`}
      className={`form-sq form-sq--${close.result}`}
      aria-label={`Closed ${close.day}, ${WORD[close.result].toLowerCase()}: ${close.display}, ${close.pl}. Open this trade`}
    >
      <span aria-hidden="true">{GLYPH[close.result]}</span>
      <span className="form-pop" aria-hidden="true">
        <span className="form-pop-k">
          Closed {close.day} · {WORD[close.result]}
        </span>
        <span className="form-pop-name">{close.display}</span>
        <span
          className={`form-pop-pl num tone-${close.result === "win" ? "pos" : close.result === "loss" ? "neg" : "flat"}`}
        >
          {close.pl}
          {close.returnPct ? ` · ${close.returnPct}` : ""}
        </span>
        <span className="form-pop-open">Open this trade ↗</span>
      </span>
    </Link>
  );
}

export function FormStrip({ accountId }: { readonly accountId: string }): ReactElement | null {
  const activity = useQuery({
    queryKey: ["desk-activity", accountId],
    queryFn: () => fetchDeskActivity(accountId),
    staleTime: 30_000,
  });
  if (!activity.data?.available) return null;
  const form = readForm(activity.data.activity);
  if (form.closes.length === 0) return null;
  const run = streakLabel(form.streak);

  return (
    <div className="form-strip">
      <span className="form-eyebrow">Form</span>
      <span className="form-summary">
        {run ? <b>{run}</b> : null}
        {run ? " · " : null}
        best {form.best} in your last {form.seen} closes
      </span>
      <div className="form-squares">
        {form.closes.map((c) => (
          <Square key={c.orderId} close={c} accountId={accountId} />
        ))}
      </div>
    </div>
  );
}
