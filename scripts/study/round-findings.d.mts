// Type surface for round-findings.mjs (`allowJs` is off).

export interface Finding {
  class: string;
  level: string;
  severityRaw: unknown;
  surface: { route: string | null; viewport: string | null };
  evidence: string[];
  what: string;
  detail: Record<string, unknown>;
}

export interface Collected extends Omit<Finding, "severityRaw"> {
  id: string;
  severity: string;
  severityRaw: unknown;
}

type FrameRef = { path: string; route: string | null; viewport: string | null };

export function severityOf(raw: unknown): string;
export function fromAnalyst(args: {
  member: string;
  answer: { findings?: Record<string, unknown>[] };
  frames: Record<string, FrameRef>;
}): Finding[];
export function fromExpert(args: {
  k: number;
  answer: { findings?: Record<string, unknown>[] };
  batch: Record<string, { frames: FrameRef[] }>;
}): Finding[];
export function fromWords(args: {
  answer: { findings?: Record<string, unknown>[] };
  strings: { routes?: Record<string, Record<string, { text: string; viewports: string[] }[]>> };
}): Finding[];
export function fromInstruments(raw: Record<string, unknown>[]): Finding[];
export function findingId(f: Pick<Finding, "class" | "surface" | "what">): string;
export function collectFindings(groups: Finding[][]): {
  findings: Collected[];
  classes: Record<string, string>;
};
export function stripClasses(findings: Collected[]): Omit<Collected, "class">[];
