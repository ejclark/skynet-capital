// Type surface for scripts/steer/open-rounds.mjs (see scripts/moneypenny/index.d.mts for why
// scripts/ ships hand-written declarations).
export interface CensusIssue {
  number: number;
  title: string;
  comments: { body?: string }[] | null;
  error?: string;
}

export interface OpenRound {
  issue: number;
  title: string;
  url: string | null;
  id: string | null;
  settled: boolean;
  problem?: string;
}

export function openRounds(census: CensusIssue[]): OpenRound[];
