import type { ReactElement } from "react";
import { useState } from "react";
import {
  addDraftLeg,
  type DraftLeg,
  type DraftOrder,
  type DraftPreview,
  emptyDraft,
  type NewLeg,
  removeDraftLeg,
  reviewDraft,
  submitDraftOrder,
  validateDraft,
} from "../live/draft-order";
import { money } from "../live/ticket";
import { DraftLegForm } from "./draft-leg-form";
import { DisarmNote, GateHead } from "./gate-frame";

/**
 * THE MULTI-LEG BUILDER (#582, slices 3-4) — an "add leg" action off the same chain the single-
 * leg ticket already renders (`DraftLegForm`), mutating one `DraftOrder` (`src/trading/
 * draft-order.ts`, slice 1) through `/api/trade/draft` end to end: add/remove a leg, validate
 * against the live account (slice 2), review the payoff for whatever leg set resulted (slice 3),
 * then confirm. Every response IS the state machine's own answer — this component never computes
 * a phase transition itself, only renders the one the server just produced.
 */

/** Exported alongside `ReviewBody` for `scripts/shoot-draft-builder.mjs` (docs/shots/pr-<n>) — the
 *  house's static-fixture screenshot convention (see `shoot-standings.mjs`) applied to a client
 *  React component instead of a server-rendered view. */
export function legLabel(leg: DraftLeg): string {
  const side = leg.action === "sell" ? "Sell" : "Buy";
  const type = leg.optionType === "call" ? "C" : "P";
  return `${side} ${leg.contracts} ${leg.underlying} $${leg.strike}${type} ${leg.expiration}`;
}

export function LegRow({
  leg,
  busy,
  onRemove,
}: {
  readonly leg: DraftLeg;
  readonly busy: boolean;
  readonly onRemove: () => void;
}): ReactElement {
  return (
    <li className="draft-leg-row">
      <span className="draft-leg-label">{legLabel(leg)}</span>
      <span className="draft-leg-price num">
        {leg.limitPrice !== undefined ? `${money(leg.limitPrice)}/sh` : "at market"}
      </span>
      <button type="button" className="draft-leg-remove" disabled={busy} onClick={onRemove}>
        Remove
      </button>
    </li>
  );
}

/** The unlimited-loss banner the EARS criterion asks for: a sentence, never a numeric
 *  placeholder, and rendered where it can't be missed — above the payoff grid, not inside it. */
function UnlimitedLossBanner({ preview }: { readonly preview: DraftPreview }): ReactElement | null {
  if (!preview.unlimitedLoss) return null;
  return (
    <p className="draft-risk-banner">
      ⚠ Unlimited loss potential — {preview.undefinedRiskLegIds.length} leg
      {preview.undefinedRiskLegIds.length === 1 ? "" : "s"} in this order can lose more than the
      premium collected, with no cap. This desk shows "unlimited," never a number, because there
      isn't a true maximum to show.
    </p>
  );
}

function PayoffGrid({ preview }: { readonly preview: DraftPreview }): ReactElement {
  const flow = (preview.netPremium ?? 0) >= 0 ? "Est. net credit" : "Est. net debit";
  return (
    <dl className="gate-est">
      {preview.netPremium !== undefined ? (
        <div>
          <dt>{flow}</dt>
          <dd className="num">{money(Math.abs(preview.netPremium))}</dd>
        </div>
      ) : null}
      <div>
        <dt>Max gain</dt>
        <dd className="num">
          {preview.maxGain === "uncapped" ? "Uncapped" : money(preview.maxGain)}
        </dd>
      </div>
      <div>
        <dt>Max loss</dt>
        <dd className="num">
          {preview.maxLoss === "unlimited" ? "Unlimited" : money(preview.maxLoss)}
        </dd>
      </div>
    </dl>
  );
}

/** The review body: refusals, warnings, the unlimited-loss banner, and the payoff grid — the same
 *  anatomy `OptionPreviewBody` renders for the single-leg ticket, extended to a leg array. */
