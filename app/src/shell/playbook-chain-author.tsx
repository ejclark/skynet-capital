import { type ReactElement, useId, useState } from "react";
import { HANDOFF_EVENTS, type HandoffKind, MAX_LINKS } from "../../../src/playbooks/chain";
import {
  CHAINABLE_IDS,
  type ChainForm,
  type ChainLinkForm,
  type ChainRefusal,
  chainFromForm,
  EVENT_WORDS,
  emptyChainForm,
  eventsFor,
  MAX_TITLE_LENGTH,
  nameOf,
  nextPlaybookMenu,
} from "../../../src/playbooks/chain-form";
import { type MemberChainView, saveChainRequest } from "../live/playbook-chains";
import { InlineResult } from "../ui";

/**
 * THE CHAIN FORM (#6959 slice 3b) — a member draws a chain of playbooks: which playbook starts, what
 * has to happen to its position, and which playbook takes over. Then they give it a one-line name
 * and save it SHADOW ONLY (criterion 5): a saved chain is a record that trades nothing, said once
 * under the button.
 *
 * ONE JUDGE. After every pick the form asks `chainFromForm` — the function the save runs on the
 * server — so a refusal shows under its link the moment the picks make a link, and the server's
 * answer can only repeat what the screen already said. The next-playbook menu is drawn by
 * `nextPlaybookMenu`, which names the refusals BEFORE the pick: a playbook that can't hold what it
 * would be handed is in the list, marked, with its reason one tap away, never silently missing.
 * A refusal rides a ✕ and a sentence, never a colour alone.
 *
 * CLOSED MENU, NO CONDITIONS. Each link is three picks from lists (a playbook, an event from
 * `HANDOFF_EVENTS`, a playbook) and, for "a date arrives", a date. There is no free text but the
 * name, so "if the price is still low" cannot be typed: it is a condition, not an event.
 *
 * PHONE FIRST. One column at 390px: the name, then each link as a card of three stacked picks. A wide
 * container only lets the three picks sit in a row — no new fields.
 */

const QUEUED_LINK: ChainLinkForm = { from: "", on: "", date: "", to: "" };

/** The playbooks a link may start from: the chain's first (any playbook that reaches an event), then
 *  only those an earlier link has handed a position to — "each link starts from an earlier one". */
function startsFor(links: readonly ChainLinkForm[], i: number): readonly string[] {
  if (i === 0) return CHAINABLE_IDS.filter((id) => eventsFor(id).length > 1);
  const owned = new Set<string>();
  const first = links[0]?.from;
  if (first) owned.add(first);
  for (const link of links.slice(0, i)) if (link.to) owned.add(link.to);
  return CHAINABLE_IDS.filter((id) => owned.has(id) && eventsFor(id).length > 1);
}

const isWhole = (l: ChainLinkForm): boolean =>
  l.from !== "" && l.on !== "" && l.to !== "" && (l.on !== "on-date" || l.date !== "");

function Reason({ refusals }: { readonly refusals: readonly ChainRefusal[] }): ReactElement | null {
  return refusals.length > 0 ? (
    <>
      {refusals.map((r) => (
        <InlineResult key={r.reason} as="p" tone="err" live={false} className="pba-reason">
          {r.reason}
        </InlineResult>
      ))}
    </>
  ) : null;
}

