// Type surface for index.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export const WORLDS: {
  name: string;
  input: string;
  viewers: Record<string, string>;
  chat?: boolean;
  /** What parity proves the world renders; the census walks their routes per viewer. */
  surfaces: { id: string; viewer: string; route: string; struck?: string }[];
}[];
