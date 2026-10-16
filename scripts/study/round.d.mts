// Type surface for round.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

export interface RoundSeams {
  /** A pinned tool, run to completion: the script under scripts/study, its args, its log file. */
  tool?: (script: string, args: string[], logFile: string) => number;
  toolAsync?: (script: string, args: string[], logFile: string) => Promise<number>;
  /** A frame at half scale, base64. */
  half?: (path: string) => Promise<string>;
  say?: (line: string) => void;
  /** Wraps a step's sealed-call caller — to make a call time out as a real one would (#5155). */
  wrapCall?: (
    step: string,
    call: (request: SealedRequest) => Promise<unknown>,
  ) => (request: SealedRequest) => Promise<unknown>;
}

/** What a step hands its caller; `n` numbers the call when a step runs a role's calls at once. */
export interface SealedRequest {
  role: string;
  n?: number;
  rolePath: string;
  schema: string;
  message: unknown;
  timeoutMs?: number;
}

/** One round, start or resume; the exit status. Seams are refused outside a stub round. */
export function runRound(argv: string[], seams?: RoundSeams): Promise<number>;
