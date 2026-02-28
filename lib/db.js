import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'markets.db');

// Persist connection across hot reloads in dev
const g = globalThis;

function getDb() {
  if (!g.__db) {
    mkdirSync(DATA_DIR, { recursive: true });
    g.__db = new Database(DB_PATH);
    g.__db.pragma('journal_mode = WAL');
    initSchema(g.__db);
  }
  return g.__db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      ticker TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      yes_ask INTEGER,
      no_ask INTEGER,
      close_time TEXT,
      category TEXT,
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      sentiment TEXT,
      confidence INTEGER,
      value_score INTEGER,
      reasoning TEXT,
      scored_at TEXT NOT NULL
    );
  `);
}

export function upsertEvent(event) {
  const db = getDb();
  db.prepare(`
    INSERT INTO events (ticker, title, yes_ask, no_ask, close_time, category, synced_at)
    VALUES (@ticker, @title, @yes_ask, @no_ask, @close_time, @category, @synced_at)
    ON CONFLICT(ticker) DO UPDATE SET
      title = excluded.title,
      yes_ask = excluded.yes_ask,
      no_ask = excluded.no_ask,
      close_time = excluded.close_time,
      category = excluded.category,
      synced_at = excluded.synced_at
  `).run(event);
}

export function insertScore(score) {
  const db = getDb();
  db.prepare(`
    INSERT INTO scores (ticker, sentiment, confidence, value_score, reasoning, scored_at)
    VALUES (@ticker, @sentiment, @confidence, @value_score, @reasoning, @scored_at)
  `).run(score);
}

export function getEventsWithScores() {
  const db = getDb();
  return db.prepare(`
    SELECT
      e.*,
      s.sentiment,
      s.confidence,
      s.value_score,
      s.reasoning,
      s.scored_at
    FROM events e
    LEFT JOIN (
      SELECT ticker, sentiment, confidence, value_score, reasoning, scored_at
      FROM scores
      WHERE id IN (SELECT MAX(id) FROM scores GROUP BY ticker)
    ) s ON e.ticker = s.ticker
    ORDER BY COALESCE(s.value_score, -1) DESC
  `).all();
}

export function getAllEvents() {
  const db = getDb();
  return db.prepare(`SELECT * FROM events`).all();
}
