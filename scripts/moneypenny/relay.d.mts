// Type surface for relay.mjs — same arrangement as burst-alarm.d.mts: the scripts/ tree is plain
// ESM with `allowJs` off, so a spec that imports from it needs this.

export interface ClosedWithRemainder {
  readonly number: number;
  readonly title?: string;
  readonly labels?: readonly (string | { name?: string })[];
  readonly closedAt?: string | null;
  readonly stateReason?: string | null;
  readonly state?: string;
}

export interface RelayIntent {
  readonly kind: "relay-remainder";
  readonly source: number;
  readonly sourceTitle?: string;
  readonly title: string;
  readonly labels: string[];
  readonly clearLabels: string[];
  readonly body: string;
  readonly sourceComment: string;
}

export const REMAINDER_LABELS: string[];
export const RELAY_FROM: string;
export const RELAY_CAP: number;

export function relayTitle(number: number, title?: string): string;
export function remainderLabels(labels?: readonly (string | { name?: string })[]): string[];
export function relayLabels(labels?: readonly (string | { name?: string })[]): string[];
export function notRelayableReason(
  issue: ClosedWithRemainder | null | undefined,
  opts?: { relayFrom?: string; backfill?: boolean },
): string | null;
export function routeRelay(deps?: {
  closedWithRemainder?: readonly ClosedWithRemainder[];
  openIssueTitles?: readonly string[];
  relayFrom?: string;
  relayCap?: number;
  backfill?: boolean;
}): RelayIntent[];
export function relayBody(issue: ClosedWithRemainder): string;
export function sourceCommentBody(issue: ClosedWithRemainder): string;
export function gatherRelayDeps(opts?: {
  read?: (path: string) => readonly Record<string, unknown>[];
  labels?: readonly string[];
}): ClosedWithRemainder[];
export function executeRelay(
  intent: RelayIntent,
  opts?: {
    run?: (cmd: string, args: readonly string[]) => string;
    ensure?: (label: { name: string }) => void;
  },
): string;
