// Type surface for pitch-issue.mjs — same arrangement as bottleneck-baseline.d.mts (scripts/ is
// plain ESM with `allowJs` off, so a spec importing it needs this).

export interface PitchField {
  name: string;
  /** What the value must carry beyond being filled in, and the pattern that proves it. */
  needs?: [string, RegExp];
}
export const PITCH_FIELDS: readonly PitchField[];
export function pitchField(body: string | null | undefined, name: string): string | null;
export function isPitchLine(line?: string): boolean;
export function pitchProblems(body?: string, labels?: readonly string[]): string[];
