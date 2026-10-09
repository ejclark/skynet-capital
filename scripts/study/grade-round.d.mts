// Type surface for grade-round.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

import type {
  Agreement,
  Check,
  ControlResult,
  Finding,
  Gate,
  GoldItem,
  Interval,
  MatchEntry,
  Thoroughness,
  Validity,
} from "./grade-core.mjs";

export interface ControlRound {
  expect: string[];
  findings: Finding[];
  m1: MatchEntry[];
  m2: MatchEntry[];
  tiebreak?: MatchEntry[];
}
export interface RoundInput {
  gold: GoldItem[];
  primes?: Record<string, string[]>;
  findings: Finding[];
  classes: Record<string, string>;
  m1: MatchEntry[];
  m2: MatchEntry[];
  tiebreak?: MatchEntry[];
  checks?: Check[];
  struck?: string[];
  touches?: Record<string, unknown> | null;
  sessions?: { member?: string; success: boolean; ease: number | null }[];
  negative?: ControlRound | null;
  positive?: ControlRound | null;
}
export interface ClassGrade {
  thoroughness: Thoroughness;
  validity: Validity;
  structural: number;
  smaller: number;
}
export interface GoldRow {
  id: string;
  tier: GoldItem["tier"];
  struck: boolean;
  touched: boolean | null;
  scores: Record<"members" | "experts" | "words" | "instruments" | "blind", number>;
  primed: boolean;
  disputed: boolean;
}
export interface Grade {
  version: 1;
  headline: {
    found: number;
    renders: number;
    total: number;
    struck: number;
    structural: number;
    smaller: number;
  };
  gate: Gate;
  gold: GoldRow[];
  classes: Record<"members" | "experts" | "words" | "instruments" | "blind", ClassGrade>;
  primed: {
    primed: string[];
    unprimed: string[];
    unprimedRate: number | null;
    unprimedWilson: Interval | null;
  };
  perMember: Record<string, Thoroughness & { primed: string[] }>;
  structural: { count: number; groups: Record<string, string[]> };
  smaller: { count: number; groups: Record<string, string[]> };
  agreement: Agreement & {
    disputed: {
      finding: string;
      m1: { gold: string | null; score: number } | null;
      m2: { gold: string | null; score: number } | null;
      tiebreak: { gold: string | null; score: number } | null;
      resolvedBy: string;
    }[];
  };
  diagnostics: {
    touchesRecorded: boolean;
    easyMode: {
      sessions: number;
      successRate: number | null;
      medianEase: number | null;
      flagged: boolean;
    };
  };
  controls: { negative: ControlResult; positive: ControlResult };
  findings: {
    id: string;
    class: string;
    member: string | null;
    level: string;
    gold: string | null;
    score: number;
    disputed: boolean;
    verdict: string;
  }[];
  problems: string[];
}

export function gradeRound(input: RoundInput): Grade;
