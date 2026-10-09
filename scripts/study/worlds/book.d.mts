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
  activity: Record<string, { orderId: string; at: string }[]>;
  decisions: Record<string, BookDecision[]>;
  history: Record<string, { at: string; equity: number }[]>;
  market: {
    expirations: string[];
    symbols: Record<string, { spot: number; prevClose: number; iv: number }>;
  };
}

export function buildBook(name: string): Book;
