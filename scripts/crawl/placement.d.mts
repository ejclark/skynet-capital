// Type surface for placement.mjs, the placement check's pure core (#8005 slice 2) — the same
// arrangement as cohesion-plan.d.mts: scripts/ is plain ESM with `allowJs` off, so the spec needs this.

import type { Name } from "./cohesion-plan.mjs";

export const SHELL: string;
export const UNPLACED: Set<string>;

export interface Screen {
  key: string;
  path?: string | null;
  home?: string;
  verdict?: string;
}
export interface Snapshot {
  screens: Screen[];
  names: Name[];
}
export interface Part {
  file: string;
  status: "placed" | "homeless" | "not mounted";
  via?: string;
  routes?: string[];
}
export interface Row {
  kind: "screen" | "name" | "part" | "collision";
  what: string;
  status: string;
  home?: string;
  homes?: string[];
  words?: string[];
  place?: string;
  source?: string;
  via?: string;
  routes?: string[];
}

export function groupsOf(iaSrc: string): Map<string, { num: string; name: string }>;
export function homesOfRoutes(routes: string[], screens: Screen[]): string[];
export function placementRows(base: Snapshot, head: Snapshot, opts?: { parts?: Part[] }): Row[];
export function newCollisions(baseNames: Name[], headNames: Name[]): Row[];
export function render(
  rows: Row[],
  opts?: {
    groups?: Map<string, { num: string; name: string }>;
    census?: { now: number; budget: number | null } | null;
    base?: string;
  },
): string;
