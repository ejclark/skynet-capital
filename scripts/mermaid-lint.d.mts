import type { DiagramModel } from "./mermaid-model.mjs";

export const GITHUB_MERMAID_VERSION: string;
export const LONG_DIAGRAM_LINES: number;
export function mermaidBlocks(markdown: string): { line: number; source: string }[];
export function snippetHexes(root?: string): Set<string> | null;
export function lintMermaid(
  markdown: string,
  options?: { where?: string; ast?: boolean },
): Promise<{
  problems: string[];
  notes: string[];
  diagrams: { line: number; type: string; ok: boolean; model?: DiagramModel }[];
}>;
export function corpusFiles(root?: string): string[];
