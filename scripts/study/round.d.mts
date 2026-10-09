// Type surface for round.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

export interface RoundSeams {
  /** A pinned tool, run to completion: the script under scripts/study, its args, its log file. */
  tool?: (script: string, args: string[], logFile: string) => number;
  toolAsync?: (script: string, args: string[], logFile: string) => Promise<number>;
  /** A frame at half scale, base64. */
  half?: (path: string) => Promise<string>;
  say?: (line: string) => void;
}

/** One round, start or resume; the exit status. Seams are refused outside a stub round. */
export function runRound(argv: string[], seams?: RoundSeams): Promise<number>;
