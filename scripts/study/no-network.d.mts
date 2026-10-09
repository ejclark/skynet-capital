// Type surface for no-network.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export function guardNetwork(answer: (url: string) => unknown): {
  refused: string[];
  answered: string[];
};
