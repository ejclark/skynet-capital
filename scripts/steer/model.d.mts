// Type surface for scripts/steer/model.mjs (scripts/ is plain ESM with `allowJs` off; see
// scripts/moneypenny/index.d.mts). Only what a spec imports is declared.
import type { NeedsYouRow } from "../moneypenny/assignments.mjs";

export type Kind = "design" | "fork" | "approve";
export interface Picture {
  src: string;
  alt: string;
  size: "phone" | "desk";
  local?: string | null;
}
export interface Option {
  key: string;
  name: string;
  delta: string;
  recommended: boolean;
  pictures?: Picture[];
}
export interface Decision {
  key: string;
  kind: Kind;
  issue: number;
  isPr: boolean;
  title: string;
  ask: string;
  labels?: string[];
  cls?: string;
  why?: string;
  plan?: boolean;
  createdAt?: string | null;
  ageDays?: number | null;
  irreversible: boolean;
  default: string | null;
  link?: string;
  recommendation: {
    key?: string;
    label: string;
    confidence: string | null;
    wrongIf: string | null;
    saw?: string[];
  } | null;
  today: { pictures: Picture[]; caption: string; real: boolean } | null;
  options: Option[];
  changes?: string | null;
  topic?: string | null;
  round?: number | string | null;
  q?: number;
  minutes: number;
  skip: string;
}
export interface Saved {
  pick?: string | null;
  react?: Record<string, string>;
  verdict?: string | null;
  note?: string;
  at?: string;
  [k: string]: unknown;
}
/** The REST rows `gather()` read: an issue (a PR GitHub lists as one) or a pull request. */
type Row = {
  number: number;
  title?: string;
  labels?: unknown[];
  created_at?: string;
  pull_request?: unknown;
  head?: unknown;
};

export const SECTIONS: string[];
export const BUDGET_MINUTES: { am: number; pm: number };
export const TAP_GAP_CAP_MS: number;
export const MINUTES: Record<Kind, number>;
export function safeKey(raw: unknown): string;
export function roundPath(id: string): string;
export function recordPath(id: string, section: string, key: string | number): string;
export function activeMinutes(taps?: number[], capMs?: number): number;
export function isIrreversible(input?: { isPr?: boolean; text?: string }): boolean;
export function estimateMinutes(d: { kind: Kind; options?: unknown[] }): number;
export function skipText(d: Partial<Decision>): string;
export function decisionsFrom(input: {
  needsYou?: NeedsYouRow[];
  issues?: Row[];
  prs?: Row[];
  blocks?: Record<number, number[]>;
  design?: Record<number, Partial<Decision>[]>;
  now: string | number;
}): Decision[];
/** A decision held back for want of a picture: named on the page, never asked, rolled over. */
export interface NeedsPictures {
  key: string;
  issue: number;
  title: string;
  kind: Kind;
  minutes: number;
}
export function hasPictures(d: Partial<Decision>): boolean;
export function splitByPictures(decisions: Decision[]): {
  pictured: Decision[];
  needsPictures: NeedsPictures[];
};
export function fitBudget(
  decisions: Decision[],
  minutes: number,
): {
  shown: Decision[];
  deferred: { key: string; issue: number; title: string; minutes: number }[];
  used: number;
  minutes: number;
};
export function roundRecords(
  records: Record<string, unknown>,
  id: string,
): {
  meta: { openedAt?: string; doneAt?: string | null; taps?: number[]; shown?: string[] } | null;
  decisions: Record<string, Saved>;
  queue: Record<string, Saved>;
  reel: Record<string, Saved>;
};
export function steerMarker(id: string, key: string | number): string;
export function parseSteerMarker(
  body?: string | null,
): { round: string; key: string; note: string | null } | null;
export function isAnswered(rec: Saved | null | undefined): boolean;
