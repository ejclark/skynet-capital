import { SYMBOL_RE } from "../domain/campaigns.js";
import { LANE_READS_QUEUE } from "../domain/discovery-lane.js";
import { cleanQuestion } from "../domain/discovery-queue.js";
import { MARKETS, marketById } from "../domain/market-catalog.js";
import { GICS_SECTORS } from "../domain/sector-coverage.js";

/**
 * A QUESTION FOR THE RESEARCH DESK (the Moneypenny operator plan, research slice). When a member
 * asks an open question about a company, a sector or a market that no tool answers, she used to
 * stop at "I don't have that". Now she drafts the question as a card in the rail; only the
 * member's own tap on it posts to the research list (`POST /api/campaigns/ask`, the same route the
 * landing page's ask uses). The tool writes NOTHING: it checks the subject against the catalogs
 * the ask route checks (`askSubject` in `server/member-campaigns-api-routes.ts`), hands the draft
 * to the rail's hook, and tells the model nothing is asked yet — the same shape as
 * `draft_conviction` (`companion-convictions.ts`).
 *
 * Why the check lives here as well as on the route: a subject the route would refuse should be
 * refused while the model can still fix its call, with the valid choices named, instead of
 * surfacing later as a card whose tap fails.
 *
 * Honest about the wait: while `LANE_READS_QUEUE` is false the house's research does not read the
 * list, so the result says so and the prompt forbids promising a time.
 */

export const RESEARCH_ASK_TOOL_NAMES = ["draft_research_ask"] as const;

/** What the rail holds once she drafts a question — posted only on the member's tap. */
export interface ResearchAskDraft {
  readonly kind: "sector" | "market" | "name";
  /** What the ask route takes: a GICS sector name, a market-catalog id, or a ticker. */
  readonly subject: string;
  /** The words a person reads: the sector's name, the market's name, or the ticker. */
  readonly label: string;
  /** The member's question in their own words, cleaned and capped at 200 characters. */
  readonly question?: string;
}

/** What the model reads back once the card is shown — said so it never claims the ask is made. */
export const ASK_CARD_SHOWN =
  "shown to the member as a card in the rail; nothing is asked yet. Only their own tap on 'Ask the research desk' puts the question on the house's research list.";

const WAIT_UNREAD =
  "The house's research does not read this list yet, so there is no wait to promise.";
const WAIT_READ =
  "Once asked, the research desk takes it in turn; the reply to their tap says where it stands.";

const SECTOR_NAMES = GICS_SECTORS.map((s) => s.name).join(", ");
const MARKET_CHOICES = MARKETS.map((m) => `${m.id} (${m.name})`).join(", ");

const KIND_ERROR = "kind must be one of name, sector or market";
const SECTOR_ERROR = `a sector subject must be one of: ${SECTOR_NAMES}`;
const MARKET_ERROR = `a market subject must be one of these ids: ${MARKET_CHOICES}`;
const NAME_ERROR = "a name subject must be a stock ticker like NVDA, never an option symbol";

/** The model's draft, checked against the catalogs the ask route checks, or the reason it isn't one. */
export function parseResearchAsk(input: unknown): ResearchAskDraft | { readonly error: string } {
  const raw = (input && typeof input === "object" ? input : {}) as {
    kind?: unknown;
    subject?: unknown;
    question?: unknown;
  };
  const text = typeof raw.subject === "string" ? raw.subject.trim().slice(0, 60) : "";
  const question = cleanQuestion(raw.question);
  const withQuestion = question ? { question } : {};
  if (raw.kind === "sector") {
    const hit = GICS_SECTORS.find((s) => s.name.toLowerCase() === text.toLowerCase());
    return hit
      ? { kind: "sector", subject: hit.name, label: hit.name, ...withQuestion }
      : { error: SECTOR_ERROR };
  }
  if (raw.kind === "market") {
    const market = marketById(text.toLowerCase());
    return market
      ? { kind: "market", subject: market.id, label: market.name, ...withQuestion }
      : { error: MARKET_ERROR };
  }
  if (raw.kind === "name") {
    const symbol = text.toUpperCase();
    return symbol && SYMBOL_RE.test(symbol)
      ? { kind: "name", subject: symbol, label: symbol, ...withQuestion }
      : { error: NAME_ERROR };
  }
  return { error: KIND_ERROR };
}

export const RESEARCH_ASK_TOOL_DEFS = [
  {
    name: "draft_research_ask",
    description:
      "Show the member a DRAFT research question as a card in the rail: the company, sector or market it is about and their question. Asks NOTHING: only the member's own tap on the card puts it on the house's research list. Call it once the member agreed, in their latest message, to put an open question to the research desk. kind is name (a stock ticker), sector (a sector name, e.g. Technology or Healthcare) or market (a market id, e.g. gold, japan, us-small-caps). Returns shown: true, a status line and a wait line to pass on; returns an error naming the valid choices when the subject isn't one.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["name", "sector", "market"] },
        subject: {
          type: "string",
          description:
            "A stock ticker for name, a GICS sector name for sector, or a market id for market.",
        },
        question: {
          type: "string",
          description: "The member's question in their own words, at most 200 characters.",
        },
      },
      required: ["kind", "subject"],
    },
  },
] as const;

/** Run `draft_research_ask`. `onDraft` is the rail's hand-off, never a write. */
export function runResearchAskTool(
  input: unknown,
  onDraft: ((draft: ResearchAskDraft) => void) | undefined,
):
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error: string } {
  const parsed = parseResearchAsk(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  onDraft?.(parsed);
  return {
    ok: true,
    result: {
      shown: true,
      status: ASK_CARD_SHOWN,
      laneReadsQueue: LANE_READS_QUEUE,
      wait: LANE_READS_QUEUE ? WAIT_READ : WAIT_UNREAD,
    },
  };
}

/** The system prompt's paragraph for this tool. */
export const RESEARCH_ASK_RULE = `ASKING THE RESEARCH DESK: when a member asks an open question about a company, a sector or a market that your tools and the help desk do not answer (why something is moving, what to know about a sector, whether a name is worth a look), do not stop at "I don't have that". Say in one sentence what you do not hold, then offer to put the question to the house's research desk. Once they agree in their latest message, call draft_research_ask with kind (name, sector or market), the subject exactly as the tool lists it, and their question in their own words, at most 200 characters. The rail shows the question as a card; only their tap on "Ask the research desk" puts it on the list. You never put a question on the list yourself and never say it is asked, queued or being researched. After the card shows, pass on the tool's wait line: when it says research does not read the list yet, say exactly that and promise no time. News and lawsuits are still not covered. Research answers what is true; it never tells anyone to buy or sell.`;
