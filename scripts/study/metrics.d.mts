// Type surface for metrics.mjs — same arrangement as scripts/crawl/phone.d.mts: scripts/ is plain
// ESM with `allowJs` off, so the spec that imports from it needs this. The shapes are the trace
// record session.mjs writes, one JSON line per action.

import type { PhoneFinding, Rect } from "../crawl/phone.mjs";

export type Finding = PhoneFinding;

export type ActionKind = "tap" | "scroll" | "type" | "key" | "back" | "hover" | "done" | "give_up";

export interface Action {
  kind: ActionKind | string;
  x?: number;
  y?: number;
  dir?: "up" | "down" | string;
  screens?: number;
  text?: string;
  key?: string;
  answer?: string;
  why?: string;
}

export interface Control {
  role: string;
  name: string;
  tag?: string;
  rect?: Rect;
}

export interface Tap {
  x: number;
  y: number;
  hit: Control | null;
  nearest: (Control & { distance: number }) | null;
  under?: string | null;
  rectBefore: Rect | null;
  rectAfter: Rect | null;
}

export interface View {
  href: string;
  pathname: string;
  section: string | null;
  scrollY: number;
  innerWidth: number;
  innerHeight: number;
  head: number;
  contentTop: number | null;
  textHash: string;
  view: string;
}

export interface Container {
  name: string;
  text: string;
  scrollWidth: number;
  clientWidth: number;
  scrollLeft?: number;
  inView: boolean;
  table: { clipped: boolean; sticky: boolean; label: string } | null;
}

export interface Overflow {
  page: { scrollWidth: number; innerWidth: number };
  containers: Container[];
}

export interface Shift {
  t?: number;
  value: number;
  hadRecentInput: boolean;
}

export interface TraceRecord {
  step: number;
  action: Action;
  refused?: string;
  before: View;
  after: View;
  scroll: {
    before: number;
    after: number;
    maxY?: number;
    intended: number | null;
    samples: { t?: number; y: number }[];
  };
  tap: Tap | null;
  shifts: Shift[];
  overflow: Overflow | null;
  landing?: { name: string; top: number; screens: number | null } | null;
}

export const SCROLL_TOL: number;
export const DISPLACE_TOL: number;
export const SHIFT_TOL: number;
export const NEAR_PX: number;
export const FRAME_TOL: number;

export function actionRefusal(
  action: Action | null | undefined,
  frame: { width: number; height: number; hasTouch: boolean },
): string | null;
export function viewKey(v: {
  pathname: string;
  section: string | null;
  scrollY: number;
  innerHeight: number;
}): string;
export function scrollPath(start: number, samples: { y: number }[]): number;
export function scrollSplit(rec: Pick<TraceRecord, "scroll" | "action">): {
  voluntary: number;
  involuntary: number;
};
export function tapOutcome(
  tap: Pick<Tap, "hit" | "nearest"> | null,
): "hit" | "covered" | "near-miss" | "dead" | null;
export function displacement(rec: TraceRecord): { px: number; scrolled: boolean } | null;
export function shiftTotals(shifts?: Shift[]): { input: number; other: number; total: number };
export function landingScreens(
  top: number | null | undefined,
  scrollY: number,
  innerHeight: number,
): number | null;
export function noVisibleEffect(rec: TraceRecord): boolean;
export function actionFindings(rec: TraceRecord): Finding[];
export function lostness(v: { unique: number; total: number; optimal?: number }): number | null;
export function matchesTarget(
  hit: Control | null | undefined,
  expect: { role?: string; name?: string } | null | undefined,
): boolean;

export interface TaskMetrics {
  steps: number;
  backtracks: number;
  uniqueViews: number;
  totalViews: number;
  lostness: number | null;
  voluntaryScroll: number;
  involuntaryScroll: number;
  navigationsAway: number;
  firstTapCorrect: boolean | null;
  deadTaps: number;
  nearMisses: number;
  gaveUp: boolean;
  answer: string | null;
  findings: Finding[];
}

export function taskMetrics(
  trace: TraceRecord[],
  opts?: { startPath?: string; optimal?: number; expectFirst?: { role?: string; name?: string } },
): TaskMetrics;
