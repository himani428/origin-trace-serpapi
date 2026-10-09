import type { SourceKind, Stance, VerdictTone } from '../shared/types';

export const KIND_ORDER: SourceKind[] = ['primary', 'factcheck', 'news', 'web', 'scholar'];

export const KIND_META: Record<SourceKind, { label: string; plural: string; color: string }> = {
  primary: { label: 'Official', plural: 'Official sources', color: 'verify' },
  factcheck: { label: 'Fact check', plural: 'Fact checks', color: 'check' },
  news: { label: 'News', plural: 'News reports', color: 'press' },
  web: { label: 'Web', plural: 'Web pages', color: 'web' },
  scholar: { label: 'Scholarly', plural: 'Scholarly sources', color: 'scholar' }
};

export const STANCE_META: Record<Stance, { label: string; short: string; color: string }> = {
  supports: { label: 'Repeats or backs the claim', short: 'Backs', color: 'green' },
  disputes: { label: 'Disputes the claim', short: 'Disputes', color: 'red' },
  neutral: { label: 'No clear position', short: 'Neutral', color: 'gray' }
};

export const TONE_META: Record<VerdictTone, { color: string }> = {
  disputed: { color: 'red' },
  supported: { color: 'green' },
  unclear: { color: 'blue' },
  unverified: { color: 'orange' }
};

/** Coverage is not approval, so the score uses one neutral colour at every level. */
export function scoreColor(_score: number): string {
  return 'press';
}

export const REGION_OPTIONS = [
  { value: 'in', label: 'India' },
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' }
];

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' }
];

export const LIVE_EXAMPLES = [
  { title: 'A government scheme', claim: 'Government will make Aadhaar mandatory for train tickets', blurb: 'Policy claims often spread before any notice exists. Check for an official page.' },
  { title: 'A forwarded promise', claim: 'Free laptops are being distributed to all students this year', blurb: 'A classic forward. See which outlets repeated it and whether the ministry replied.' },
  { title: 'A study headline', claim: 'New study says coffee adds ten years to your life', blurb: 'Compare the headline with scholarly sources and fact checkers.' }
];
