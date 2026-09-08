import type { TickerEntry } from "./types.js";

/**
 * Commonly-searched small-cap, meme and penny names — the ones a member is likeliest to type on a
 * whim even though the house has no playbook opinion on them. Volatile and delisting-prone by
 * nature; entries here are only names confidently still listed as of this file's writing.
 */
export const SMALL_CAP: readonly TickerEntry[] = [
  { symbol: "GME", name: "GameStop", sector: "Small cap" },
  { symbol: "AMC", name: "AMC Entertainment", sector: "Small cap" },
  { symbol: "PLUG", name: "Plug Power", sector: "Small cap" },
  { symbol: "FCEL", name: "FuelCell Energy", sector: "Small cap" },
  { symbol: "RIOT", name: "Riot Platforms", sector: "Small cap" },
  { symbol: "MARA", name: "MARA Holdings", sector: "Small cap" },
  { symbol: "CLSK", name: "CleanSpark", sector: "Small cap" },
  { symbol: "SIRI", name: "Sirius XM Holdings", sector: "Small cap" },
  { symbol: "BB", name: "BlackBerry", sector: "Small cap" },
  { symbol: "NOK", name: "Nokia", sector: "Small cap" },
  { symbol: "IONQ", name: "IonQ", sector: "Small cap" },
  { symbol: "RIVN", name: "Rivian Automotive", sector: "Small cap" },
  { symbol: "LCID", name: "Lucid Group", sector: "Small cap" },
  { symbol: "CHPT", name: "ChargePoint Holdings", sector: "Small cap" },
  { symbol: "SNDL", name: "SNDL", sector: "Small cap" },
  { symbol: "TLRY", name: "Tilray Brands", sector: "Small cap" },
  { symbol: "CGC", name: "Canopy Growth", sector: "Small cap" },
  { symbol: "ACB", name: "Aurora Cannabis", sector: "Small cap" },
  { symbol: "NIO", name: "NIO", sector: "Small cap" },
  { symbol: "XPEV", name: "XPeng", sector: "Small cap" },
  { symbol: "LI", name: "Li Auto", sector: "Small cap" },
  { symbol: "BBAI", name: "BigBear.ai", sector: "Small cap" },
  { symbol: "SOUN", name: "SoundHound AI", sector: "Small cap" },
  { symbol: "UPST", name: "Upstart Holdings", sector: "Small cap" },
  { symbol: "AFRM", name: "Affirm Holdings", sector: "Small cap" },
  { symbol: "DKNG", name: "DraftKings", sector: "Small cap" },
  { symbol: "OPEN", name: "Opendoor Technologies", sector: "Small cap" },
  { symbol: "CVNA", name: "Carvana", sector: "Small cap" },
  { symbol: "BYND", name: "Beyond Meat", sector: "Small cap" },
  { symbol: "SPCE", name: "Virgin Galactic Holdings", sector: "Small cap" },
];
