import { getEventsWithScores } from '@/lib/db';
import ActionBar from '@/app/components/ActionBar';

/** Strip leading "yes " / "no " from Kalshi titles and capitalise first letter. */
function cleanTitle(title) {
  if (!title) return title;
  return title.replace(/^(yes|no)\s+/i, '').replace(/^./, (c) => c.toUpperCase());
}

/** Pull a readable sport/category label from the ticker.
 *  Kalshi tickers look like: KXNBA-25FEB28-MEM-ORL-TOT-OV219 or NBA-LEBRON-PTS-2025...
 *  We just grab the first segment as the category tag if it's short enough. */
function categoryFromTicker(ticker, category) {
  if (category) return category;
  const first = ticker?.split('-')[0] ?? '';
  return first.length <= 6 ? first : null;
}

function formatCloseDate(closeTime) {
  if (!closeTime) return null;
  const d = new Date(closeTime);
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', hour12: true });
}

function ValueBadge({ score }) {
  if (score == null) return <span className="text-zinc-400">—</span>;
  const color =
    score >= 60 ? 'bg-green-100 text-green-800' :
    score >= 35 ? 'bg-yellow-100 text-yellow-800' :
    'bg-zinc-100 text-zinc-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

function SentimentBadge({ sentiment }) {
  if (!sentiment) return <span className="text-zinc-400">—</span>;
  const colors = { bullish: 'text-green-700', bearish: 'text-red-600', neutral: 'text-zinc-500' };
  return (
    <span className={`text-xs font-medium capitalize ${colors[sentiment] ?? ''}`}>
      {sentiment}
    </span>
  );
}

function CategoryTag({ label }) {
  if (!label) return null;
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-600 mr-1.5">
      {label}
    </span>
  );
}

export default function Home() {
  const events = getEventsWithScores();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Prediction Markets</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {events.length} events · ranked by Value Score
            </p>
          </div>
          <ActionBar />
        </div>

        {events.length === 0 ? (
          <div className="text-center py-24 text-zinc-400 text-sm">
            No events yet. Click &ldquo;Sync from Kalshi&rdquo; to load markets.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-right">YES</th>
                  <th className="px-4 py-3 text-right">NO</th>
                  <th className="px-4 py-3 text-center">Sentiment</th>
                  <th className="px-4 py-3 text-center">Confidence</th>
                  <th className="px-4 py-3 text-center">Value Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {events.map((e) => {
                  const cat = categoryFromTicker(e.ticker, e.category);
                  const closeDate = formatCloseDate(e.close_time);
                  return (
                    <tr key={e.ticker} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 max-w-sm">
                        <div className="flex items-start gap-1 flex-wrap">
                          <CategoryTag label={cat} />
                          <span className="font-medium text-zinc-900 line-clamp-2">
                            {cleanTitle(e.title)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-zinc-300">{e.ticker}</span>
                          {closeDate && (
                            <span className="text-[10px] text-zinc-400">closes {closeDate}</span>
                          )}
                        </div>
                        {e.reasoning && (
                          <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1 italic">{e.reasoning}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-700">
                        {e.yes_ask != null ? `${e.yes_ask}¢` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-700">
                        {e.no_ask != null ? `${e.no_ask}¢` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SentimentBadge sentiment={e.sentiment} />
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600">
                        {e.confidence != null ? `${e.confidence}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ValueBadge score={e.value_score} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
