import { fireEvent, render, screen } from "@testing-library/react";
import type { ChainQuoteCoverage } from "../../src/live/options";
import { ageWords, ChainAsOf, chainAsOf } from "../../src/shell/chain-as-of";

/**
 * The chain's as-of stamp (#4327): WHEN the chain refreshes, it is stamped with the time the
 * server fetched it (Eastern, to the second), and the words say how far to trust it — a delayed
 * feed is never called live, stale data says so, and colour never carries the state alone.
 */

const fetchedAt = "2026-09-30T18:32:05Z"; // 14:32:05 ET (EDT)
const base: ChainQuoteCoverage = {
  source: "indicative",
  quoted: 38,
  total: 41,
  asOf: fetchedAt,
  quotedAt: "2026-09-30T18:30:05Z",
};
const at = (iso: string) => new Date(iso);

describe("chainAsOf", () => {
  it("stamps the fetch time in Eastern, to the second", () => {
    expect(chainAsOf(base, at(fetchedAt), true).stamp).toBe("as of 14:32:05 ET");
  });

  it("calls an in-session indicative chain delayed — never live — with the quote age", () => {
    const view = chainAsOf(base, at("2026-09-30T18:33:00Z"), true);
    expect(view.state).toBe("delayed");
    expect(view.detail).toContain("Delayed feed, not the full market");
    expect(view.detail).toContain("quotes about 3 min old");
    expect(view.detail).toContain("not live");
    expect(view.detail).not.toMatch(/\blive\b(?<!not live)/i);
  });

  it("reads stale in session once the feed's quotes are over 15 minutes old", () => {
    const old = { ...base, quotedAt: "2026-09-30T18:00:00Z" };
    const view = chainAsOf(old, at(fetchedAt), true);
    expect(view.state).toBe("stale");
    expect(view.detail).toContain("Stale — quotes about 32 min old");
    expect(view.detail).toContain("Refresh");
  });

  it("reads stale when a fresh fetch has sat on screen past 15 minutes", () => {
    const view = chainAsOf(base, at("2026-09-30T18:50:00Z"), true);
    expect(view.state).toBe("stale");
    expect(view.detail).toContain("fetched 18 min ago");
  });

  it("out of session, the last session's quotes are honest — labelled closed, not live", () => {
    const view = chainAsOf(base, at("2026-09-30T22:00:00Z"), false);
    expect(view.state).toBe("closed");
    expect(view.detail).toContain("Market closed — delayed quotes from the last session");
  });

  it("out of session, quotes spanning a missing session are stale", () => {
    const view = chainAsOf(base, at("2026-10-06T22:00:00Z"), false);
    expect(view.state).toBe("stale");
  });

  it("says plainly when the feed quoted nothing", () => {
    const view = chainAsOf({ ...base, source: "unavailable", quoted: 0 }, at(fetchedAt), true);
    expect(view.state).toBe("unquoted");
    expect(view.detail).toContain("premiums are last close");
  });

  it("admits a missing quote time instead of inventing one", () => {
    const { quotedAt: _, ...noStamp } = base;
    const view = chainAsOf(noStamp, at("2026-09-30T18:33:00Z"), true);
    expect(view.detail).toContain("the feed sent no quote times");
    expect(chainAsOf({ ...noStamp, asOf: "x" }, at(fetchedAt), true).stamp).toBe(
      "as of an unknown time",
    );
  });

  it("words ages at a glance", () => {
    expect(ageWords(20_000)).toBe("under a minute");
    expect(ageWords(5 * 60_000)).toBe("5 min");
    expect(ageWords(90 * 60_000)).toBe("1.5 h");
    expect(ageWords(2 * 86_400_000)).toBe("2.0 days");
  });
});

describe("ChainAsOf", () => {
  it("carries the state as a glyph + word + data attribute, and refreshes on tap", () => {
    let refreshed = 0;
    const { container } = render(
      <ChainAsOf
        quotes={{ ...base, quotedAt: "2026-09-30T18:00:00Z" }}
        now={at(fetchedAt)}
        onRefresh={() => refreshed++}
      />,
    );
    expect(container.querySelector(".chain-as-of")?.getAttribute("data-state")).toBe("stale");
    expect(screen.getByText("as of 14:32:05 ET")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(refreshed).toBe(1);
  });

  it("says it is refreshing and holds the button while a fetch is in flight", () => {
    render(<ChainAsOf quotes={base} now={at(fetchedAt)} refreshing onRefresh={() => undefined} />);
    expect(screen.getByText(/refreshing…/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
  });

  it("offers no Refresh button when the caller has none", () => {
    render(<ChainAsOf quotes={base} now={at(fetchedAt)} />);
    expect(screen.queryByRole("button", { name: "Refresh" })).toBeNull();
  });
});
