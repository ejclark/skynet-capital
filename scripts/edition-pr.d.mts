// Type surface for edition-pr.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the spec
// that imports from it needs this.

export function editionPrOpen(
  openPrs: readonly { head?: { ref?: string } }[],
  branch: string,
): boolean;
export function editionPr(edition: {
  readonly date: string;
  readonly writtenBy: string;
  readonly stories: readonly {
    readonly id: string;
    readonly line: string;
    readonly facts: readonly { readonly label: string; readonly value: string }[];
  }[];
  readonly next: readonly unknown[];
}): { title: string; body: string };
