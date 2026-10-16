// Type surface for scripts/steer/widths.mjs (see scripts/moneypenny/index.d.mts).
export const WIDTHS: ["phone", "desk"];
export const WIDTH_WORDS: {
  phone: string;
  desk: string;
  same: string;
  glyphs: { phone: string; desk: string };
};
export function widthsProblems(q: Record<string, unknown>, where: string): string[];
export function bothWidths(pictures: { size: "phone" | "desk" }[] | undefined): boolean;
export function widthsHtml(opts: {
  name: string;
  phone: string;
  desk: string;
  same?: boolean;
}): string;
