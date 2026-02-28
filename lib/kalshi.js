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

function isMVE(market) {
  return (
    !!market.mve_collection_ticker ||
    market.event_ticker?.startsWith('KXMVECROSSCATEGORY')
  );
}

export async function fetchKalshiMarkets(limit = 50) {
  const apiKey = process.env.KALSHI_API_KEY;
  if (!apiKey) throw new Error('Missing KALSHI_API_KEY');

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const single = [];
  let cursor = null;
  let pages = 0;
  const MAX_PAGES = 10; // safety cap — each page is 200 markets

  while (single.length < limit && pages < MAX_PAGES) {
    const url = new URL(`${BASE_URL}/markets`);
    url.searchParams.set('limit', '200');
    url.searchParams.set('status', 'open');
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Kalshi API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const page = data.markets ?? [];

    for (const m of page) {
      if (!isMVE(m)) single.push(m);
    }

    cursor = data.cursor;
    pages++;

    // Stop if Kalshi has no more pages
    if (!cursor || page.length === 0) break;
  }

  return { markets: single.slice(0, limit), pagesScanned: pages };
}
