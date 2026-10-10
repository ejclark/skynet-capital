// Type surface for scripts/steer/readback.mjs (see scripts/moneypenny/index.d.mts).
import type { TouchPointData } from "./render.mjs";

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
  commands?: string[][];
}

export const DEFAULT_APPLIED: string;
export function readback(tp: TouchPointData, records: Record<string, unknown>): ReadbackPlan;
export function commandsFor(plan: ReadbackPlan, dir: string): string[][];
