// WCAG 2.x relative luminance and contrast ratio — the one copy, shared by the theme gate
// (tests/ui/contrast.spec.ts) and the Mermaid classDef gate (tests/ui/mermaid-classdef.spec.ts),
// so a diagram's colours are judged by exactly the formula the app's tokens are.

/** Relative luminance of a `#rrggbb` colour. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two `#rrggbb` colours, ≥ 1. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
