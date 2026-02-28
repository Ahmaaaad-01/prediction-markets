'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ActionBar() {
  const [syncing, setSyncing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    setStatus('');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus(`Synced ${data.synced} events from Kalshi.`);
      router.refresh();
    } catch (err) {
      setStatus(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleScore() {
    setScoring(true);
    setStatus('Scoring events — this may take a minute...');
    try {
      const res = await fetch('/api/score', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const fresh = data.alreadyFresh ? ` · ${data.alreadyFresh} already fresh` : '';
      const skipped = data.skipped ? ` · ${data.skipped} timed out` : '';
      setStatus(`Scored ${data.scored} of ${data.total} events${fresh}${skipped}.`);
      router.refresh();
    } catch (err) {
      setStatus(`Scoring failed: ${err.message}`);
    } finally {
      setScoring(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleSync}
          disabled={syncing || scoring}
          className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-zinc-700 transition-colors"
        >
          {syncing ? 'Syncing...' : 'Sync from Kalshi'}
        </button>
        <button
          onClick={handleScore}
          disabled={syncing || scoring}
          className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium disabled:opacity-40 hover:bg-zinc-50 transition-colors"
        >
          {scoring ? 'Scoring...' : 'Score Events'}
        </button>
      </div>
      {status && <p className="text-xs text-zinc-500">{status}</p>}
    </div>
  );
}
