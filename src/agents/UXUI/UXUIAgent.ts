import { Agent } from '@/core/Agent.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import { ExecuteOptions } from '@/types/index.js';
import { skillRegistry } from '@/skills/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { DesignSpec, DesignSpecSchema } from './schema.js';

export class UXUIAgent extends Agent {
  constructor(apiKey: string, model = 'llama-3.3-70b-versatile', provider?: LLMProvider) {
    super(
      {
        name: 'UX/UI Design Expert',
        systemPrompt: SYSTEM_PROMPT,
        model,
        temperature: 0.3,
        apiKey,
      },
      provider,
      skillRegistry,
    );
  }

  public async designSolution(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<string> {
    const description = requirementDescription.trim();
    if (!description) {
      throw new Error('requirementDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Diseña la solución UX/UI completa para el siguiente requerimiento, lista para entregar al equipo de desarrollo:',
      description,
    ].join('\n\n');

    return this.execute(promptMessage, options);
  }

  /**
   * Genera la especificación de diseño como dato estructurado y validado.
   */
  public async designSolutionStructured(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<DesignSpec> {
    const description = requirementDescription.trim();
    if (!description) {
      throw new Error('requirementDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Diseña la solución UX/UI completa para el siguiente requerimiento, lista para entregar al equipo de desarrollo:',
      description,
    ].join('\n\n');

    return this.executeStructured(promptMessage, DesignSpecSchema, options);
  }
}
