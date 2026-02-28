import { getAllEvents, insertScore } from '@/lib/db';
import { fetchRedditPosts, fetchNewsTitles, classifySentiment } from '@/lib/sentiment';
import { computeValueScore } from '@/lib/valueScore';

export async function POST() {
  try {
    const events = getAllEvents();
    const now = new Date().toISOString();
    let scored = 0;

    for (const event of events) {
      try {
        const [redditTitles, newsTitles] = await Promise.all([
          fetchRedditPosts(event.title),
          fetchNewsTitles(event.title),
        ]);

        const headlines = [...redditTitles, ...newsTitles].slice(0, 12);
        const { sentiment, confidence, reasoning } = await classifySentiment(event.title, headlines);
        const value_score = computeValueScore(sentiment, confidence, event.yes_ask);

        insertScore({
          ticker: event.ticker,
          sentiment,
          confidence,
          value_score,
          reasoning,
          scored_at: now,
        });

        scored++;
      } catch (err) {
        console.error(`Failed to score ${event.ticker}:`, err.message);
      }
    }

    return Response.json({ scored });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