export function AuthorChain({
  editing,
  onSaved,
  onCancel,
  onDiscard,
  discarding = false,
}: {
  /** The chain being changed. Absent = a new chain. */
  readonly editing?: MemberChainView;
  readonly onSaved: (chain: MemberChainView) => void;
  readonly onCancel: () => void;
  /** Throw the chain away (Change only); asks once here before it calls. */
  readonly onDiscard?: (id: string) => void;
  readonly discarding?: boolean;
}): ReactElement {
  const titleId = useId();
  const [form, setForm] = useState<ChainForm>(() => editing?.form ?? emptyChainForm());
  const [titleTouched, setTitleTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [said, setSaid] = useState<readonly ChainRefusal[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  const verdict = chainFromForm(form, "Member");
  const refusals = verdict.ok ? [] : verdict.refusals;
  // The server's last answer stays until the form changes again.
  const heard = (field: string) => said.filter((r) => r.field === field);

  const change = (next: ChainForm) => {
    setForm(next);
    setSaid([]);
    setError(undefined);
  };
  const setLink = (i: number, patch: Partial<ChainLinkForm>) =>
    change({
      ...form,
      links: form.links.map((l, at) => {
        if (at !== i) return l;
        const merged = { ...l, ...patch };
        // A new giver or event can leave the old picks meaningless: clear what no longer fits.
        const events = eventsFor(merged.from);
        const on = merged.on !== "" && !events.includes(merged.on) ? "" : merged.on;
        return { ...merged, on };
      }),
    });
  const addLink = () => change({ ...form, links: [...form.links, QUEUED_LINK] });
  const removeLink = (i: number) =>
    change({ ...form, links: form.links.filter((_, at) => at !== i) });

  /** What a link says now: the server's answer, else its own refusals once the picks are whole (or
   *  after Save is tapped) — a half-filled link is not yet wrong. */
  const linkRefusals = (i: number): readonly ChainRefusal[] => {
    const field = `link.${i}`;
    const server = heard(field);
    if (server.length > 0) return server;
    const link = form.links[i];
    return attempted || (link && isWhole(link)) ? refusals.filter((r) => r.field === field) : [];
  };

  const save = async () => {
    setAttempted(true);
    if (!verdict.ok) return;
    setBusy(true);
    setError(undefined);
    try {
      const answer = await saveChainRequest(form, editing?.id);
      if (answer.ok) onSaved(answer.chain);
      else if (answer.refusals && answer.refusals.length > 0) setSaid(answer.refusals);
      else setError(answer.error ?? "It couldn't be saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const shownOn = (field: "title" | "links", asked: boolean): readonly ChainRefusal[] =>
    heard(field).length > 0 ? heard(field) : asked ? refusals.filter((r) => r.field === field) : [];
  const titleRefusals = shownOn("title", attempted || titleTouched);
  const listRefusals = shownOn("links", attempted);

  return (
    <form
      className="pba-form pbc-form"
      noValidate
      aria-label={editing ? `Change ${editing.title}` : "New chain"}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="pba-col">
        <div className="field">
          <label htmlFor={titleId}>What the chain does</label>
          <input
            id={titleId}
            value={form.title}
            maxLength={MAX_TITLE_LENGTH + 20}
            autoComplete="off"
            placeholder="Sell a CRWV put; if it expires, a long call takes the cash"
            disabled={busy}
            aria-invalid={titleRefusals.length > 0 ? true : undefined}
            onChange={(e) => change({ ...form, title: e.target.value })}
            onBlur={() => setTitleTouched(true)}
          />
          <Reason refusals={titleRefusals} />
        </div>

        <ol className="pbc-links">
          {form.links.map((link, i) => (
            <ChainLinkCard
              // biome-ignore lint/suspicious/noArrayIndexKey: a link has no identity but its place
              key={i}
              index={i}
              link={link}
              starts={startsFor(form.links, i)}
              refusals={linkRefusals(i)}
              busy={busy}
              onChange={(patch) => setLink(i, patch)}
              onRemove={form.links.length > 1 ? () => removeLink(i) : undefined}
            />
          ))}
        </ol>
        <Reason refusals={listRefusals} />
        {form.links.length < MAX_LINKS ? (
          <button type="button" className="btn mc-btn pbc-add" disabled={busy} onClick={addLink}>
            <span aria-hidden="true">+</span> Add a link
          </button>
        ) : (
          <p className="pba-hint">A chain has at most {MAX_LINKS} links.</p>
        )}

        <div className="pba-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Save chain"}
          </button>
          <button type="button" className="btn mc-btn" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
        <p className="pba-hint">A saved chain is shadow only — it doesn't trade.</p>
        {editing && onDiscard ? (
          asking ? (
            <fieldset className="pba-discard">
              <legend>Discard {editing.title}?</legend>
              <button
                type="button"
                className="btn mc-btn"
                disabled={discarding}
                onClick={() => onDiscard(editing.id)}
              >
                {discarding ? "Discarding…" : "Discard"}
              </button>
              <button type="button" className="btn mc-btn" onClick={() => setAsking(false)}>
                Keep
              </button>
            </fieldset>
          ) : (
            <button
              type="button"
              className="btn mc-btn pba-discard-ask"
              disabled={busy}
              onClick={() => setAsking(true)}
            >
              Discard chain
            </button>
          )
        ) : null}
        {error ? (
          <InlineResult as="p" tone="err">
            {error}
          </InlineResult>
        ) : null}
      </div>
    </form>
  );
}

function ChainLinkCard({
  index,
  link,
  starts,
  refusals,
  busy,
  onChange,
  onRemove,
}: {
  readonly index: number;
  readonly link: ChainLinkForm;
  readonly starts: readonly string[];
  readonly refusals: readonly ChainRefusal[];
  readonly busy: boolean;
  readonly onChange: (patch: Partial<ChainLinkForm>) => void;
  readonly onRemove: (() => void) | undefined;
}): ReactElement {
  const ids = { from: useId(), on: useId(), date: useId(), to: useId() };
  const events: readonly HandoffKind[] = link.from ? eventsFor(link.from) : [];
  // The menu is drawn only once the giver and the event are known: a refusal depends on both.
  const nexts = link.from && link.on ? nextPlaybookMenu(link.from, link.on) : [];
  const refused = nexts.filter((n) => n.refused);
  return (
    <li className="pbc-link" aria-label={`Link ${index + 1}`}>
      <div className="pbc-link-head">
        <b>Link {index + 1}</b>
        {onRemove ? (
          <button
            type="button"
            className="btn mc-btn pbc-remove"
            disabled={busy}
            aria-label={`Remove link ${index + 1}`}
            onClick={onRemove}
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="pbc-picks">
        <div className="field">
          <label htmlFor={ids.from}>{index === 0 ? "Starts with" : "Handed to"}</label>
          <select
            id={ids.from}
            value={link.from}
            disabled={busy}
            onChange={(e) => onChange({ from: e.target.value })}
          >
            <option value="">Pick a playbook</option>
            {starts.map((id) => (
              <option key={id} value={id}>
                {nameOf(id)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={ids.on}>When</label>
          <select
            id={ids.on}
            value={link.on}
            disabled={busy || !link.from}
            onChange={(e) => onChange({ on: e.target.value as HandoffKind | "" })}
          >
            <option value="">{link.from ? "Pick what happens" : "Pick a playbook first"}</option>
            {HANDOFF_EVENTS.filter((k) => events.includes(k)).map((k) => (
              <option key={k} value={k}>
                {EVENT_WORDS[k]}
              </option>
            ))}
          </select>
        </div>
        {link.on === "on-date" ? (
          <div className="field">
            <label htmlFor={ids.date}>Date</label>
            <input
              id={ids.date}
              className="num"
              value={link.date}
              inputMode="numeric"
              placeholder="2027-01-15"
              maxLength={10}
              autoComplete="off"
              disabled={busy}
              onChange={(e) => onChange({ date: e.target.value.trim() })}
            />
          </div>
        ) : null}
        <div className="field">
          <label htmlFor={ids.to}>Then takes over</label>
          <select
            id={ids.to}
            value={link.to}
            disabled={busy || !link.on}
            onChange={(e) => onChange({ to: e.target.value })}
          >
            <option value="">
              {link.on ? "Pick the next playbook" : "Pick what happens first"}
            </option>
            {nexts.map((n) => (
              <option key={n.id} value={n.id}>
                {n.refused ? `${n.name} — can't take this over` : n.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {refused.length > 0 ? (
        <details className="pbc-why">
          <summary>
            Why {refused.length === 1 ? "one playbook" : `${refused.length} playbooks`} can't take
            this over
          </summary>
          <ul>
            {refused.map((n) => (
              <li key={n.id}>{n.refused}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <Reason refusals={refusals} />
    </li>
  );
}
