// Type surface for census-plan.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the
// spec that imports it needs this (same arrangement as parity-judge.d.mts).

export const CONTROL_ROLES: Set<string>;
export const DEFAULT_CAP: number;
export const MAX_SCREENS: number;

export interface AxNode {
  nodeId: string;
  parentId?: string;
  childIds?: string[];
  ignored?: boolean;
  role?: { value: string };
  name?: { value: string };
  backendDOMNodeId?: number;
}
export interface TreeNode {
  backendId: number | null;
  role: string;
  name: string;
  ignored: boolean;
  owned: boolean;
}
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface Viewport {
  width: number;
  height: number;
}
export interface Finding {
  kind: string;
  what: string;
  snippet: string;
  severity: string;
  fix: string;
}

export function routesFor(
  surfaces: { viewer: string; route: string; struck?: string }[],
  viewer: string,
): string[];
export function struckRoutes(
  surfaces: { viewer: string; route: string; struck?: string }[],
  viewer: string,
): { route: string; why: string }[];
export function reachVerdict(
  m: { gone?: boolean; shown?: boolean; clipped?: boolean; box?: Box } | null | undefined,
  viewport: Viewport,
  forced: boolean,
): "reached" | "clipped" | "offscreen";
export function screenFor(docY: number, starts: number[], innerHeight: number): number;
export function treeOrder(nodes: AxNode[]): TreeNode[];
export function axPick(ordered: TreeNode[]): { controls: TreeNode[]; headings: TreeNode[] };
export function nextScreen(
  at: number,
  extent: { scrollHeight: number; innerHeight: number },
): number | null;
export function onScreen(
  m: { shown?: boolean; box?: Box } | null | undefined,
  viewport: Viewport,
): boolean;
export function tapPoint(box: Box, viewport: Viewport): { x: number; y: number } | null;
export function leaveReason(
  link: { href?: string | null; download?: boolean } | null | undefined,
  origin: string,
): string | null;
export function keyed<T extends { role: string; name: string }>(
  controls: T[],
): (T & { nth: number; key: string })[];
export function capControls<T>(controls: T[], cap?: number): { kept: T[]; dropped: T[] };
export function nearest<T extends { doc?: { x: number; y: number } }>(
  candidates: T[],
  want: { x: number; y: number },
): (T & { d: number }) | null;
export function censusFindings(args: {
  name: string;
  role: string;
  cover?: { inside: boolean; by?: string | null } | null;
  operated?: string;
  reach?: string;
}): Finding[];
export function routeSlug(route: string): string;
export function walkOrder<T extends { backendId: number }>(found: T[], lastRead: number[]): T[];
export function censusArgs(argv: string[]): {
  run: string;
  world: string;
  viewer: string;
  out: string;
  viewports: string[];
  cap: number;
  routes: string[];
};
