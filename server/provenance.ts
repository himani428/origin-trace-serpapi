import { createHash } from 'node:crypto';
import type {
  Edge,
  Evidence,
  Related,
  Region,
  ScoreFactor,
  Signal,
  SourceEngine,
  SourceKind,
  Stance,
  StanceCounts,
  TraceResult,
  TraceSummary,
  Verdict
} from '../shared/types';
import { parsePublishedAt } from './dates';
import { detectStance } from './stance';

export interface RawItem {
  title: string;
  link: string;
  snippet: string;
  source: string | null;
  dateRaw: string | null;
  isoDate: string | null;
  engine: SourceEngine;
}

const STOPWORDS = new Set(
  (
    'the and that this with have has are was were for not you your they them their been into than then its about ' +
    'after before over under also just more most some such only can could would should does did due per via new ' +
    'will from next what when where which while who whom whose how why but all any our out off one two may might ' +
    'says said say being get gets got going gone make made ' +
    'है हैं के की का में से को और पर यह कि था ने एक भी तो हो'
  ).split(' ')
);

const MAX_EVIDENCE = 80;
const DAY_MS = 86_400_000;

function stem(token: string): string {
  return token.length > 3 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;
}

function rawTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function extractKeywords(claim: string): string[] {
  const keywords = rawTokens(claim)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
    .map(stem);
  return [...new Set(keywords)];
}

function tokenSet(text: string): Set<string> {
  return new Set(rawTokens(text).map(stem));
}

