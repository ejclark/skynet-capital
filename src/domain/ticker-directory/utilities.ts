import type { TickerEntry } from "./types.js";

/** Regulated electric, gas and water utility names. */
export const UTILITIES: readonly TickerEntry[] = [
  { symbol: "NEE", name: "NextEra Energy", sector: "Utilities" },
  { symbol: "DUK", name: "Duke Energy", sector: "Utilities" },
  { symbol: "SO", name: "Southern Company", sector: "Utilities" },
  { symbol: "D", name: "Dominion Energy", sector: "Utilities" },
  { symbol: "AEP", name: "American Electric Power", sector: "Utilities" },
  { symbol: "EXC", name: "Exelon", sector: "Utilities" },
  { symbol: "SRE", name: "Sempra", sector: "Utilities" },
  { symbol: "XEL", name: "Xcel Energy", sector: "Utilities" },
  { symbol: "ED", name: "Consolidated Edison", sector: "Utilities" },
  { symbol: "WEC", name: "WEC Energy Group", sector: "Utilities" },
  { symbol: "PEG", name: "Public Service Enterprise Group", sector: "Utilities" },
  { symbol: "ES", name: "Eversource Energy", sector: "Utilities" },
  { symbol: "AWK", name: "American Water Works", sector: "Utilities" },
  { symbol: "PCG", name: "PG&E", sector: "Utilities" },
  { symbol: "FE", name: "FirstEnergy", sector: "Utilities" },
];
