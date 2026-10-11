// Type surface for scripts/steer/readback.mjs (see scripts/moneypenny/index.d.mts).
import type { DesignRoundData, TouchPointData } from "./render.mjs";

export type ReadbackAction =
  | { kind: "comment"; issue: number; body: string; why: string }
  | { kind: "labels"; issue: number; add: string[]; remove: string[]; why: string }
  | {
      kind: "issue";
      title: string;
      body: string;
      labels: string[];
      why: string;
      issue?: undefined;
    };

export interface ReadbackPlan {
  round: string;
  done: boolean;
  openedAt: string | null;
  doneAt: string | null;
  activeMinutes: number;
  actions: ReadbackAction[];
  rollover: { key: string; issue: number; kind: string; why: string }[];
  defaults: { key: string; issue: number; default: string }[];
  followUps: { kind: string; issue: number; key: string; why: string }[];
  /** Comments whose anchor is not a shown decision: the session answers them on the page. */
  unplacedComments: PageComment[];
  commands?: string[][];
}

/** A comment Eric sent to Claude on the page: its anchor (a decision key or `d-<key>` element id). */
export interface PageComment {
  anchorKey: string;
  text: string;
  at?: string;
}

export const DEFAULT_APPLIED: string;
/** How the page's Done comment starts: the read-back's trigger, dropped from the quotes. */
export const DONE_TRIGGER: string;
export const DRAWING: string;
export function readback(
  tp: TouchPointData | DesignRoundData,
  records: Record<string, unknown>,
  comments?: PageComment[],
): ReadbackPlan;
export function anchorDecision(
  anchor: string,
  decisions: TouchPointData["decisions"],
): { d: TouchPointData["decisions"][number]; opt: string | null } | null;
export function commentsBlock(list: (PageComment & { opt?: string | null })[] | undefined): string;
export function readComments(file: string): PageComment[];
export function commandsFor(plan: ReadbackPlan, dir: string): string[][];
