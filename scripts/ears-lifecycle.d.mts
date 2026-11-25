import type { DiagramModel } from "./mermaid-model.mjs";

/** One guarded transition, read as an EARS requirement. */
export type EarsLine = {
  from: string;
  to: string;
  label: string;
  /** The WHILE / WHEN / IF clauses — the spec's `describe`. */
  condition: string;
  /** What the system does — the spec's `it`, after "shall". */
  response: string;
  /** The whole line: `<condition>, [THEN ]the <system> shall <response>.` */
  ears: string;
};
export type EarsLifecycle = {
  system: string;
  lines: EarsLine[];
  /** Arrows with no label: no trigger, so no requirement — listed, never dropped. */
  unguarded: { from: string; to: string; arrow: string }[];
};
export function splitLabel(label: string | undefined): { event: string; guard: string };
export function earsFromStateModel(
  model: DiagramModel,
  options?: { system?: string },
): EarsLifecycle;
export function specScaffold(results: EarsLifecycle[]): string;
export function stateModels(markdown: string): DiagramModel[];
