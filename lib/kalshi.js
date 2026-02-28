const BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

// Map event_ticker prefixes to readable sport/category labels
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

  // Fetch more than needed — MVE parlays will be filtered out
  const res = await fetch(`${BASE_URL}/markets?limit=200&status=open`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kalshi API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const all = data.markets ?? [];

  // Filter out MVE (multi-leg parlay) markets — their titles are concatenated
  // garbage and they don't fit the single-event analysis model
  const single = all.filter(m => !m.mve_collection_ticker);

  return single.slice(0, limit);
}
