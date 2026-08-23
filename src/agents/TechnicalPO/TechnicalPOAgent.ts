import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { skillRegistry } from '@/skills/index.js';
import type { ExecuteOptions } from '@/types/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { type UserStoryDeliverable, UserStoryDeliverableSchema } from './schema.js';

export class TechnicalPOAgent extends Agent {
  constructor(apiKey: string, model = 'llama-3.3-70b-versatile', provider?: LLMProvider) {
    super(
      {
        name: 'Technical Product Owner',
        systemPrompt: SYSTEM_PROMPT,
        model,
        temperature: 0.1,
        apiKey,
      },
      provider,
      skillRegistry,
    );
  }

  public async generateUserStory(
    featureDescription: string,
    options: ExecuteOptions = {},
  ): Promise<string> {
    return this.execute(this.buildUserStoryPrompt(featureDescription), options);
  }

  /**
   * Genera el entregable ágil como dato estructurado y validado (no texto libre).
   */
  public async generateUserStoryStructured(
    featureDescription: string,
    options: ExecuteOptions = {},
  ): Promise<UserStoryDeliverable> {
    return this.executeStructured(
      this.buildUserStoryPrompt(featureDescription),
      UserStoryDeliverableSchema,
      options,
    );
  }

  private buildUserStoryPrompt(featureDescription: string): string {
    const description = featureDescription.trim();
    if (!description) {
      throw new Error('featureDescription no puede estar vacío');
    }

    this.clearMemory();

    return [
      'Por favor define las historias de usuario y las especificaciones técnicas para la siguiente solicitud de funcionalidad:',
      description,
    ].join('\n\n');
  }
}
