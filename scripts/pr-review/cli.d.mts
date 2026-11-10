// Type surface for cli.mjs: scripts/ is plain ESM.
export function flag(args: string[], name: string): string | undefined;
export function envelopeRules(): { pattern: string; why?: string }[];
export function readGate<T>(gate: () => T): T | { dispatch: false; reason: string };
