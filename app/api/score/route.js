import { getAllEvents, insertScore, getLastScoredAt } from '@/lib/db';
import { fetchRedditPosts, fetchNewsTitles, classifySentiment } from '@/lib/sentiment';
import { computeValueScore } from '@/lib/valueScore';

const PER_EVENT_TIMEOUT_MS = 20_000; // 20s max per event
const MAX_EVENTS_PER_RUN = 10;       // score at most 10 at a time
const RESCORE_AFTER_MS = 60 * 60 * 1000; // skip events scored within the last hour

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}

async function scoreEvent(event, now) {
  const [redditTitles, newsTitles] = await Promise.all([
    fetchRedditPosts(event.title),
    fetchNewsTitles(event.title),
  ]);

  const headlines = [...redditTitles, ...newsTitles].slice(0, 12);
  const { sentiment, confidence, reasoning } = await classifySentiment(event.title, headlines);
  const value_score = computeValueScore(sentiment, confidence, event.yes_ask);

  insertScore({ ticker: event.ticker, sentiment, confidence, value_score, reasoning, scored_at: now });
  return true;
}

export async function POST() {
  try {
    const allEvents = getAllEvents();
    const now = new Date().toISOString();
    const cutoff = Date.now() - RESCORE_AFTER_MS;

    // Skip events scored recently — only score stale or unscored events
    const toScore = allEvents
      .filter(e => {
        const last = getLastScoredAt(e.ticker);
        return !last || new Date(last).getTime() < cutoff;
      })
      .slice(0, MAX_EVENTS_PER_RUN);

    let scored = 0;
    let skipped = 0;

    for (const event of toScore) {
      try {
        await withTimeout(scoreEvent(event, now), PER_EVENT_TIMEOUT_MS);
        scored++;
      } catch (err) {
        console.error(`Skipped ${event.ticker}: ${err.message}`);
        skipped++;
      }
    }

    return Response.json({
      scored,
      skipped,
      total: allEvents.length,
      alreadyFresh: allEvents.length - toScore.length,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
