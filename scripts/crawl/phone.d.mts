// Type surface for phone.mjs's pure predicates — same arrangement as ledger.d.mts: the scripts/
// tree is plain ESM with `allowJs` off, so the spec that imports from it needs this.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One probe finding — the contract probes.mjs set: `snippet` is text locate.mjs can grep. */
export interface PhoneFinding {
  kind: string;
  what: string;
  snippet: string;
  severity: "high" | "medium" | "low";
  fix: "S" | "M" | "L";
}

/** An element wider inside than out; `ancestors` are indexes of other boxes that contain it. */
export interface Box {
  i: number;
  scrollWidth: number;
  clientWidth: number;
  overflowX: string;
  name: string;
  text: string;
  /** The element inside reaching furthest right — what actually spills. */
  culprit?: { name: string; text: string } | null;
  ancestors: number[];
}

/** A visible, enabled control as measured in the page; `ancestors` index other targets. */
export interface Target {
  i: number;
  tag: string;
  type: string;
  appearance: string;
  display: string;
  hostText: string;
  ownText: string;
  desc: string;
  label: string;
  rect: Rect;
  ancestors: number[];
}

export interface Field {
  tag: string;
  type: string;
  fontSize: number;
  desc: string;
  label: string;
}

export interface Snapshot {
  innerWidth: number;
  scrollWidth: number;
  boxes: Box[];
  targets: Target[];
  inputs: Field[];
}

export const TOLERANCE: number;
export const AA_TARGET: number;
export const AAA_TARGET: number;
export const ZOOM_FONT: number;

export function leaks(
  m: { scrollWidth: number; clientWidth: number; overflowX: string },
  tolerance?: number,
): boolean;
export function outermostLeaks(boxes: Box[], tolerance?: number): Box[];
export function isInlineTarget(t: { display: string; hostText: string; ownText: string }): boolean;
export function isUaDefault(t: { tag: string; type: string; appearance: string }): boolean;
export function circleHitsRect(c: { x: number; y: number }, radius: number, r: Rect): boolean;
export function spacedEnough(t: Target, all: Target[]): boolean;
export function tapFindings(targets: Target[]): PhoneFinding[];
export function zoomFindings(inputs: Field[]): PhoneFinding[];
export function dedupe(findings: PhoneFinding[]): PhoneFinding[];
export function phoneFindings(snap: Snapshot): PhoneFinding[];
