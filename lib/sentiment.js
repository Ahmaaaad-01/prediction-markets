import { GoogleGenerativeAI } from '@google/generative-ai';

export async function fetchRedditPosts(query, limit = 8) {
  const url = new URL('https://www.reddit.com/search.json');
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'relevance');
  url.searchParams.set('t', 'week');
  url.searchParams.set('limit', limit);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'prediction-markets-agent/1.0' },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return (data?.data?.children ?? []).map(({ data: p }) => p.title);
}

export async function fetchNewsTitles(query, limit = 8) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', query);
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', limit);
  url.searchParams.set('language', 'en');
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  if (data.status !== 'ok') return [];
  return (data.articles ?? []).map((a) => a.title).filter(Boolean);
}

export async function classifySentiment(eventTitle, headlines) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  if (headlines.length === 0) {
    return { sentiment: 'neutral', confidence: 0, reasoning: 'No headlines found.' };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a financial sentiment analyst for a prediction markets tool.

Event: "${eventTitle}"

Recent headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Analyze these headlines and return a JSON object with:
- sentiment: "bullish" | "bearish" | "neutral" (relative to the YES outcome)
- confidence: number 0-100 (how confident you are in the sentiment)
- reasoning: 1-2 sentence explanation

Return only valid JSON, no extra text.`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}
