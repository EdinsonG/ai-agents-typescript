import { Agent } from '@/core/Agent.js';
import { SYSTEM_PROMPT } from './prompt.js';

export class TechnicalPOAgent extends Agent {
  constructor(apiKey: string, model = 'llama-3.3-70b-versatile') {
    super({
      name: 'Technical Product Owner',
      systemPrompt: SYSTEM_PROMPT,
      model,
      temperature: 0.1,
      apiKey,
    });
  }

  public async generateUserStory(featureDescription: string): Promise<string> {
    const description = featureDescription.trim();
    if (!description) {
      throw new Error('featureDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Por favor define las historias de usuario y las especificaciones técnicas para la siguiente solicitud de funcionalidad:',
      description,
    ].join('\n\n');

    return this.execute(promptMessage);
  }
}
