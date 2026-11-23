// Type surface for book.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface BookPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  marketValue: number;
  lastdayPrice: number;
}

export interface BookParticipant {
  id: string;
  kind: "human" | "bot";
  cash: number;
  equity: number;
  positions: BookPosition[];
  monthReturnPct?: number;
}

export interface BookDecision {
  at: number;
  outcomes: { intent: Record<string, unknown>; result?: { orderId?: string } }[];
  playbookVerdicts?: { playbookId: string; mode: string; state: string }[];
}

export interface Book {
  generatedAt: string;
  members: { email: string; owns: string[] }[];
  participants: BookParticipant[];
  activity: Record<string, { orderId: string; symbol: string; at: string }[]>;
  decisions: Record<string, BookDecision[]>;
  /** Each bot's declared check cadence in ms (`bot.cadenceSeconds`), for the week strip. */
  cadenceMs: Record<string, number>;
  history: Record<string, { at: string; equity: number }[]>;
  /** Yesterday's closing equity per participant, derived (yesterdayEquity). */
  lastEquity: Record<string, number>;
  /** P/L booked today on positions already closed, as the input declares it. */
  closedToday: Record<string, number>;
  /** The owner's controls file and change log, when the world declares one (#8005). */
  controls?: { bots: Record<string, Record<string, unknown>>; changes?: Record<string, unknown[]> };
  market: {
    expirations: string[];
    symbols: Record<string, { spot: number; prevClose: number; iv: number }>;
  };
  /** What each member watches, keyed by the account their session resolves to. */
  watchlists: Record<string, { symbol: string; at: string }[]>;
  /** Each account's working orders: placed, nothing filled. */
  working: Record<string, { orderId: string; symbol: string; side: string; at: string }[]>;
}

/** An input position with what it left out derived: an option's marks, a share position's cost. */
export interface InputPosition {
  symbol: string;
  quantity: number;
  avgPrice?: number;
  mark?: number;
  lastday?: number;
  fromWheelSale?: boolean;
}
export function derivedFields(
  pos: InputPosition,
  fills: { symbol: string; side: string; quantity: number; price: number }[],
  symbols: Record<string, { spot: number; prevClose: number; iv: number }>,
): InputPosition;

export function buildBook(name: string): Book;
export function yesterdayEquity(
  input: { id: string; cash: number; lastEquity?: number; closedToday?: number },
  snapshot: { positions: { quantity: number; lastdayPrice: number }[] },
): number;
