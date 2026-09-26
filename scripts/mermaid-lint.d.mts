export const GITHUB_MERMAID_VERSION: string;
export const LONG_DIAGRAM_LINES: number;
export function mermaidBlocks(markdown: string): { line: number; source: string }[];
export function snippetHexes(root?: string): Set<string> | null;
export function lintMermaid(
  markdown: string,
  options?: { where?: string },
): Promise<{
  problems: string[];
  notes: string[];
  diagrams: { line: number; type: string; ok: boolean }[];
}>;
export function corpusFiles(root?: string): string[];
