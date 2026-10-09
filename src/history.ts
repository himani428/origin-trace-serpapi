import type { TraceResult } from '../shared/types';

const KEY = 'origin-trace-history-v1';
const LIMIT = 12;

export function loadHistory(): TraceResult[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TraceResult[]) : [];
  } catch {
    return [];
  }
}

function persist(items: TraceResult[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage can be full or blocked. History is a convenience, so ignore the failure.
  }
}

export function saveToHistory(result: TraceResult): TraceResult[] {
  const rest = loadHistory().filter((item) => item.claim !== result.claim || item.demo !== result.demo);
  const next = [result, ...rest].slice(0, LIMIT);
  persist(next);
  return next;
}

export function clearHistory(): TraceResult[] {
  persist([]);
  return [];
}
