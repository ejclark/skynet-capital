import { fireEvent, render, screen } from "@testing-library/react";
import { parseResearchQuery, type ResearchEvent } from "../../src/live/research";
import { FacetRow } from "../../src/shell/facet-row";

// Three labelled facets beside the filter box; each writes one token of the query string.
const events: ResearchEvent[] = [
  {
    id: "cpi-2026-09-11",
    title: "CPI",
    date: "2026-09-11",
    kind: "macro-print",
    symbols: [],
    researched: true,
  },
  {
    id: "opex-2026-09-18",
    title: "Opex",
    date: "2026-09-18",
    kind: "opex",
    symbols: [],
    researched: false,
  },
];

function mount(query: string) {
  const writes: string[] = [];
  render(
    <FacetRow
      query={query}
      filter={parseResearchQuery(query)}
      events={events}
      onChange={(next) => writes.push(next)}
    />,
  );
  return writes;
}

describe("FacetRow", () => {
  it("reads the parsed query into its three facets and lists the served event kinds", () => {
    mount("sym:NVDA kind:opex impact:high call:watch lens:month");
    expect(screen.getByLabelText("Event")).toHaveValue("opex");
    expect(screen.getByLabelText("Impact")).toHaveValue("high");
    expect(screen.getByLabelText("Call")).toHaveValue("watch");
    expect(screen.getByRole("option", { name: "macro print" })).toBeInTheDocument();
  });

  it("writes exactly one token per change and leaves the rest of the string alone", () => {
    const writes = mount("sym:NVDA lens:month");
    fireEvent.change(screen.getByLabelText("Event"), { target: { value: "macro-print" } });
    fireEvent.change(screen.getByLabelText("Impact"), { target: { value: "" } });
    expect(writes).toEqual(["sym:NVDA lens:month kind:macro-print", "sym:NVDA lens:month"]);
  });

  it("reads 'any' on every facet when the query names none", () => {
    mount("");
    for (const label of ["Event", "Impact", "Call"]) {
      expect(screen.getByLabelText(label)).toHaveValue("");
    }
  });
});
