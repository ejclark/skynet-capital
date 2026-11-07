// Type surface for scripts/moneypenny/ask-card.mjs (see index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
export const ASSIGN_MARKER: string;
export const UNASSIGN_MARKER: string;
export const CARD_OPEN: string;
export const CARD_ITEMS: number;
export const NO_DEFAULT_SILENCE: string;

export interface AskOption {
  key: string;
  text: string;
  predicted: boolean;
}
/** One numbered question of a `Needs from you` callout and what it says about itself. */
export interface AskItem {
  question: string;
  options: AskOption[];
  /** The option letter predicted, when the prediction names one. */
  predicted: string | null;
  confidence: string | null;
  /** The prediction as written, letter or prose. */
  forecast: string | null;
  onSilence: string | null;
  unblocks: string | null;
}
/** The machine twin of a card, read back out of the ask comment. */
export interface CardTwin {
  items: {
    keys: string[];
    predicted: string | null;
    confidence: string | null;
    forecast: string | null;
    question: string;
  }[];
}

export function calloutLines(body?: string | null): string[] | null;
export function decisionLine(body?: string | null): string | null;
export function parseAsk(body?: string | null): AskItem[];
export function missingParts(items?: AskItem[]): string[];
export function askRank(input?: {
  labels?: (string | { name?: string })[];
  title?: string;
  decision?: string;
}): 1 | 2 | 3 | 4;
export function assignmentComment(card?: {
  decision?: string;
  items?: AskItem[];
  more?: number;
  heldPr?: boolean;
}): string;
export function cardOf(askBody?: string): CardTwin | null;
