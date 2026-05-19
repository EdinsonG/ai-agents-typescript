import { Agent } from '@/core/Agent.js';
import { SYSTEM_PROMPT } from './prompt.js';

export class TechnicalPOAgent extends Agent {
  constructor(apiKey: string) {
    super({
      name: 'Technical Product Owner',
      systemPrompt: SYSTEM_PROMPT,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      apiKey: apiKey,
    });
  }

  public async generateUserStory(featureDescription: string): Promise<string> {
    const promptMessage = `Por favor define las historias de usuario y las especificaciones técnicas para la siguiente solicitud de funcionalidad: "${featureDescription}"`;
    return await this.execute(promptMessage);
  }
}
