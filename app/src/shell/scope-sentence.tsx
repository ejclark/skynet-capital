import type { ReactElement } from "react";
import { useId } from "react";
import { CALL_CLASS_LABEL, CALL_CLASSES } from "../live/call-mix";
import {
  type Facet,
  LENS_LABEL,
  LENSES,
  type Lens,
  type ResearchEvent,
  type ResearchFilter,
  setFacet,
  setLens,
} from "../live/research";

/**
 * THE SCOPE SENTENCE (#1704 direction G — Eric, 2026-09-06: "I don't want to box you in on
 * established patterns"). The research page's control is ONE query string with named dimensions
 * (`lens:` `sym:` `kind:` `impact:` `call:` `on:`); this renders that string as a sentence whose
 * slots are native <select>s styled as pills, so a novice reads what the board is showing and
 * changes it by tapping, while an expert types the same tokens into the filter below. Both write
 * the same string; nothing here is state. The token line under the sentence teaches the grammar.
 *
 * The symbols slot is a pointer, not an editor: the chips already edit the OR scope, so the slot
 * names them and scrolls to them rather than duplicating a second control for one dimension.
 */

const IMPACTS = ["critical", "high", "medium", "low"] as const;

function Slot({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { value: string; text: string; disabled?: boolean; title?: string }[];
  readonly onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <span className="rx-slot">
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled} title={o.title}>
            {o.text}
          </option>
        ))}
      </select>
    </span>
  );
}

export function ScopeSentence({
  query,
  filter,
  events,
  dayFogReason,
  onChange,
}: {
  readonly query: string;
  readonly filter: ResearchFilter;
  readonly events: readonly ResearchEvent[];
  /** Present while the day lens is fogged — the option is offered disabled with this reason. */
  readonly dayFogReason?: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const kinds = [
    ...new Set(events.map((e) => e.kind).filter((k): k is string => Boolean(k))),
  ].sort();
  const facet = (name: Facet) => (value: string) =>
    onChange(setFacet(query, name, value === "" ? undefined : value));
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  return (
    <section className="rx-sentence" aria-label="What the board shows">
      <p className="rx-sentence-text">
        Show{" "}
        <Slot
          label="Lens"
          value={filter.lens}
          options={LENSES.map((lens: Lens) => ({
            value: lens,
            text: lens === "day" ? "today's" : `${LENS_LABEL[lens]}'s`,
            ...(lens === "day" && dayFogReason ? { disabled: true, title: dayFogReason } : {}),
          }))}
          onChange={(value) => onChange(setLens(query, value as Lens))}
        />{" "}
        calls for{" "}
        <a className="rx-slot rx-slot-link" href="#rx-symbols">
          {filter.symbols.length > 0 ? filter.symbols.join(", ") : "all names"}
        </a>{" "}
        on{" "}
        <Slot
          label="Event kind"
          value={filter.kind ?? ""}
          options={[
            { value: "", text: "any event" },
            ...kinds.map((k) => ({ value: k, text: k.replace(/-/g, " ") })),
          ]}
          onChange={facet("kind")}
        />{" "}
        at{" "}
        <Slot
          label="Impact"
          value={filter.impact ?? ""}
          options={[
            { value: "", text: "any impact" },
            ...IMPACTS.map((i) => ({ value: i, text: `${i} impact` })),
          ]}
          onChange={facet("impact")}
        />{" "}
        that say{" "}
        <Slot
          label="Call class"
          value={filter.callClass ?? ""}
          options={[
            { value: "", text: "anything" },
            ...CALL_CLASSES.map((c) => ({ value: c, text: CALL_CLASS_LABEL[c] })),
          ]}
          onChange={facet("call")}
        />
        .
      </p>
      <p className="rx-sentence-tokens num">
        = {tokens.length > 0 ? tokens.join(" ") : "everything (lens:week by default)"}
      </p>
    </section>
  );
}
