import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { skillRegistry } from '@/skills/index.js';
import type { ExecuteOptions } from '@/types/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { type ApiDesign, ApiDesignSchema } from './schema.js';

export class BackendNodeAgent extends Agent {
  constructor(apiKey: string, model = 'llama-3.3-70b-versatile', provider?: LLMProvider) {
    super(
      {
        name: 'Backend Node Expert',
        systemPrompt: SYSTEM_PROMPT,
        model,
        temperature: 0.2,
        apiKey,
      },
      provider,
      skillRegistry,
    );
  }

  public async designApi(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<string> {
    return this.execute(this.buildApiPrompt(requirementDescription), options);
  }

  /**
   * Genera el diseño de API como dato estructurado y validado.
   */
  public async designApiStructured(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<ApiDesign> {
    return this.executeStructured(
      this.buildApiPrompt(requirementDescription),
      ApiDesignSchema,
      options,
    );
  }

  public async reviewCode(code: string): Promise<string> {
    return this.execute(this.buildReviewPrompt(code));
  }

  private buildApiPrompt(requirementDescription: string): string {
    const description = requirementDescription.trim();
    if (!description) {
      throw new Error('requirementDescription no puede estar vacío');
    }

    this.clearMemory();

    return [
      'Diseña la API, la arquitectura y la implementación backend para el siguiente requerimiento:',
      description,
    ].join('\n\n');
  }

  private buildReviewPrompt(code: string): string {
    const sourceCode = code.trim();
    if (!sourceCode) {
      throw new Error('code no puede estar vacío');
    }

    this.clearMemory();

    return [
      'Realiza una revisión de código experta del siguiente código backend Node.js/TypeScript.',
      'Evalúa: validación de entradas, seguridad (OWASP), manejo de errores tipados, arquitectura (separación de capas), rendimiento (N+1, índices, caché) y testing.',
      'Responde con: problemas detectados ordenados por severidad (crítico/mayor/menor), fragmento corregido de cada problema crítico o mayor, y veredicto final.',
      'Código a revisar:',
      sourceCode,
    ].join('\n\n');
  }
}
