import type { Stance } from '../shared/types';

const DISPUTE =
  /\b(fact[- ]?check\w*|false|fake|hoax|debunk\w*|misleading|baseless|rumou?rs?|fabricated|untrue|myth|no evidence|not true|denies|denied|deny|clarif\w+|no plan|no proposal|unverified|misinformation|disinformation|incorrect|wrong|exaggerat\w+|not doubling|no truth)\b/gi;

const SUPPORT =
  /\b(confirms?|confirmed|announces?|announced|approved|notified|launch(?:es|ed)?|officially|issued|orders?|verified|substantiated)\b/gi;

/** Rule based stance of a result toward the claim. Keyword cues only, so it is a hint and not a judgement. */
export function detectStance(text: string): Stance {
  const disputes = (text.match(DISPUTE) ?? []).length;
  const supports = (text.match(SUPPORT) ?? []).length;
  if (disputes > supports) return 'disputes';
  if (supports > disputes) return 'supports';
  return 'neutral';
}
