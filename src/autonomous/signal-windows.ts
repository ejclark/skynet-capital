/**
 * HOW MUCH HISTORY THE BOTS' TWO SIGNALS READ — one home for the two window settings, so the
 * runners that build the trackers and the Thesis tab that names them (#5327) cannot drift apart.
 *
 * - Momentum: the fractional price change across the last `momentum` price ticks per symbol
 *   (`MomentumTracker`).
 * - News sentiment: the average score of the last `sentiment` news stories naming the symbol
 *   (`SentimentTracker`).
 *
 * The runners pass these straight to the trackers, exactly as they always did (a tracker clamps
 * its own floor). The dashboard reads the same function off its own environment; neither
 * `fly.toml` nor `fly.bots.toml` sets either variable, so both processes run the defaults below.
 * Set one on the bots app alone and the Thesis tab would name the default — set it on both.
 */

export interface SignalWindows {
  readonly momentum: number;
  readonly sentiment: number;
}

export function signalWindows(env: NodeJS.ProcessEnv): SignalWindows {
  return {
    momentum: Number(env.SKYNET_MOMENTUM_WINDOW ?? "20"),
    sentiment: Number(env.SKYNET_SENTIMENT_WINDOW ?? "10"),
  };
}
