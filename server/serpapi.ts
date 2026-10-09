import type { RelatedQuestion, Related, SourceEngine, StepInfo } from '../shared/types';
import { readCache, writeCache } from './cache';
import { extractKeywords } from './provenance';
import type { RawItem } from './provenance';

const BASE_URL = 'https://serpapi.com/search.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;
type SerpEngine = 'google' | 'google_news' | 'google_scholar';

async function serpApiRequest(
  engine: SerpEngine,
  params: Record<string, string>,
  apiKey: string
): Promise<Json> {
  const cacheKey = { engine, params };
  const cached = await readCache<Json>(cacheKey);
  if (cached) return cached;

  const url = new URL(BASE_URL);
  url.searchParams.set('engine', engine);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url);
  let body: Json = {};
  try {
    body = (await response.json()) as Json;
  } catch {
    // Non JSON body, handled below through the status code.
  }

  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : response.statusText;
    throw new Error(`SerpApi ${engine} request failed (HTTP ${response.status}): ${message}`);
  }

  if (typeof body.error === 'string') {
    if (/hasn't returned any results|no results/i.test(body.error)) return {};
    throw new Error(`SerpApi ${engine} returned an error: ${body.error}`);
  }

  await writeCache(cacheKey, body);
  return body;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseWeb(body: Json, engine: SourceEngine): RawItem[] {
  const results: Json[] = Array.isArray(body.organic_results) ? body.organic_results : [];
  return results.map((r) => ({
    title: text(r.title),
    link: text(r.link),
    snippet: text(r.snippet),
    source: text(r.source) || text(r.displayed_link) || null,
    dateRaw: text(r.date) || null,
    isoDate: null,
    engine
  }));
}

function parseRelated(body: Json): Related {
  const questions: RelatedQuestion[] = (Array.isArray(body.related_questions) ? (body.related_questions as Json[]) : [])
    .map((q) => ({
      question: text(q.question),
      snippet: text(q.snippet),
      link: text(q.link),
      source: text(q.title) || text(q.displayed_link)
    }))
    .filter((q) => q.question);
  const searches = (Array.isArray(body.related_searches) ? (body.related_searches as Json[]) : [])
    .map((s) => text(s.query))
    .filter(Boolean);
  return { questions: questions.slice(0, 8), searches: searches.slice(0, 8) };
}

function parseNews(body: Json): RawItem[] {
  const results: Json[] = Array.isArray(body.news_results) ? body.news_results : [];
  const flat: Json[] = [];
  for (const r of results) {
    flat.push(r);
    if (Array.isArray(r.stories)) flat.push(...(r.stories as Json[]));
  }
  return flat.map((r) => ({
    title: text(r.title),
    link: text(r.link),
    snippet: text(r.snippet),
    source: text(r.source?.name) || null,
    dateRaw: text(r.date) || null,
    isoDate: text(r.iso_date) || null,
    engine: 'google_news' as const
  }));
}

function parseScholar(body: Json): RawItem[] {
  const results: Json[] = Array.isArray(body.organic_results) ? body.organic_results : [];
  return results.map((r) => {
    const summary = text(r.publication_info?.summary);
    const year = summary.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
    return {
      title: text(r.title),
      link: text(r.link),
      snippet: text(r.snippet),
      source: summary || null,
      dateRaw: year,
      isoDate: year ? `${year}-01-01T00:00:00Z` : null,
      engine: 'google_scholar' as const
    };
  });
}

export const STEPS: StepInfo[] = [
  { id: 'news', label: 'Google News' },
  { id: 'web', label: 'Google Search' },
  { id: 'factcheck', label: 'Fact checkers' },
  { id: 'scholar', label: 'Google Scholar' }
];

export type StepReporter = (
  id: string,
  status: 'running' | 'done' | 'error',
  detail?: { count?: number; message?: string }
) => void;

export interface FetchOptions {
  gl: string;
  hl: string;
}

export interface FetchedEvidence {
  items: RawItem[];
  engineCounts: Record<string, number>;
  warnings: string[];
  related: Related;
}

/**
 * Runs four SerpApi searches in parallel for one claim:
 * Google News for who reported it, Google Search for the wider web and related questions,
 * a fact check query for checkers, and Google Scholar for scholarly background.
 */
export async function fetchEvidence(
  claim: string,
  apiKey: string,
  options: FetchOptions,
  report: StepReporter
): Promise<FetchedEvidence> {
  const { gl, hl } = options;
  const scholarQuery = extractKeywords(claim).slice(0, 8).join(' ') || claim;
  let related: Related = { questions: [], searches: [] };

  const jobs: { id: string; engine: SourceEngine; run: () => Promise<RawItem[]> }[] = [
    {
      id: 'news',
      engine: 'google_news',
      run: async () => parseNews(await serpApiRequest('google_news', { q: claim, gl, hl }, apiKey))
    },
    {
      id: 'web',
      engine: 'google',
      run: async () => {
        const body = await serpApiRequest('google', { q: claim, gl, hl, num: '20' }, apiKey);
        related = parseRelated(body);
        return parseWeb(body, 'google');
      }
    },
    {
      id: 'factcheck',
      engine: 'google_factcheck',
      run: async () =>
        parseWeb(await serpApiRequest('google', { q: `${claim} fact check`, gl, hl, num: '10' }, apiKey), 'google_factcheck')
    },
    {
      id: 'scholar',
      engine: 'google_scholar',
      run: async () => parseScholar(await serpApiRequest('google_scholar', { q: scholarQuery, hl }, apiKey))
    }
  ];

  const settled = await Promise.allSettled(
    jobs.map(async (job) => {
      report(job.id, 'running');
      try {
        const items = await job.run();
        report(job.id, 'done', { count: items.length });
        return items;
      } catch (error) {
        report(job.id, 'error', { message: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    })
  );

  const items: RawItem[] = [];
  const engineCounts: Record<string, number> = {};
  const warnings: string[] = [];
  const failures: string[] = [];

  settled.forEach((result, index) => {
    const engine = jobs[index].engine;
    if (result.status === 'fulfilled') {
      engineCounts[engine] = result.value.length;
      items.push(...result.value);
    } else {
      engineCounts[engine] = 0;
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      failures.push(message);
      warnings.push(message);
    }
  });

  if (failures.length === jobs.length) {
    throw new Error(failures[0]);
  }

  return { items, engineCounts, warnings, related };
}
