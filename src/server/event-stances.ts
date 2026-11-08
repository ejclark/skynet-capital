import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CAMPAIGNS, type Campaign, isTradable, linkEvents } from "../domain/campaigns.js";
import { allEvents } from "../domain/market-events.js";
import type { EventStance } from "./event-quests.js";
import { RESEARCH_DIR } from "./research-service.js";

/**
 * The campaign-linked, symbol-bearing calendar events that have a written ledger, ready for
 * `eventQuests` (#7028 slice 4). House campaigns only: a member's own campaigns are private to them
 * and join in a later slice, if at all. An event no campaign links, one naming no tradable symbol,
 * or one with no ledger file is dropped here, so the mapper never sees it. Sync file reads of a
 * handful of small markdown files — only the events that survive the first two filters are opened.
 */
export function readEventStances(
  today: string,
  campaigns: readonly Campaign[] = CAMPAIGNS,
  root: string = RESEARCH_DIR(),
): EventStance[] {
  const upcoming = allEvents(today).filter((e) => e.symbols.some(isTradable));
  const titles = new Map<string, string[]>();
  for (const campaign of campaigns)
    for (const link of linkEvents(campaign, upcoming))
      titles.set(link.event.id, [...(titles.get(link.event.id) ?? []), campaign.title]);
  return upcoming.flatMap((event) => {
    const campaignTitles = titles.get(event.id);
    const file = join(root, "events", `${event.id}.md`);
    if (!(campaignTitles && existsSync(file))) return [];
    return [{ event, md: readFileSync(file, "utf8"), campaigns: campaignTitles }];
  });
}
