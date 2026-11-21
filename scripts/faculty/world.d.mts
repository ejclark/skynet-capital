// Types for world.mjs (the faculty world) — read by e2e/playwright.faculty.ts.

export const FACULTY_MARKS: Readonly<Record<string, number>>;
export const FACULTY_NVDA_CALL: string;
export const FACULTY_WORKING_ORDER: Readonly<Record<string, unknown>>;
export function facultyFixturesDir(): string;
export function facultyBootEnv(opts: {
  port: number;
  bridgePort: number;
  fixtures: string;
}): Record<string, string>;
