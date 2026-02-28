const BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export async function fetchKalshiMarkets(limit = 50) {
  const apiKey = process.env.KALSHI_API_KEY;
  if (!apiKey) throw new Error('Missing KALSHI_API_KEY');

  const res = await fetch(`${BASE_URL}/markets?limit=${limit}&status=open`, {
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
  return data.markets ?? [];
}