function keywordCoverage(keywords: string[], tokens: Set<string>): number {
  if (keywords.length === 0) return 1;
  const matched = keywords.filter((keyword) => tokens.has(keyword)).length;
  return matched / keywords.length;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

function normalizeUrl(link: string): string | null {
  try {
    const url = new URL(link);
    const host = url.hostname.replace(/^www\./, '');
    const params = new URLSearchParams(url.search);
    for (const key of [...params.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) params.delete(key);
    }
    const query = params.toString();
    const pathName = url.pathname.replace(/\/+$/, '');
    return `${host}${pathName}${query ? `?${query}` : ''}`;
  } catch {
    return null;
  }
}

function domainOf(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

const PRIMARY_DOMAIN =
  /(\.gov(\.[a-z]{2})?|\.edu(\.[a-z]{2})?|\.nic\.in|\.ac\.in|\.mil|\.int)$|(^|\.)(who\.int|un\.org|worldbank\.org|rbi\.org\.in|pib\.gov\.in)$/i;

const FACTCHECK_DOMAIN =
  /(boomlive|altnews|factly|newschecker|vishvasnews|factcrescendo|factchecker|snopes|politifact|factcheck|fullfact|checkyourfact|logicallyfacts|dubawa)/i;

const FACTCHECK_TEXT = /\b(fact[- ]?check\w*|debunk\w*|claim review|fake news|hoax|misleading|false claim)\b/i;

function classify(engine: SourceEngine, domain: string, url: string, text: string): SourceKind {
  if (engine === 'google_scholar') return 'scholar';
  if (FACTCHECK_DOMAIN.test(domain)) return 'factcheck';
  if (PRIMARY_DOMAIN.test(domain)) return /fact-?check/i.test(url) ? 'factcheck' : 'primary';
  if (engine === 'google_factcheck' && FACTCHECK_TEXT.test(text)) return 'factcheck';
  if (engine === 'google_news') return 'news';
  return 'web';
}

function buildEvidence(keywords: string[], raw: RawItem[]): Evidence[] {
  const seen = new Set<string>();
  const evidence: Evidence[] = [];

  // Fact check results go first so a URL found by several searches keeps its fact check label.
  const ordered = [...raw].sort(
    (a, b) => Number(b.engine === 'google_factcheck') - Number(a.engine === 'google_factcheck')
  );

  for (const item of ordered) {
    if (!item.title || !item.link) continue;
    const normalized = normalizeUrl(item.link);
    if (!normalized || seen.has(normalized)) continue;

    const domain = domainOf(item.link);
    const combined = `${item.title} ${item.snippet}`;
    const kind = classify(item.engine, domain, item.link, combined);
    const similarity = keywordCoverage(keywords, tokenSet(combined));
    const threshold = kind === 'scholar' || kind === 'factcheck' ? 0.3 : 0.4;
    if (similarity < threshold) continue;

    seen.add(normalized);
    let stance: Stance = kind === 'scholar' ? 'neutral' : detectStance(combined);
    // A news or web item that closely repeats the claim wording, and is not a question, counts as repeating it.
    if (stance === 'neutral' && (kind === 'news' || kind === 'web') && similarity >= 0.8 && !item.title.includes('?')) {
      stance = 'supports';
    }
    const published = parsePublishedAt(item.dateRaw, item.isoDate);

    evidence.push({
      id: createHash('sha1').update(normalized).digest('hex').slice(0, 10),
      title: item.title,
      url: item.link,
      domain,
      outlet: item.engine === 'google_scholar' ? domain : item.source || domain,
      snippet: item.snippet,
      engine: item.engine,
      kind,
      stance,
      publishedAt: published ? published.toISOString() : null,
      dateLabel: item.dateRaw ?? (published ? published.toISOString().slice(0, 10) : null),
      similarity: Math.round(similarity * 100) / 100
    });
  }

  evidence.sort((a, b) => {
    if (a.publishedAt && b.publishedAt) return Date.parse(a.publishedAt) - Date.parse(b.publishedAt);
    if (a.publishedAt) return -1;
    if (b.publishedAt) return 1;
    return b.similarity - a.similarity;
  });

  return evidence.slice(0, MAX_EVIDENCE);
}

/**
 * The origin candidate is the earliest dated news or web result that closely matches the claim.
 * Official, fact check, and scholarly sources are reported separately and only used when nothing else is dated.
 */
function pickOrigin(evidence: Evidence[]): Evidence | null {
  const spread = evidence.filter((e) => e.publishedAt && (e.kind === 'news' || e.kind === 'web'));
  const strong = spread.filter((e) => e.similarity >= 0.5);
  const pick = strong[0] ?? spread[0];
  if (pick) return pick;
  return evidence.find((e) => e.publishedAt && (e.kind === 'primary' || e.kind === 'factcheck')) ?? null;
}

function buildEdges(evidence: Evidence[], origin: Evidence | null): Edge[] {
  const dated = evidence.filter((e) => e.publishedAt && e.kind !== 'scholar');
  const tokens = new Map<string, Set<string>>();
  for (const e of dated) tokens.set(e.id, tokenSet(`${e.title} ${e.snippet}`));

  const edges: Edge[] = [];
  dated.forEach((current, index) => {
    if (index === 0) return;
    let best: { id: string; score: number } | null = null;
    for (let i = 0; i < index; i += 1) {
      const score = jaccard(tokens.get(current.id)!, tokens.get(dated[i].id)!);
      if (!best || score > best.score) best = { id: dated[i].id, score };
    }
    if (best && best.score >= 0.2) {
      edges.push({ from: best.id, to: current.id, weight: Math.round(best.score * 100) / 100 });
    } else if (origin && origin.id !== current.id) {
      const score = jaccard(tokens.get(current.id)!, tokens.get(origin.id)!);
      if (score >= 0.1) edges.push({ from: origin.id, to: current.id, weight: Math.round(score * 100) / 100 });
    }
  });
  return edges;
}

function buildSummary(evidence: Evidence[], origin: Evidence | null): TraceSummary {
  const times = evidence
    .filter((e) => e.publishedAt && e.kind !== 'scholar')
    .map((e) => Date.parse(e.publishedAt as string));
  const earliest = times.length ? Math.min(...times) : null;
  const latest = times.length ? Math.max(...times) : null;
  const reporting = evidence.filter((e) => e.kind === 'news' || e.kind === 'web');

  return {
    originId: origin ? origin.id : null,
    earliestAt: earliest !== null ? new Date(earliest).toISOString() : null,
    latestAt: latest !== null ? new Date(latest).toISOString() : null,
    spanDays: earliest !== null && latest !== null ? Math.round(((latest - earliest) / DAY_MS) * 10) / 10 : null,
    independentOutlets: new Set(reporting.map((e) => e.domain)).size,
    primarySources: evidence.filter((e) => e.kind === 'primary').length,
    factChecks: evidence.filter((e) => e.kind === 'factcheck').length,
    scholarlySources: evidence.filter((e) => e.kind === 'scholar').length,
    datedCount: evidence.filter((e) => e.publishedAt).length,
    undatedCount: evidence.filter((e) => !e.publishedAt).length
  };
}

function buildScore(summary: TraceSummary, evidence: Evidence[]): { score: number; factors: ScoreFactor[] } {
  const corroborating = new Set(
    evidence.filter((e) => e.kind !== 'scholar' && e.similarity >= 0.5).map((e) => e.domain)
  ).size;
  const total = evidence.length || 1;

  const factors: ScoreFactor[] = [
    {
      id: 'official',
      label: 'Official source',
      max: 30,
      points: summary.primarySources > 0 ? 30 : 0,
      note: summary.primarySources > 0 ? 'A government or institutional page matches the claim.' : 'No government or institutional page matched.'
    },
    {
      id: 'factcheck',
      label: 'Fact checkers',
      max: 25,
      points: summary.factChecks >= 2 ? 25 : summary.factChecks === 1 ? 15 : 0,
      note: summary.factChecks > 0 ? `${summary.factChecks} fact checking result(s) matched.` : 'No fact checking result matched.'
    },
    {
      id: 'diversity',
      label: 'Outlet diversity',
      max: 15,
      points: Math.round((15 * Math.min(summary.independentOutlets, 6)) / 6),
      note: `${summary.independentOutlets} distinct outlet domain(s) reported it. Six or more earns full points.`
    },
    {
      id: 'corroboration',
      label: 'Corroboration',
      max: 10,
      points: corroborating >= 3 ? 10 : corroborating === 2 ? 6 : corroborating === 1 ? 3 : 0,
      note: `${corroborating} distinct domain(s) closely match the claim wording.`
    },
    {
      id: 'scholarly',
      label: 'Scholarly background',
      max: 10,
      points: summary.scholarlySources >= 2 ? 10 : summary.scholarlySources === 1 ? 6 : 0,
      note: summary.scholarlySources > 0 ? `${summary.scholarlySources} scholarly result(s) matched.` : 'No scholarly result matched.'
    },
    {
      id: 'dating',
      label: 'Dated timeline',
      max: 10,
      points: Math.round((10 * summary.datedCount) / total),
      note: `${summary.datedCount} of ${evidence.length} sources carry a readable date.`
    }
  ];

  const score = evidence.length === 0 ? 0 : factors.reduce((sum, f) => sum + f.points, 0);
  return { score, factors };
}

function buildStanceCounts(evidence: Evidence[]): StanceCounts {
  const counts: StanceCounts = { supports: 0, disputes: 0, neutral: 0 };
  for (const e of evidence) if (e.kind !== 'scholar') counts[e.stance] += 1;
  return counts;
}

function buildVerdict(evidence: Evidence[]): Verdict {
  const authoritative = evidence.filter((e) => e.kind === 'primary' || e.kind === 'factcheck');
  const disputes = authoritative.filter((e) => e.stance === 'disputes').length;
  const supports = authoritative.filter((e) => e.stance === 'supports').length;

  if (evidence.length === 0) {
    return { tone: 'unverified', label: 'Nothing to trace', detail: 'No results matched enough of the claim wording.' };
  }
  if (disputes > 0 && disputes >= supports) {
    return {
      tone: 'disputed',
      label: 'Disputed by checkers or officials',
      detail: `${disputes} official or fact checking source(s) use language that disputes the claim. Open them to confirm.`
    };
  }
  if (supports > 0) {
    return {
      tone: 'supported',
      label: 'Backed by official or fact checking sources',
      detail: `${supports} official or fact checking source(s) use language that supports the claim. Open them to confirm.`
    };
  }
  if (authoritative.length > 0) {
    return {
      tone: 'unclear',
      label: 'Sources found, position unclear',
      detail: 'Official or fact checking sources exist but their wording does not clearly take a side. Read them directly.'
    };
  }
  return {
    tone: 'unverified',
    label: 'Unverified',
    detail: 'No official or fact checking source matched this claim. Treat it as unconfirmed until one appears.'
  };
}

function buildSignals(summary: TraceSummary, origin: Evidence | null, evidence: Evidence[]): Signal[] {
  const signals: Signal[] = [];

  if (evidence.length === 0) {
    signals.push({ level: 'warn', text: 'No results matched enough of the claim to trace. Try rephrasing the claim with its key nouns.' });
    return signals;
  }

  if (summary.factChecks > 0) {
    signals.push({
      level: 'good',
      text: `${summary.factChecks} fact checking result(s) matched. Read them before sharing the claim.`
    });
  }

  if (summary.primarySources > 0) {
    signals.push({
      level: 'good',
      text: `${summary.primarySources} government or institutional source(s) matched. These outrank news reports.`
    });
  } else if (summary.scholarlySources === 0 && summary.factChecks === 0) {
    signals.push({
      level: 'warn',
      text: 'No official, fact checking, or scholarly source matched this claim in the results retrieved.'
    });
  }

  if (origin && origin.kind !== 'primary') {
    signals.push({
      level: 'info',
      text: `The earliest dated match comes from ${origin.outlet}, which is not an official source. Later items may derive from it.`
    });
  }

  if (summary.independentOutlets >= 4 && summary.spanDays !== null && summary.spanDays <= 3) {
    signals.push({
      level: 'warn',
      text: `${summary.independentOutlets} outlets covered this within ${summary.spanDays} days, which can indicate fast amplification of a single report.`
    });
  }

  if (summary.undatedCount > summary.datedCount) {
    signals.push({ level: 'info', text: 'Most results carry no readable date, so the timeline may be incomplete.' });
  }

  return signals;
}

export function buildTrace(
  claim: string,
  raw: RawItem[],
  options: {
    demo: boolean;
    engineCounts: Record<string, number>;
    warnings: string[];
    related: Related;
    region: Region;
  }
): TraceResult {
  const keywords = extractKeywords(claim);
  const evidence = buildEvidence(keywords, raw);
  const origin = pickOrigin(evidence);
  const edges = buildEdges(evidence, origin);
  const summary = buildSummary(evidence, origin);
  const { score, factors } = buildScore(summary, evidence);

  return {
    claim,
    keywords,
    demo: options.demo,
    fetchedAt: new Date().toISOString(),
    region: options.region,
    engineCounts: options.engineCounts,
    evidence,
    edges,
    summary,
    score,
    scoreFactors: factors,
    verdict: buildVerdict(evidence),
    stanceCounts: buildStanceCounts(evidence),
    signals: buildSignals(summary, origin, evidence),
    related: options.related,
    warnings: options.warnings
  };
}
