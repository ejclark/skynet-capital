import type { ReactElement, ReactNode } from "react";
import type { ActivityFeedItem } from "../live/activity-feed";
import { byDay, dayHeader } from "../live/order-facts";

/**
 * THE LEAGUE'S FEED, ONE BLOCK A DAY (#5257; #5161 round 2, option A). Each day starts with a thin
 * line across the feed with the day centred in it — "TUE · OCT 6", written as the account's Activity
 * cards write it (`dayHeader`) — so the rows below keep only their time (Eric, #5161 r1: "a subtle
 * divider followed the day across the page, centered with the date text - this would help balance
 * space between days").
 *
 * Every kind files under its New York day (`orderDayKey`, via `byDay`): a fill at 23:30 ET on Oct 5
 * is 03:30 UTC Oct 6 and still belongs to Monday. Grouping runs on the list as filtered and as paged
 * — "Load older trades" appends to the same sorted list, so a page that starts mid-day continues that
 * day under its existing divider, and a day the filter emptied has no divider at all.
 *
 * Days are grouping, not events: each divider is a heading, as `activity-cards.tsx`'s are, so a
 * screen reader's list count stays the events. The line is decoration; the words carry the day.
 */
export function ActivityDays({
  items,
  renderItem,
}: {
  readonly items: readonly ActivityFeedItem[];
  readonly renderItem: (item: ActivityFeedItem) => ReactNode;
}): ReactElement {
  return (
    <div className="wire-days">
      {byDay(items).map((day) => (
        <section key={day.key} className="wire-day" aria-labelledby={`feed-day-${day.key}`}>
          <h3 id={`feed-day-${day.key}`} className="wire-day-head">
            <span>{dayHeader(day.key)}</span>
          </h3>
          <ul className="wire-feed">{day.events.map(renderItem)}</ul>
        </section>
      ))}
    </div>
  );
}
