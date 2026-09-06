import { fireEvent, render, screen } from "@testing-library/react";
import { parseResearchQuery, type ResearchEvent } from "../../src/live/research";
import { ScopeSentence } from "../../src/shell/scope-sentence";

// The query string as a sentence (#1704 direction G): slots read the parsed query and write tokens.
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

function mount(query: string, dayFogReason?: string) {
  const writes: string[] = [];
  render(
    <ScopeSentence
      query={query}
      filter={parseResearchQuery(query)}
      events={events}
      {...(dayFogReason ? { dayFogReason } : {})}
      onChange={(next) => writes.push(next)}
    />,
  );
  return writes;
}

describe("ScopeSentence", () => {
  it("reads the parsed query into its slots and shows the token line", () => {
    mount("sym:NVDA sym:AVGO kind:opex call:watch lens:month");
    expect(screen.getByLabelText("Lens")).toHaveValue("month");
    expect(screen.getByLabelText("Event kind")).toHaveValue("opex");
    expect(screen.getByLabelText("Call class")).toHaveValue("watch");
    expect(screen.getByRole("link", { name: "NVDA, AVGO" })).toHaveAttribute("href", "#rx-symbols");
    expect(
      screen.getByText(/= sym:NVDA sym:AVGO kind:opex call:watch lens:month/),
    ).toBeInTheDocument();
  });

  it("writes exactly one token per slot change and leaves the rest of the string alone", () => {
    const writes = mount("sym:NVDA");
    fireEvent.change(screen.getByLabelText("Event kind"), { target: { value: "macro-print" } });
    fireEvent.change(screen.getByLabelText("Lens"), { target: { value: "quarter" } });
    expect(writes).toEqual(["sym:NVDA kind:macro-print", "sym:NVDA lens:quarter"]);
  });

  it("defaults to the week lens and reads 'all names' and 'everything' on an empty query", () => {
    mount("");
    expect(screen.getByLabelText("Lens")).toHaveValue("week");
    expect(screen.getByRole("link", { name: "all names" })).toBeInTheDocument();
    expect(screen.getByText(/= everything/)).toBeInTheDocument();
  });

  it("offers the day lens disabled with the fog reason while fogged", () => {
    mount("", "Held until rung 501 (zero-DTE)");
    const day = screen.getByRole("option", { name: "today's" });
    expect(day).toBeDisabled();
    expect(day).toHaveAttribute("title", "Held until rung 501 (zero-DTE)");
  });
});
