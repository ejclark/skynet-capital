import { type FitAnswer, fitFor } from "../playbooks/fit-finder.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";

/**
 * GET /api/research/fit?symbol=CRWV — which strategies one ticker fits (#4469 slice 4, the fit
 * finder). The pair table and the earnings calendar off the code, no broker and no member data, so
 * it rides the same gate as `/api/research/outlook` (authed members) and costs nothing per read.
 * One name per call: the answer is a panel under a symbol's recap, never a list view. A name that is
 * not an underlying gets an empty answer, not an error — one typo should not blank the page.
 */
export function fitAnswerFor(raw: string, now: string): FitAnswer {
  const symbol = raw.trim().toUpperCase();
  return UNDERLYING_PATTERN.test(symbol) ? fitFor(symbol, now) : { symbol: "", fits: [] };
}
