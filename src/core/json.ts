/**
 * Extrae y parsea un objeto JSON de una respuesta del modelo,
 * tolerando cercos de código (```json ... ```) y texto alrededor.
 */
export function parseJsonLoose(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continúa con la extracción tolerante
  }

  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    // Continúa con la extracción por llaves balanceadas
  }

  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');

  if (start !== -1 && end > start) {
    return JSON.parse(withoutFences.slice(start, end + 1));
  }

  throw new SyntaxError('La respuesta no contiene un objeto JSON válido');
}
