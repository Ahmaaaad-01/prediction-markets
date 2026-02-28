import { fetchKalshiMarkets, categoryFromEventTicker } from '@/lib/kalshi';
import { upsertEvent } from '@/lib/db';

export async function POST() {
  try {
    const { markets, pagesScanned } = await fetchKalshiMarkets(50);
    const now = new Date().toISOString();

    for (const m of markets) {
      upsertEvent({
        ticker: m.ticker,
        title: m.title,
        yes_ask: m.yes_ask ?? null,
        no_ask: m.no_ask ?? null,
        close_time: m.close_time ?? null,
        category: categoryFromEventTicker(m.event_ticker) ?? m.category ?? null,
        synced_at: now,
      });
    }

    return Response.json({ synced: markets.length, pagesScanned });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
