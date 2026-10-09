import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.resolve(process.cwd(), '.cache');
const TTL_MS = 24 * 60 * 60 * 1000;

function keyFor(parts: unknown): string {
  return createHash('sha1').update(JSON.stringify(parts)).digest('hex');
}

/** Disk cache for SerpApi responses so repeated traces do not spend credits. */
export async function readCache<T>(parts: unknown): Promise<T | null> {
  try {
    const file = path.join(CACHE_DIR, `${keyFor(parts)}.json`);
    const text = await readFile(file, 'utf8');
    const entry = JSON.parse(text) as { savedAt: number; value: T };
    if (Date.now() - entry.savedAt > TTL_MS) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export async function writeCache<T>(parts: unknown, value: T): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, `${keyFor(parts)}.json`);
    await writeFile(file, JSON.stringify({ savedAt: Date.now(), value }), 'utf8');
  } catch {
    // Caching is best effort and must never break a trace.
  }
}
