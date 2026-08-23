/**
 * Devuelve true si el texto contiene alguna de las agujas (case-insensitive).
 */
export function containsAny(haystack: string, needles: string[]): boolean {
  const normalized = haystack.toLowerCase();
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}
