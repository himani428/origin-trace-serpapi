const UNIT_MS: Record<string, number> = {
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
  year: 31_536_000_000
};

function isValid(date: Date, now: Date): boolean {
  const t = date.getTime();
  return !Number.isNaN(t) && date.getUTCFullYear() >= 1990 && t <= now.getTime() + 86_400_000;
}

/**
 * Reads a publication date from the values SerpApi returns.
 * Handles ISO strings, relative text such as "3 days ago", and absolute dates.
 */
export function parsePublishedAt(
  raw?: string | null,
  iso?: string | null,
  now: Date = new Date()
): Date | null {
  if (iso) {
    const fromIso = new Date(iso);
    if (isValid(fromIso, now)) return fromIso;
  }
  if (!raw) return null;

  const text = raw.trim();

  const relative = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    return new Date(now.getTime() - amount * UNIT_MS[unit]);
  }

  if (/^yesterday$/i.test(text)) return new Date(now.getTime() - UNIT_MS.day);

  const cleaned = text.replace(/,?\s*[+-]\d{4}\s*UTC$/i, '');
  const absolute = new Date(cleaned);
  if (isValid(absolute, now)) return absolute;

  return null;
}
