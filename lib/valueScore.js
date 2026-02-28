/**
 * Compute a Value Score (0-100) from sentiment vs. market odds.
 *
 * sentimentSignal = 50 + confidence/2  if bullish
 *                 = 50 - confidence/2  if bearish
 *                 = 50                 if neutral
 *
 * discrepancy  = sentimentSignal - yes_ask  (yes_ask ≈ market-implied % probability)
 * value_score  = clamp(abs(discrepancy), 0, 100)
 *
 * Higher score = larger gap between sentiment and market price = more potential edge.
 */
export function computeValueScore(sentiment, confidence, yes_ask) {
  let sentimentSignal;
  if (sentiment === 'bullish') {
    sentimentSignal = 50 + confidence / 2;
  } else if (sentiment === 'bearish') {
    sentimentSignal = 50 - confidence / 2;
  } else {
    sentimentSignal = 50;
  }

  const discrepancy = sentimentSignal - (yes_ask ?? 50);
  return Math.round(Math.min(100, Math.abs(discrepancy)));
}
