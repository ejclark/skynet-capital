// Type surface for scripts/moneypenny/projects-fields.mjs — the card's Kind, "Waiting on" and
// "In this column since" fields, decided (#6871 slice 3), pure. The scripts/ tree is plain ESM with
// `allowJs` off (see index.d.mts).
import type { WantedCard } from "./projects-sync.d.mts";

type Labelled = { labels?: ({ name?: string } | string)[] };
export type CardIssue = Labelled & {
  number?: number;
  state?: string;
  issue_dependencies_summary?: { blocking?: number; blocked_by?: number } | null;
  pull_request?: unknown;
};

export function wantedKindOf(
  issue: CardIssue,
  opts?: { horizons?: Record<string, string> },
): string;

export function waitingOnFor(issue: CardIssue, card?: Partial<WantedCard>): string;

export function wantedCardFields(
  issue: CardIssue,
  card: Partial<WantedCard>,
  opts?: { horizons?: Record<string, string> },
): { kind: string; waitingOn: string };

export interface CardFieldWrite {
  field: string;
  kind: "select" | "text" | "clear" | "date";
  value: string;
}

export function planCardFields(input?: {
  have?: { kind?: string; waitingOn?: string; status?: string | null };
  wanted?: { kind?: string; waitingOn?: string };
  status?: string;
  today?: string;
  present?: Record<string, boolean>;
}): CardFieldWrite[];

export function describeCardFields(number: number | string, writes?: CardFieldWrite[]): string;

export const CARD_FIELD_WRITES_PER_SWEEP: number;

export function planCardFieldDrift<
  Item extends { id?: string; kind?: string; waitingOn?: string },
>(input?: {
  items?: Item[];
  openIssues?: (CardIssue & { number: number })[];
  numberOf: (item: Item) => number | null;
  wantedFor: (issue: CardIssue & { number: number }) => { kind: string; waitingOn: string } | null;
  present?: Record<string, boolean>;
  cap?: number;
}): { drift: { number: number; writes: CardFieldWrite[] }[]; deferred: number };
