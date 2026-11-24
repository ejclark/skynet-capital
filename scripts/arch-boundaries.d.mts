// Type surface for arch-boundaries.mjs — same arrangement as architecture-pages.d.mts: the scripts/
// tree is plain ESM with `allowJs` off, so a spec that imports from it needs this.
import type { DiagramModel } from "./mermaid-model.mjs";

export const GATED_MAPS: readonly string[];
export const EXEMPT_FROM: readonly string[];

export interface Declared {
  drawn: Set<string>;
  /** `"from>to"` for every direction a Rel (or BiRel) draws between two containers. */
  declared: Set<string>;
  /** For each drawn volume, the containers whose Rel into it makes its code theirs. */
  writers: Map<string, Set<string>>;
}

export function declaredEdges(
  models: readonly (DiagramModel | undefined)[],
  containerIds: readonly string[],
): Declared;

export function ownership(
  containers: readonly { id: string; code_roots?: string[] }[],
  drawn: Set<string>,
): (file: string) => string[];

export interface Finding {
  from: string;
  to: string;
  count: number;
  examples: string[];
}

export function findUndeclared(
  edges: readonly { from: string; to: string }[],
  ownerOf: (file: string) => string[],
  declared: Set<string>,
  writers?: Map<string, Set<string>>,
  exempt?: readonly string[],
): Finding[];

export function importEdges(report: unknown): { from: string; to: string }[];

export function parityStale(parity: unknown, mapKey: string, drawn: Set<string>): string[];

export interface MapScan {
  map: string;
  containers: number;
  declared: number;
  findings: Finding[];
  total: number;
  stale: string[];
}

export function scan(): MapScan[];
