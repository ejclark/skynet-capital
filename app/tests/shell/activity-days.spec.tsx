import { render, screen, within } from "@testing-library/react";
import {
  buildActivityFeed,
  matchesActivity,
  parseActivityQuery,
} from "../../src/live/activity-feed";
import type { WireMilestoneItem, WireTrade } from "../../src/live/wire";
import { ActivityDays } from "../../src/shell/activity-days";

/**
 * `ActivityDays` (#5257; #5161 round 2, option A) — the league feed's day dividers. Each day opens
 * with its own heading ("MON · OCT 5"), every kind files under its New York day, a page that "Load
 * older trades" appends mid-day continues under the day already drawn, and a day a filter emptied
 * draws nothing.
 */

const trade = (key: string, at: string): WireTrade => ({
  key,
  side: "buy",
  symbol: "NVDA",
  quantity: 40,
  price: "$226.10",
  who: "Sauron",
  whoId: "sauron",
  kind: "bot",
  reconstructed: false,
  when: "",
  at,
});

const earn = (at: string): WireMilestoneItem => ({
  key: "jordan:first-buy",
  icon: "🏅",
  kindLabel: "Earned",
  who: "Jordan",
  whoId: "jordan",
  title: "Buy your first stock",
  points: 25,
  meta: "+25 pts",
  at,
});

function renderDays(trades: readonly WireTrade[], earns: readonly WireMilestoneItem[] = []) {
  return render(
    <ActivityDays
      items={buildActivityFeed(trades, [], [], earns)}
      renderItem={(item) => <li key={item.key}>{item.key}</li>}
    />,
  );
}

const days = () => screen.getAllByRole("heading", { level: 3 });
// `dayHeader` adds the year once the day is not this one; the specs read the day alone.
const dayNames = () => days().map((d) => d.textContent?.replace(/, \d{4}$/, ""));
const rowsUnder = (header: RegExp) =>
  within(screen.getByRole("region", { name: header }))
    .getAllByRole("listitem")
    .map((li) => li.textContent);

describe("ActivityDays", () => {
  it("files a fill at 23:30 ET on Oct 5 (03:30 UTC Oct 6) under Monday, not Tuesday", () => {
    renderDays([trade("late", "2026-10-06T03:30:00.000Z")]);
    expect(days()).toHaveLength(1);
    expect(dayNames()).toEqual(["MON · OCT 5"]);
  });

  it("starts each day with one divider, newest day first, every kind under its own day", () => {
    renderDays(
      [trade("tue", "2026-10-06T14:31:00.000Z"), trade("mon", "2026-10-05T15:20:00.000Z")],
      [earn("2026-09-30T16:00:00.000Z")],
    );
    expect(dayNames()).toEqual(["TUE · OCT 6", "MON · OCT 5", "WED · SEP 30"]);
    expect(rowsUnder(/SEP 30/)).toEqual(["earn:jordan:first-buy"]);
  });

  it("continues a day under its existing divider when 'Load older trades' appends mid-day", () => {
    // The route appends the older page to the first one and rebuilds the one sorted list.
    const firstPage = [trade("mon-late", "2026-10-05T19:00:00.000Z")];
    const olderPage = [
      trade("mon-early", "2026-10-05T14:00:00.000Z"),
      trade("fri", "2026-10-02T14:00:00.000Z"),
    ];
    renderDays([...firstPage, ...olderPage]);
    expect(screen.getAllByRole("heading", { name: /OCT 5/ })).toHaveLength(1);
    expect(rowsUnder(/OCT 5/)).toEqual(["mon-late", "mon-early"]);
    expect(days()).toHaveLength(2);
  });

  it("draws no divider for a day the filter left empty", () => {
    const items = buildActivityFeed(
      [trade("tue", "2026-10-06T14:31:00.000Z")],
      [],
      [],
      [earn("2026-10-05T16:00:00.000Z")],
    ).filter((item) => matchesActivity(item, parseActivityQuery("is:trade")));
    render(
      <ActivityDays items={items} renderItem={(item) => <li key={item.key}>{item.key}</li>} />,
    );
    expect(dayNames()).toEqual(["TUE · OCT 6"]);
  });

  it("keeps the dividers out of the feed's event count", () => {
    renderDays([
      trade("tue", "2026-10-06T14:31:00.000Z"),
      trade("mon", "2026-10-05T15:20:00.000Z"),
    ]);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
