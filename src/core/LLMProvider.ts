import Groq from 'groq-sdk';
import { ChatMessage, LLMProviderConfig } from '@/types/index.js';

export class LLMProvider {
  private groq: Groq;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: LLMProviderConfig) {
    this.groq = new Groq({ apiKey: config.apiKey });
    this.model = config.model;
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  /**
   * Envía un historial completo de mensajes a la API de Groq
   */
  public async generateCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await this.groq.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      return response.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
      console.error('[LLMProvider Error]:', error);
      throw new Error(
        `Groq inference failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