export function ReviewBody({
  draft,
  preview,
  note,
}: {
  readonly draft: DraftOrder;
  readonly preview: DraftPreview | undefined;
  readonly note: string | undefined;
}): ReactElement {
  return (
    <>
      {draft.refusals.length > 0 ? (
        <div className="gate-body">
          {draft.refusals.map((r) => (
            <p key={r} className="gate-row gate-refusal">
              ✕ {r}
            </p>
          ))}
        </div>
      ) : null}
      {draft.verdict?.warnings.length ? (
        <div className="gate-body">
          {draft.verdict.warnings.map((w) => (
            <p key={w} className="gate-row gate-warning">
              ⚠ {w}
            </p>
          ))}
        </div>
      ) : null}
      {preview && (draft.phase === "reviewed" || draft.phase === "submitted") ? (
        <div className="gate-body">
          <UnlimitedLossBanner preview={preview} />
          <PayoffGrid preview={preview} />
          {!preview.pricedFully ? (
            <p className="gate-note">
              One or more legs has no limit price — the numbers above assume $0 for that leg until
              it's priced.
            </p>
          ) : null}
          <DisarmNote />
        </div>
      ) : null}
      {note ? (
        <div className="gate-body">
          <p className="gate-note">{note}</p>
        </div>
      ) : null}
    </>
  );
}

/** The gate's status line — a small, pure mapping from phase/refusals to tone + headline. */
export function gateStatus(draft: DraftOrder): { tone: string; headline: string } {
  if (draft.phase === "submitted") return { tone: "filled", headline: "Confirmed" };
  if (draft.phase === "reviewed") return { tone: "ready", headline: "Reviewed — ready to confirm" };
  if (draft.refusals.length > 0) {
    return { tone: "refused", headline: draft.refusals[0] ?? "Refused" };
  }
  if (draft.phase === "validated") {
    return { tone: "checks", headline: "Validated — open the review screen" };
  }
  return { tone: "draft", headline: "Building — add at least two legs" };
}

export function DraftOrderBuilder({ deskId }: { readonly deskId: string }): ReactElement {
  const [draft, setDraft] = useState<DraftOrder>(emptyDraft());
  const [preview, setPreview] = useState<DraftPreview | undefined>(undefined);
  const [note, setNote] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const apply = async (
    run: () => Promise<{ draft: DraftOrder; preview: DraftPreview; note?: string }>,
  ) => {
    setBusy(true);
    try {
      const res = await run();
      setDraft(res.draft);
      setPreview(res.preview);
      if (res.note !== undefined) setNote(res.note);
    } finally {
      setBusy(false);
    }
  };

  const addLeg = (leg: NewLeg) => void apply(() => addDraftLeg(deskId, draft, leg));
  const remove = (id: string) => void apply(() => removeDraftLeg(deskId, draft, id));
  const validate = () => void apply(() => validateDraft(deskId, draft));
  const review = () => void apply(() => reviewDraft(deskId, draft));
  const confirm = () => void apply(() => submitDraftOrder(deskId, draft));
  const startOver = () => {
    setDraft(emptyDraft());
    setPreview(undefined);
    setNote(undefined);
  };

  const editable = draft.phase !== "reviewed" && draft.phase !== "submitted";
  const { tone, headline } = gateStatus(draft);

  return (
    <section className="panel gate-panel" aria-label="Multi-leg order builder">
      <h2 className="panel-title">Multi-leg builder</h2>
      <p className="panel-sub">
        Add legs from the chain below — a vertical spread is two, an iron condor is four.
      </p>

      {editable ? <DraftLegForm busy={busy} onAdd={addLeg} /> : null}

      {draft.legs.length > 0 ? (
        <ul className="draft-leg-list">
          {draft.legs.map((leg) => (
            <LegRow
              key={leg.id}
              leg={leg}
              busy={busy || !editable}
              onRemove={() => remove(leg.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="tkt-note">No legs yet — add at least two to build a spread.</p>
      )}

      <div className="gate" aria-live="polite">
        <GateHead tone={tone}>{headline}</GateHead>
        <ReviewBody draft={draft} preview={preview} note={note} />
      </div>

      {draft.phase === "drafting" && draft.legs.length >= 2 ? (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={validate}>
          Validate against account
        </button>
      ) : null}
      {draft.phase === "validated" ? (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={review}>
          Review order
        </button>
      ) : null}
      {draft.phase === "reviewed" ? (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={confirm}>
          Confirm order
        </button>
      ) : null}
      {draft.phase === "submitted" ? (
        <button type="button" className="btn" onClick={startOver}>
          Start another draft
        </button>
      ) : null}
    </section>
  );
}
