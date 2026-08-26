/**
 * The return + distribution primitives shared across the intraday-edges study: percent return,
 * and per-series stats (mean, sd, median, win rate, annualized Sharpe, total).
 */

export const ret = (a, b) => (b / a - 1) * 100;

export function stats(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return null;
  const mean = s.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(s.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1)) : 0;
  return {
    n,
    mean,
    sd,
    median: s[Math.floor(n / 2)],
    win: (100 * s.filter((x) => x > 0).length) / n,
    // Annualized Sharpe on a per-session series. Risk-free ignored — every strategy here is
    // compared against buy-and-hold computed the same way, so the omission cancels.
    sharpe: sd > 0 ? (mean / sd) * Math.sqrt(252) : 0,
    total: s.reduce((a, b) => a + b, 0),
  };
}
