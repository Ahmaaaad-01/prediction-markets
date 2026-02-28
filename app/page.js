import { getEventsWithScores } from '@/lib/db';
import ActionBar from '@/app/components/ActionBar';

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
  const colors = {
    bullish: 'text-green-700',
    bearish: 'text-red-600',
    neutral: 'text-zinc-500',
  };
  return (
    <span className={`text-xs font-medium capitalize ${colors[sentiment] ?? ''}`}>
      {sentiment}
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
                  <th className="px-4 py-3 text-left">Ticker</th>
                  <th className="px-4 py-3 text-right">YES</th>
                  <th className="px-4 py-3 text-right">NO</th>
                  <th className="px-4 py-3 text-center">Sentiment</th>
                  <th className="px-4 py-3 text-center">Confidence</th>
                  <th className="px-4 py-3 text-center">Value Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {events.map((e) => (
                  <tr key={e.ticker} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 max-w-sm">
                      <div className="line-clamp-2">{e.title}</div>
                      {e.reasoning && (
                        <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{e.reasoning}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{e.ticker}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
