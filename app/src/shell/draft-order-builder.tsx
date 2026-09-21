import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import {
  addDraftLeg,
  type DraftOrder,
  type DraftPreview,
  emptyDraft,
  type NewLeg,
  removeDraftLeg,
  repriceDraftLeg,
  reviewDraft,
  submitDraftOrder,
  validateDraft,
} from "../live/draft-order";
import { money, type TicketTimeInForce, tifLabel } from "../live/ticket";
import { DraftLegForm } from "./draft-leg-form";
import { LegRow } from "./draft-leg-row";

import { DisarmNote, GateHead } from "./gate-frame";
import { TimeInForceField } from "./tif-field";

/**
 * THE MULTI-LEG BUILDER (#582, slices 3-4) — an "add leg" action off the same chain the single-
 * leg ticket already renders (`DraftLegForm`), mutating one `DraftOrder` (`src/trading/
 * draft-order.ts`, slice 1) through `/api/trade/draft` end to end: add/remove a leg, validate
 * against the live account (slice 2), review the payoff for whatever leg set resulted (slice 3),
 * then confirm. Every response IS the state machine's own answer — this component never computes
 * a phase transition itself, only renders the one the server just produced.
 */

/** Exported alongside `ReviewBody` for a `scripts/shoot/draft-builder.mjs` (docs/shots/pr-<n>) —
 *  the house's static-fixture screenshot convention (`scripts/shoot/`, docs/PICTURES.md) applied to
 *  a client React component instead of a server-rendered view. That script isn't written yet; the
 *  harness it would sit on is, so it is now a copy of `scripts/shoot/feedback.mjs` away. */
/** The running net while the order is still being built (#3407 P3 slice 4; Fidelity's net
 *  Bid/Mid/Ask row): the same server number the review will show, one line, so repricing a leg
 *  is judged by its effect before the review screen. Silent once reviewed (the grid has it). */
function RunningNet({
  draft,
  preview,
}: {
  readonly draft: DraftOrder;
  readonly preview: DraftPreview | undefined;
}): ReactElement | null {
  if (!preview || preview.netPremium === undefined || draft.legs.length < 2) return null;
  if (draft.phase === "reviewed" || draft.phase === "submitted") return null;
  const flow = preview.netPremium >= 0 ? "credit" : "debit";
  return (
    <p className="draft-net num">
      Running net {flow} {money(Math.abs(preview.netPremium))}
      {preview.pricedFully ? "" : " — an unpriced leg counts as $0 until it's priced"}
    </p>
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
 *  anatomy `OptionPreviewBody` renders for the single-leg ticket, extended to a leg array.
 *
 *  @category trading
 */
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

/** The gate's status line — a small, pure mapping from phase/refusals to tone + headline.
 *  `executed` is the server's own word on whether the submit reached the broker (#3407 P0; the
 *  study's audit found "Confirmed" over an order the deployment had refused to send): only a
 *  true value earns the filled tone; anything else is "reviewed, not sent", in those words. */
export function gateStatus(
  draft: DraftOrder,
  executed?: boolean,
): { tone: string; headline: string } {
  if (draft.phase === "submitted") {
    return executed === true
      ? { tone: "filled", headline: "Confirmed" }
      : { tone: "checks", headline: "Reviewed — not sent" };
  }
  if (draft.phase === "reviewed") return { tone: "ready", headline: "Reviewed — ready to confirm" };
  if (draft.refusals.length > 0) {
    return { tone: "refused", headline: draft.refusals[0] ?? "Refused" };
  }
  if (draft.phase === "validated") {
    return { tone: "checks", headline: "Validated — open the review screen" };
  }
  return { tone: "draft", headline: "Building — add at least two legs" };
}
/** The multi-leg draft ticket end to end — leg entry, validation, review, submit.
 *
 *  @category trading
 */
export function DraftOrderBuilder({ deskId }: { readonly deskId: string }): ReactElement {
  const [draft, setDraft] = useState<DraftOrder>(emptyDraft());
  const [preview, setPreview] = useState<DraftPreview | undefined>(undefined);
  const [note, setNote] = useState<string | undefined>(undefined);
  const [executed, setExecuted] = useState<boolean | undefined>(undefined);
  const [timeInForce, setTimeInForce] = useState<TicketTimeInForce | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const apply = async (
    run: () => Promise<{
      draft: DraftOrder;
      preview: DraftPreview;
      note?: string;
      executed?: boolean;
    }>,
  ) => {
    setBusy(true);
    try {
      const res = await run();
      setDraft(res.draft);
      setPreview(res.preview);
      if (res.note !== undefined) setNote(res.note);
      if (res.executed !== undefined) setExecuted(res.executed);
      // A sent spread is a working order until it fills — the list under the ticket re-reads
      // now rather than on its next poll (#3407 P3 slice 1).
      if (res.executed === true) {
        void queryClient.invalidateQueries({ queryKey: ["desk-orders", deskId] });
      }
    } finally {
      setBusy(false);
    }
  };

  const addLeg = (leg: NewLeg) => void apply(() => addDraftLeg(deskId, draft, leg));
  const remove = (id: string) => void apply(() => removeDraftLeg(deskId, draft, id));
  const reprice = (id: string, limitPrice: number | undefined) =>
    void apply(() => repriceDraftLeg(deskId, draft, id, limitPrice));
  const validate = () => void apply(() => validateDraft(deskId, draft));
  const review = () => void apply(() => reviewDraft(deskId, draft));
  const confirm = () => void apply(() => submitDraftOrder(deskId, draft, timeInForce));
  const startOver = () => {
    setDraft(emptyDraft());
    setPreview(undefined);
    setNote(undefined);
    setExecuted(undefined);
    setTimeInForce(undefined);
  };

  const editable = draft.phase !== "reviewed" && draft.phase !== "submitted";
  const { tone, headline } = gateStatus(draft, executed);

  return (
    <section className="panel gate-panel" aria-label="Multi-leg order builder">
      <h2 className="panel-title">Multi-leg builder</h2>
      <p className="panel-sub">
        Add legs from the chain below — a vertical spread is two, an iron condor is four.
      </p>

      {editable ? <DraftLegForm busy={busy} legs={draft.legs} onAdd={addLeg} /> : null}

      {draft.legs.length > 0 ? (
        <ul className="draft-leg-list">
          {draft.legs.map((leg) => (
            <LegRow
              key={leg.id}
              leg={leg}
              busy={busy || !editable}
              onRemove={() => remove(leg.id)}
              onReprice={(price) => reprice(leg.id, price)}
            />
          ))}
        </ul>
      ) : (
        <p className="tkt-note">No legs yet — add at least two to build a spread.</p>
      )}
      <RunningNet draft={draft} preview={preview} />

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
        <>
          <TimeInForceField fallback="day" value={timeInForce} onChange={setTimeInForce} />
          <button type="button" className="btn btn-primary" disabled={busy} onClick={confirm}>
            Confirm order · {tifLabel(timeInForce ?? "day")}
          </button>
        </>
      ) : null}
      {draft.phase === "submitted" ? (
        <button type="button" className="btn" onClick={startOver}>
          Start another draft
        </button>
      ) : null}
    </section>
  );
}
