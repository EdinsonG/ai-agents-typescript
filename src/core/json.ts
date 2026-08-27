/**
 * Extrae y parsea JSON (objeto o array) de una respuesta del modelo,
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
    // Continúa con la extracción por llaves o corchetes balanceados
  }

  // Buscar objeto JSON ({...}) o array JSON ([...])
  const jsonObjectStart = withoutFences.indexOf('{');
  const jsonObjectEnd = withoutFences.lastIndexOf('}');
  const jsonArrayStart = withoutFences.indexOf('[');
  const jsonArrayEnd = withoutFences.lastIndexOf(']');

  // Elegir el delimitador que aparezca primero en el string
  let start: number;
  let end: number;

  if (jsonObjectStart !== -1 && jsonArrayStart !== -1) {
    if (jsonObjectStart < jsonArrayStart) {
      start = jsonObjectStart;
      end = jsonObjectEnd;
    } else {
      start = jsonArrayStart;
      end = jsonArrayEnd;
    }
  } else if (jsonObjectStart !== -1) {
    start = jsonObjectStart;
    end = jsonObjectEnd;
  } else if (jsonArrayStart !== -1) {
    start = jsonArrayStart;
    end = jsonArrayEnd;
  } else {
    throw new SyntaxError('La respuesta no contiene JSON válido (objeto ni array)');
  }

  if (end > start) {
    return JSON.parse(withoutFences.slice(start, end + 1));
  }

  throw new SyntaxError('La respuesta no contiene JSON válido');
}
