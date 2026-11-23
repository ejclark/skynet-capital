// Every read a profile-world page may make (#4943 slice 2), per viewer — the list the composer
// answers ahead of time: the profile's cast, over the shared shape of a world's reads (reads.mjs).

import { worldReads } from "./reads.mjs";

const CAST = {
  accounts: ["eric", "sauron", "jordan"],
  bots: ["sauron"],
  /** Filters a member can apply on Activity: every playbook that placed an order, every symbol. */
  playbooks: ["CRWV-WHEEL", "SAURON", "S1-NVDA", "NVDA-CALL-SPREAD", "G1-GOOG", "TACO-DJT"],
  symbols: ["NVDA", "CRWV", "AMZN", "TSLA", "META", "AAPL", "MSFT", "SPY"],
  chainSymbols: ["NVDA"],
};

export function profileReads() {
  return worldReads(CAST);
}
