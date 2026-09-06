import type { ReactElement } from "react";
import { useId } from "react";
import { CALL_CLASS_LABEL, CALL_CLASSES } from "../live/call-mix";
import { type Facet, type ResearchEvent, type ResearchFilter, setFacet } from "../live/research";

/**
 * THE FACET ROW — three labelled selects (Event · Impact · Call) beside the filter box. Each
 * writes exactly one token of the page's ONE query string (`kind:` `impact:` `call:`); nothing
 * here is state. It replaces the scope sentence of #1753 (direction G): rendered live, the prose
 * form read "like broken english resembling the anatomy of a SQL" to its author (Eric,
 * 2026-09-06) — the lens and the names were already controls on the rail and the chips, so the
 * sentence repeated them, and its `= lens:day` token line was a grammar lesson only an engineer
 * wanted. The facets it introduced were the useful part; this is them, in the shape every
 * catalogue filter uses, so no member has to learn a grammar to narrow the board.
 */

const IMPACTS = ["critical", "high", "medium", "low"] as const;

function FacetSelect({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { value: string; text: string }[];
  readonly onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <span className="rx-facet">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.text}
          </option>
        ))}
      </select>
    </span>
  );
}

export function FacetRow({
  query,
  filter,
  events,
  onChange,
}: {
  readonly query: string;
  readonly filter: ResearchFilter;
  readonly events: readonly ResearchEvent[];
  readonly onChange: (next: string) => void;
}): ReactElement {
  const kinds = [
    ...new Set(events.map((e) => e.kind).filter((k): k is string => Boolean(k))),
  ].sort();
  const facet = (name: Facet) => (value: string) =>
    onChange(setFacet(query, name, value === "" ? undefined : value));
  return (
    <div className="rx-facets">
      <FacetSelect
        label="Event"
        value={filter.kind ?? ""}
        options={[
          { value: "", text: "any" },
          ...kinds.map((k) => ({ value: k, text: k.replace(/-/g, " ") })),
        ]}
        onChange={facet("kind")}
      />
      <FacetSelect
        label="Impact"
        value={filter.impact ?? ""}
        options={[{ value: "", text: "any" }, ...IMPACTS.map((i) => ({ value: i, text: i }))]}
        onChange={facet("impact")}
      />
      <FacetSelect
        label="Call"
        value={filter.callClass ?? ""}
        options={[
          { value: "", text: "any" },
          ...CALL_CLASSES.map((c) => ({ value: c, text: CALL_CLASS_LABEL[c] })),
        ]}
        onChange={facet("call")}
      />
    </div>
  );
}
