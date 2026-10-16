// Type surface for scripts/steer/scope.mjs (see scripts/moneypenny/index.d.mts for why scripts/
// ships hand-written declarations).
import type { Scope } from "./model.mjs";

export function scopeOf(raw: unknown): Scope | null;
export function servesOf(raw: unknown): string[] | null;
/** An outcome's state, glyph and word together. */
export const STATE: { open: string; met: string };
export function scopeHtml(scope: Scope | null | undefined): string;
export function servesHtml(serves: string[] | null | undefined): string;
export function scopeProblems(q: Record<string, unknown> | null | undefined, at: string): string[];
