// Type surface for the parts of org-chart.mjs a spec imports directly — the scripts/ tree is plain
// ESM with `allowJs` off (same arrangement as labels.d.mts). Only what a spec needs is declared.

/** A member-facing row of the seat registry (#8161): a plain job line, and a lore name or null (#6616). */
export interface CastRow {
  id: string;
  department: string;
  job: string;
  name: string | null;
}

/** The departments whose seats never carry a character: the build org stays out of the game. */
export const BUILD_DEPTS: string[];
/** What a null character name reads as on the crew table. */
export const UNNAMED: string;
/** Every seat with a character, in registry order. */
export function cast(reg: unknown): CastRow[];
/** The whole org chart page, rendered from the registry. */
export function render(reg: unknown): string;
