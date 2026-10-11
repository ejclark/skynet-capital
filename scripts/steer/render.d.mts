// Type surface for scripts/steer/render.mjs (see scripts/moneypenny/index.d.mts for why scripts/
// ships hand-written declarations). The page is asserted on as a string.
import type { Decision, NeedsPictures, Picture } from "./model.mjs";

export interface TouchPointData {
  version?: number;
  id: string;
  date: string;
  slot: "am" | "pm";
  next: { label: string; hours: number; [k: string]: unknown };
  budget: { minutes: number; used: number; shown: number; deferred: number };
  decisions: Decision[];
  deferred: { key: string; issue: number; title: string; minutes: number }[];
  /** Decisions with no picture yet: named as being drawn, never asked (absent on older pages). */
  needsPictures?: NeedsPictures[];
  unstated: { count: number; numbers: number[] };
  reel: {
    since: string;
    merged: number;
    research: number;
    builds: number;
    headlines: {
      number: number;
      subject: string;
      kind?: string;
      mergedAt?: string;
      sha?: string;
      shots: { path: string; url: string; sha?: string; local?: string | null }[];
      because: string | null;
    }[];
    more: { total: number; byKind: Record<string, number> };
  };
  queue: {
    position: string;
    halt: boolean;
    inFlightCap: number | null;
    dialLink: string;
    nextPick?: { number?: number; admit: boolean; reason: string } | null;
    items: { number: number; title: string; cls: string | null; why: string }[];
    [k: string]: unknown;
  };
  strip: {
    days: { date: string; day: number; night: number; late: number }[];
    perDay: number;
    perNight: number;
    needsYou: number;
    unstated: number;
    medianWaitDays: number | null;
    pages: { id: string; minutes: number }[];
  };
}

/** A design round's own page (gather --design-only, design.mjs `designRound`, #5143): its
 *  decisions and the bar only — no reel, no queue, no strip. */
export interface DesignRoundData {
  version?: number;
  designOnly: true;
  id: string;
  title: string;
  round: number | string | null;
  issues: number[];
  generatedAt: string | null;
  repo: string;
  budget: { minutes: number; used: number; shown: number; deferred: number };
  decisions: Decision[];
  deferred: { key: string; issue: number; title: string; minutes: number }[];
  needsPictures: NeedsPictures[];
  unstated: { count: number; numbers: number[] };
  reel?: undefined;
  queue?: undefined;
}

export const TITLE: string;
/** The page's intro line, telling Eric his comments sent to Claude are read back too. */
export const COMMENTS_COUNT: string;
/** A round page's intro: his pinned comments lead, the buttons follow. */
export const ROUND_INTRO: string;
export function renderPage(
  tp: TouchPointData | DesignRoundData,
  opts?: { img?: (pic: Picture | { local?: string | null }) => string | null },
): string;
