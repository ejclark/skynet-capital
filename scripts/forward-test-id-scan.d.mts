// Type surface of scripts/forward-test-id-scan.mjs for the specs that import its pure functions
// (tests/arch/forward-tests-fragments.spec.ts). Same pattern as event-material-scan.d.mts: the
// script stays dependency-free ESM for the lanes; TypeScript gets the shapes here.

export const INDEX_FILE: string;
export const FRAGMENT_DIR: string;

export interface Fragment {
  readonly file: string;
  readonly eventId: string;
  readonly ids: readonly string[];
  readonly hasHeader: boolean;
}

export function extractIds(md: string): string[];
export function readFragments(dir?: string): Fragment[];
export function duplicates(ids: readonly string[]): { id: string; count: number }[];
export function placementProblems(input: {
  indexMd: string | null | undefined;
  fragments: readonly Fragment[];
}): string[];
