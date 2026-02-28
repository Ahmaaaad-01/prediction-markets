import { getEventsWithScores } from '@/lib/db';

export async function GET() {
  try {
    const events = getEventsWithScores();
    return Response.json({ events });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
