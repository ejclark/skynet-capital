// Type surface for pin-rules.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface Palette {
  bg: string;
  text: string;
  accent: string;
  onAccent: string;
}
export interface Pin {
  x: number;
  y: number;
  n: number;
  label: string;
  side: "right" | "left" | "top" | "bottom";
  box?: [number, number, number, number];
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Drawn {
  kind: "badge" | "label" | "box" | "quote" | "tag";
  n?: number;
  side?: string;
  rect: Rect;
  font?: number;
  at?: { x: number; y: number };
}

export const PALETTE: { dark: Palette; light: Palette };
export function contrast(a: string, b: string): number;
export function paletteProblems(palette?: Record<string, Palette>): string[];
export function readPins(raw: unknown): {
  pins: Pin[];
  quote?: { text: string; who: string; at: [number, number] };
  tag?: string;
  problems: string[];
};
/** The manifest's `pins` for a frame: the list readPins filled, without box/quote/tag. */
export function manifestPins(pins: Pin[]): Pick<Pin, "n" | "x" | "y" | "label" | "side">[];
export function layoutProblems(items: Drawn[], frame: { width: number; height: number }): string[];
export function imageSize(buf: Buffer): { width: number; height: number };
