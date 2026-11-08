// Type surface for campaign-links.mjs — same arrangement as conviction-proposals.d.mts (scripts/ is
// plain ESM with `allowJs` off, so a spec importing it needs this).

export interface CampaignFile {
  id: string;
  cast?: { symbols?: string[] }[];
  forces?: { id: string; prefixes?: string[]; kinds?: string[] }[];
}

export interface EventRow {
  id: string;
  kind: string;
  symbols?: readonly string[];
}

export type CampaignLinkReason = { via: "cast"; symbol: string } | { via: "force"; force: string };

export interface CampaignLinkRow {
  id: string;
  via: "cast" | "force";
}

export function readCampaignDir(dir: string): CampaignFile[];
export function campaignLinkReasons(campaign: CampaignFile, event: EventRow): CampaignLinkReason[];
export function campaignsLinking(campaigns: CampaignFile[], event: EventRow): CampaignLinkRow[];
export function campaignRelevance(row: { campaigns?: CampaignLinkRow[] } | undefined): 0 | 1 | 2;
