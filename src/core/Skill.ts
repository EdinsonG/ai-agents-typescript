/**
 * Módulo de conocimiento experto que especializa a un agente
 * para una petición concreta sin duplicar agentes ni prompts.
 */
export interface Skill {
  /** Identificador único, en kebab-case (ej. "pci-dss") */
  readonly id: string;
  /** Nombre legible */
  readonly name: string;
  /** Qué aporta y para qué casos conviene */
  readonly description: string;
  /** Instrucciones expertas que se inyectan al system prompt */
  readonly instructions: string;
}
