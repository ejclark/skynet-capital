/** A count with its noun, pluralised by a bare "s" — `1 record`, `3 records`, `0 records`. */
export const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? "" : "s"}`;
