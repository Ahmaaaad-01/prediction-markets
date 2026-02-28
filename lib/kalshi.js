const BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

const EVENT_TICKER_CATEGORIES = [
  ['KXNBA',        'NBA'],
  ['KXNFL',        'NFL'],
  ['KXMLB',        'MLB'],
  ['KXNHL',        'NHL'],
  ['KXEPL',        'EPL'],
  ['KXBUNDESLIGA', 'Bundesliga'],
  ['KXLALIGA',     'La Liga'],
  ['KXLIGUE1',     'Ligue 1'],
  ['KXSERIEA',     'Serie A'],
  ['KXUFC',        'UFC'],
  ['KXNASCAR',     'NASCAR'],
  ['KXCBB',        'NCAA Basketball'],
  ['KXNCAAF',      'NCAA Football'],
];

export function categoryFromEventTicker(eventTicker) {
  if (!eventTicker) return null;
  for (const [prefix, label] of EVENT_TICKER_CATEGORIES) {
    if (eventTicker.startsWith(prefix)) return label;
  }
  return null;
}

export async function fetchKalshiMarkets(limit = 50) {
  const apiKey = process.env.KALSHI_API_KEY;
  if (!apiKey) throw new Error('Missing KALSHI_API_KEY');

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Step 1: get open events — these have clean human-readable titles
  const evRes = await fetch(`${BASE_URL}/events?status=open&limit=200`, { headers });
  if (!evRes.ok) {
    const body = await evRes.text();
    throw new Error(`Kalshi events API error ${evRes.status}: ${body}`);
  }
  const evData = await evRes.json();

  // Filter out MVE multi-leg events
  const events = (evData.events ?? []).filter(
    e => !e.event_ticker?.startsWith('KXMVE')
  );

  // Step 2: for each event, fetch its binary markets for odds
  const results = [];

  for (const event of events) {
    if (results.length >= limit) break;

    const mRes = await fetch(
      `${BASE_URL}/markets?event_ticker=${event.event_ticker}&limit=20`,
      { headers }
    );
    if (!mRes.ok) continue;

    const mData = await mRes.json();
    const markets = (mData.markets ?? []).filter(m => {
      if (m.market_type !== 'binary' || m.mve_collection_ticker) return false;
      const yes = m.yes_ask;
      // Skip markets with no real uncertainty — untraded (0/0) or near-certain (0 or 100)
      return yes != null && yes > 4 && yes < 96;
    });

    // Sort by yes_ask desc (highest-priced = most likely = most interesting)
    // and cap at 3 per event so one topic doesn't flood the list
    const top = markets
      .sort((a, b) => b.yes_ask - a.yes_ask)
      .slice(0, 3);

    for (const m of top) {
      if (results.length >= limit) break;

      // Prefer m.subtitle, then m.title if it differs from event title,
      // to distinguish candidates in multi-choice events (e.g. Pope election)
      const qualifier = m.subtitle?.trim() ||
        (m.title?.trim() !== event.title ? m.title?.trim() : null);
      const title = qualifier ? `${event.title} — ${qualifier}` : event.title;

      results.push({ ...m, title, event_ticker: event.event_ticker });
    }
  }

  return { markets: results, pagesScanned: 1 };
}
