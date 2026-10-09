// Type surface for round-files.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

import type { SessionParts } from "./round-contract.mjs";

export function readJson(path: string): unknown;
export function readJsonl(path: string): Record<string, unknown>[];
export function readOptional<T>(path: string, fallback: T): unknown;
export function readList(path: string): string[];
export function findSessions(round: string): (SessionParts & {
  dir: string;
  rel: string;
  summary: Record<string, unknown>;
})[];
