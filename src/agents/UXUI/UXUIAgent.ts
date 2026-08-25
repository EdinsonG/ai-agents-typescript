import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { mergeSkillOptions } from '@/core/SkillRegistry.js';
import { skillRegistry } from '@/skills/index.js';
import type { AgentInferenceOptions, ExecuteOptions } from '@/types/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { type DesignSpec, DesignSpecSchema } from './schema.js';

/**
 * Skills del estándar obligatorio del agente, inyectadas solo en las
 * peticiones de diseño.
 */
export const DEFAULT_UXUI_SKILLS = ['wcag-forms', 'design-tokens-states'] as const;

export class UXUIAgent extends Agent {
  constructor(
    apiKey: string,
    model = 'llama-3.3-70b-versatile',
    provider?: LLMProvider,
    inference?: AgentInferenceOptions,
  ) {
    super(
      {
        name: 'UX/UI Design Expert',
        systemPrompt: SYSTEM_PROMPT,
        model,
        temperature: 0.3,
        apiKey,
        ...inference,
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

    return this.execute(promptMessage, mergeSkillOptions(options, [...DEFAULT_UXUI_SKILLS]));
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

    return this.executeStructured(
      promptMessage,
      DesignSpecSchema,
      mergeSkillOptions(options, [...DEFAULT_UXUI_SKILLS]),
    );
  }
}
