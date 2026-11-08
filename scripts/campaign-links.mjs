// Which campaigns link a calendar event — for the dependency-free scripts (#6949 slice 5,
// criterion 5). event-scan.mjs runs without `npm ci`, so it cannot import the TS rule in
// src/domain/campaigns.ts → `linkReasons`; this is that rule re-read from the same checked-in
// campaign files. The rule lives in exactly two places on purpose (here and there), and
// tests/domain/campaign-landscape.spec.ts pins the two together over the whole calendar, so they
// cannot drift apart in silence. The same shape market-events-read.mjs uses for the calendar.
//
// THE RULE: an event links when it names a cast symbol (`via: "cast"`), or when a force's id prefix
// or event kind matches it (`via: "force"`). The campaign files are already validated by the TS
// loader in CI, so this reads them without re-checking; a missing or unreadable directory throws —
// loud, never "no campaign links anything", which would quietly drop criterion 5's ordering.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Every campaign file under `dir`, sorted by id, as `{ id, cast, forces }`. Throws when unreadable. */
export function readCampaignDir(dir) {
  let files;
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch (err) {
    throw new Error(`campaign-links: cannot read ${dir} (${err.message}) — refusing to guess.`);
  }
  return files.map((f) => {
    try {
      return JSON.parse(readFileSync(join(dir, f), "utf8"));
    } catch (err) {
      throw new Error(`campaign-links: ${f} is not valid JSON (${err.message}).`);
    }
  });
}

/** `{ via: "cast", symbol } | { via: "force", force }` for each reason `campaign` links `event`. */
export function campaignLinkReasons(campaign, event) {
  const cast = new Set((campaign.cast ?? []).flatMap((r) => r.symbols ?? []));
  const reasons = (event.symbols ?? [])
    .filter((s) => cast.has(s))
    .map((symbol) => ({ via: "cast", symbol }));
  for (const force of campaign.forces ?? []) {
    const byPrefix = (force.prefixes ?? []).some((p) => String(event.id).startsWith(p));
    const byKind = (force.kinds ?? []).includes(event.kind);
    if (byPrefix || byKind) reasons.push({ via: "force", force: force.id });
  }
  return reasons;
}

/**
 * The campaigns that link `event`, each once with its strongest reason: `cast` when the event names
 * one of its symbols, else `force`. Empty when none does. This is what a `--due` row carries.
 */
export function campaignsLinking(campaigns, event) {
  const out = [];
  for (const campaign of campaigns) {
    const reasons = campaignLinkReasons(campaign, event);
    if (reasons.length === 0) continue;
    out.push({ id: campaign.id, via: reasons.some((r) => r.via === "cast") ? "cast" : "force" });
  }
  return out;
}

/**
 * How relevant a due row is to the active campaigns, as a sort rank (criterion 5): 0 when a
 * campaign's cast is named in it, 1 when only a campaign's force matches it, 2 when no campaign
 * links it (or the row carries no `campaigns` field at all, as every row did before this slice).
 */
export function campaignRelevance(row) {
  const links = Array.isArray(row?.campaigns) ? row.campaigns : [];
  if (links.some((l) => l.via === "cast")) return 0;
  if (links.length > 0) return 1;
  return 2;
}
