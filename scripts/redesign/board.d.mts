// Type surface for board.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export function parseBoardArgs(argv: string[]): {
  out: string;
  screens: string[] | null;
  rebuild: boolean;
};
