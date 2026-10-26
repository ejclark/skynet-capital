/** A dollar amount to the cent, no thousands separators — "$1234.50" — the form claim verdict and
 *  steering sentences quote prices in. */
export const money = (n: number): string => `$${n.toFixed(2)}`;
