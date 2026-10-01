// Type surface for work-gate.mjs — same arrangement as work-mode.d.mts: the scripts/ tree is plain
// ESM with `allowJs` off, so a spec that imports from it needs this.

import type { Caps, Position, WorkMode } from "./work-mode.d.mts";

export interface WorkGate {
  /** May a lane dispatch at all? False under `halt`, a tripped breaker, or an unreadable breaker. */
  readonly dispatch: boolean;
  readonly position: Position;
  readonly until: string | null;
  readonly caps: Caps;
  readonly breakerTripped: boolean;
  readonly reason: string;
  /** Carried through from the dial when it was unreadable or ambiguous — print as ::warning::. */
  readonly warning?: string;
}

/** The dial and the #2946 spend breaker, folded into one answer (#3960 criterion 1). Throws only
 *  when a CONFIG file is malformed; an unreadable breaker STATE refuses, an unreadable dial is
 *  conserve plus a warning. */
export function workGate(opts?: {
  readMode?: () => WorkMode;
  readBreaker?: () => boolean;
}): WorkGate;

/** The CLI a skill runs: JSON on stdout, status lines on stderr, exit 0 cleared / 3 refused. */
export function runCli(io?: {
  gate?: () => WorkGate;
  print?: (line: string) => void;
  printErr?: (line: string) => void;
}): number;
