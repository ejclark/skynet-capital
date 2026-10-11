// Type surface for shoot.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface Screen {
  id: string;
  name: string;
  purpose: string;
  route: string;
  world: string;
  viewer: string;
  waitFor?: string;
  settle?: number;
  clicks?: string[];
  maxH?: { phone?: number; desk?: number };
}

export interface ShootArgs {
  screen: string;
  out: string;
  state?: string;
  scheme: "dark" | "light";
  rebuild: boolean;
}

export function loadScreens(file?: string): Screen[];
export function parseShootArgs(argv: string[]): ShootArgs;
export function findScreen(screens: Screen[], id: string): Screen;
export function readState(value: string | undefined, cwd?: string): Record<string, unknown>;
export function framePlan(
  screen: Screen,
  opts: { out: string; scheme?: string; state?: Record<string, unknown>; run: string },
): Omit<Screen, "name" | "purpose"> & {
  scheme: string;
  overrides: Record<string, unknown>;
  out: string;
  run: string;
};
