// Type surface for scripts/steer/filings.mjs (see scripts/moneypenny/index.d.mts).

import type { Decision, Saved } from "./model.mjs";

/** Eric's words, quoted exactly: every line kept, blank lines kept as a bare `>`. */
export function quote(text: string): string;
export function noteBlock(note: string | null | undefined): string;

/** The issue a Build pick on a design option files: the option, Eric's notes and his marks on it. */
export function buildIssue(
  d: Partial<Decision>,
  r: Saved | null | undefined,
  id: string,
): { kind: "issue"; title: string; body: string; labels: string[]; why: string };
