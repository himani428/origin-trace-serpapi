export type SourceEngine = 'google' | 'google_news' | 'google_scholar' | 'google_factcheck';

export type SourceKind = 'primary' | 'factcheck' | 'scholar' | 'news' | 'web';

export type Stance = 'supports' | 'disputes' | 'neutral';

export interface Evidence {
  id: string;
  title: string;
  url: string;
  domain: string;
  outlet: string;
  snippet: string;
  engine: SourceEngine;
  kind: SourceKind;
  stance: Stance;
  /** ISO timestamp, or null when no date could be read from the result. */
  publishedAt: string | null;
  /** The date text as shown by the search result. */
  dateLabel: string | null;
  /** Share of the claim keywords found in the title and snippet, from 0 to 1. */
  similarity: number;
}

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export interface Signal {
  level: 'good' | 'warn' | 'info';
  text: string;
}

export interface ScoreFactor {
  id: string;
  label: string;
  points: number;
  max: number;
  note: string;
}

export type VerdictTone = 'disputed' | 'supported' | 'unclear' | 'unverified';

export interface Verdict {
  tone: VerdictTone;
  label: string;
  detail: string;
}

export interface TraceSummary {
  originId: string | null;
  earliestAt: string | null;
  latestAt: string | null;
  spanDays: number | null;
  independentOutlets: number;
  primarySources: number;
  factChecks: number;
  scholarlySources: number;
  datedCount: number;
  undatedCount: number;
}

export interface RelatedQuestion {
  question: string;
  snippet: string;
  link: string;
  source: string;
}

export interface Related {
  questions: RelatedQuestion[];
  searches: string[];
}

export interface StanceCounts {
  supports: number;
  disputes: number;
  neutral: number;
}

export interface Region {
  gl: string;
  hl: string;
}

export interface TraceResult {
  claim: string;
  keywords: string[];
  demo: boolean;
  fetchedAt: string;
  region: Region;
  /** Number of raw results returned by each search before filtering. */
  engineCounts: Record<string, number>;
  evidence: Evidence[];
  edges: Edge[];
  summary: TraceSummary;
  /** Verification coverage from 0 to 100. It measures how much checkable material exists, not whether the claim is true. */
  score: number;
  scoreFactors: ScoreFactor[];
  verdict: Verdict;
  stanceCounts: StanceCounts;
  signals: Signal[];
  related: Related;
  warnings: string[];
}

export interface Scenario {
  id: string;
  title: string;
  claim: string;
  blurb: string;
}

export interface HealthResponse {
  demo: boolean;
  scenarios: Scenario[];
}

export interface TraceRequest {
  claim: string;
  gl?: string;
  hl?: string;
  scenario?: string;
}

export interface StepInfo {
  id: string;
  label: string;
}

export type StreamEvent =
  | { type: 'start'; demo: boolean; steps: StepInfo[] }
  | { type: 'step'; id: string; status: 'running' | 'done' | 'error'; count?: number; message?: string }
  | { type: 'result'; data: TraceResult }
  | { type: 'error'; message: string };
