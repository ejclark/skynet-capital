/**
 * WHAT A NAME'S OWN RESEARCH SAYS ABOUT HOW ITS OPTIONS PRICE ITS PRINTS — a hand-kept table, like
 * `earnings-calendar.ts`, read by the position guidance (#3729) when it explains why an expiry that
 * spans the print is excluded. Symbol-specific evidence is data, never engine text: a claim true of
 * CRWV must not appear on guidance for AAPL. A symbol absent here gets the generic model caveat.
 *
 * Every entry cites the forward test or study it came from, and carries that test's status — an
 * open test is an observation under review, not a law, and the guidance quotes it as such.
 */

export interface PrintEvidence {
  /** One clause, read after "later expiries span the print window —". */
  readonly text: string;
  readonly source: string;
}

const EVIDENCE: Readonly<Record<string, PrintEvidence>> = {
  CRWV: {
    text: "its options have underpriced its print moves (Q2: ~15.5% implied vs ~18.6% realized; FT-15, open)",
    source: "docs/research/forward-tests/legacy.md → FT-15",
  },
};

export function printEvidenceFor(symbol: string): PrintEvidence | undefined {
  return EVIDENCE[symbol.toUpperCase()];
}
