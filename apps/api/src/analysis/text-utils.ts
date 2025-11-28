const SMALL_WORDS = new Set(['and', 'with', 'of', 'in', 'on', 'the', '&', 'a', 'an', 'at', 'for']);

/**
 * Normalize food name: remove ALL CAPS, trim, title case, limit words
 */
export function normalizeFoodName(raw: string, maxWords = 6): string {
  if (!raw) return '';

  let value = raw.trim();
  const isAllCaps = value === value.toUpperCase() && value.length > 1;

  // Convert ALL CAPS to lowercase
  if (isAllCaps) {
    value = value.toLowerCase();
  }

  // Clean up: remove extra spaces, parentheses
  value = value
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .trim();

  // Split and limit words
  const words = value.split(' ').slice(0, maxWords);

  // Title case: capitalize first letter, keep small words lowercase (except first word)
  const titled = words
    .map((w, idx) => {
      const lw = w.toLowerCase();
      if (idx > 0 && SMALL_WORDS.has(lw)) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(' ');

  return titled;
}

