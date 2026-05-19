import { LLMProvider } from './LLMProvider.js';
import { AgentConfig, ChatMessage } from '@/types/index.js';

export abstract class Agent {
  protected name: string;
  protected systemPrompt: string;
  protected provider: LLMProvider;
  protected chatHistory: ChatMessage[] = [];

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.systemPrompt = config.systemPrompt;

    // Inicializamos el proveedor
    this.provider = new LLMProvider({
      apiKey: config.apiKey,
      model: config.model || 'llama-3.3-70b-versatile',
      temperature: config.temperature ?? 0.2,
    });

    // Añadimos el prompt de sistema inicial a la memoria
    this.chatHistory.push({ role: 'system', content: this.systemPrompt });
  }

  /**
   * Método de ejecución
   */
  public async execute(userInput: string): Promise<string> {
    try {
      this.chatHistory.push({ role: 'user', content: userInput });

      // Consumimos el proveedor abstracto
      const response = await this.provider.generateCompletion(this.chatHistory);

      this.chatHistory.push({ role: 'assistant', content: response });
      return response;
    } catch (error) {
      console.error(`[Agent ${this.name} Error]:`, error);
      throw error;
    }
  }

  public clearMemory(): void {
    this.chatHistory = [{ role: 'system', content: this.systemPrompt }];
  }
}
