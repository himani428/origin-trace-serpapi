import type { Evidence, TraceResult } from '../shared/types';
import { KIND_META, STANCE_META } from './meta';

export function formatDate(iso: string | null, fallback: string | null = null): string {
  if (!iso) return fallback ?? 'No date';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback ?? 'No date';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function originOf(result: TraceResult): Evidence | null {
  return result.evidence.find((e) => e.id === result.summary.originId) ?? null;
}

export function buildReport(result: TraceResult): string {
  const origin = originOf(result);
  const lines: string[] = [];

  lines.push('# Claim trace report');
  lines.push('');
  lines.push(`Claim: ${result.claim}`);
  lines.push(`Generated: ${new Date(result.fetchedAt).toLocaleString('en-IN')}`);
  lines.push(`Region and language: ${result.region.gl.toUpperCase()}, ${result.region.hl}`);
  if (result.demo) lines.push('Data: bundled sample data (demo mode)');
  lines.push('');
  lines.push('## Result');
  lines.push(`Finding: ${result.verdict.label}. ${result.verdict.detail}`);
  lines.push(`Verification coverage: ${result.score} of 100`);
  lines.push(`Origin candidate: ${origin ? `${origin.outlet}, ${formatDate(origin.publishedAt, origin.dateLabel)}` : 'not found'}`);
  lines.push(`Outlets reporting: ${result.summary.independentOutlets}`);
  lines.push(`Official sources: ${result.summary.primarySources}`);
  lines.push(`Fact checks: ${result.summary.factChecks}`);
  lines.push(`Scholarly sources: ${result.summary.scholarlySources}`);
  lines.push(`Time span: ${result.summary.spanDays === null ? 'unknown' : `${result.summary.spanDays} days`}`);
  lines.push('');
  lines.push('## Score breakdown');
  for (const factor of result.scoreFactors) {
    lines.push(`- ${factor.label}: ${factor.points} of ${factor.max}. ${factor.note}`);
  }
  lines.push('');
  lines.push('## Signals');
  for (const signal of result.signals) lines.push(`- ${signal.text}`);
  lines.push('');
  lines.push('## Timeline');
  for (const e of result.evidence) {
    lines.push(
      `- ${formatDate(e.publishedAt, e.dateLabel)} | ${KIND_META[e.kind].label} | ${STANCE_META[e.stance].short} | ${e.outlet} | ${e.title} | ${e.url}`
    );
  }
  lines.push('');
  lines.push(
    'Origin candidates, stance labels, and the coverage score are heuristics based on the search results retrieved. They are not proof of authorship or of truth.'
  );
  return lines.join('\n');
}

/** Short plain text summary sized for a chat reply. */
export function buildShareText(result: TraceResult): string {
  const origin = originOf(result);
  const authoritative = result.evidence
    .filter((e) => e.kind === 'primary' || e.kind === 'factcheck')
    .slice(0, 3);

  const lines = [
    `Claim checked: ${result.claim}`,
    `Finding: ${result.verdict.label}`,
    origin ? `Earliest match: ${origin.outlet}, ${formatDate(origin.publishedAt, origin.dateLabel)}` : 'Earliest match: not found',
    `Outlets reporting: ${result.summary.independentOutlets}. Official sources: ${result.summary.primarySources}. Fact checks: ${result.summary.factChecks}.`
  ];
  if (authoritative.length > 0) {
    lines.push('', 'Read these first:');
    authoritative.forEach((e, index) => lines.push(`${index + 1}. ${e.title} ${e.url}`));
  }
  lines.push('', 'Traced with Origin Trace using live SerpApi search data. Results are a guide, so open the sources.');
  return lines.join('\n');
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'claim';
}
