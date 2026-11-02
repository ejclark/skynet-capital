/** Whole dollars with thousands separators — `$12,500`. The wording budget and allocation lines use. */
export const usdWhole = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;
