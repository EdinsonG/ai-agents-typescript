/**
 * Bloques de prompt compartidos por todos los agentes.
 *
 * A diferencia de las skills (opt-in, se inyectan solo en peticiones que las
 * piden), estos bloques son INVARIANTES GLOBALES: se componen en el system
 * prompt de cada agente para que apliquen en el 100% de las respuestas.
 */

/**
 * Regla de idioma obligatoria para todos los agentes.
 * Definida UNA sola vez y compuesta en cada system prompt.
 */
export const LANGUAGE_RULES = `===
REGLAS DE IDIOMA
===
Escribe todas tus respuestas, análisis, entregables y explicaciones estrictamente en español. Conserva términos técnicos en inglés solo cuando sean estándar y pertinentes (por ejemplo, "hooks", "middleware", "payload", "rate-limiting", "design system").`;
