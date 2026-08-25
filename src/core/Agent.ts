import { z } from 'zod';
import type {
  AgentConfig,
  ChatMessage,
  ExecuteOptions,
  JsonSchemaResponseFormat,
} from '@/types/index.js';
import { parseJsonLoose } from './json.js';
import { LLMProvider } from './LLMProvider.js';
import { SkillRegistry } from './SkillRegistry.js';
import { StructuredOutputError } from './structuredOutputError.js';
import { DEFAULT_MAX_CONTEXT_TOKENS, truncateMessages } from './tokens.js';

const MAX_STRUCTURED_ATTEMPTS = 2;

export abstract class Agent {
  protected name: string;
  protected systemPrompt: string;
  protected provider: LLMProvider;
  protected skillRegistry: SkillRegistry;
  protected maxContextTokens: number;
  protected chatHistory: ChatMessage[] = [];

  constructor(
    config: AgentConfig,
    provider?: LLMProvider,
    skillRegistry: SkillRegistry = new SkillRegistry(),
  ) {
    this.name = config.name;
    this.systemPrompt = config.systemPrompt;
    this.maxContextTokens = config.maxContextTokens ?? DEFAULT_MAX_CONTEXT_TOKENS;

    // Inyección del proveedor (DIP): permite sustituirlo o mockearlo en pruebas.
    // El nombre del agente habilita el registro de consumo en el collector global.
    // provider/baseUrl/client permiten apuntar a cualquier modelo de IA.
    this.provider =
      provider ??
      new LLMProvider({
        apiKey: config.apiKey,
        model: config.model || 'llama-3.3-70b-versatile',
        temperature: config.temperature ?? 0.2,
        provider: config.provider,
        baseUrl: config.baseUrl,
        client: config.client,
        agentName: config.name,
      });

    this.skillRegistry = skillRegistry;

    // Añadimos el prompt de sistema inicial a la memoria
    this.chatHistory.push({ role: 'system', content: this.systemPrompt });
  }

  /**
   * Nombre visible del agente
   */
  public get displayName(): string {
    return this.name;
  }

  /**
   * Método de ejecución libre (salida en texto).
   * Las skills indicadas se activan solo para esta petición.
   */
  public async execute(userInput: string, options: ExecuteOptions = {}): Promise<string> {
    try {
      this.chatHistory.push({ role: 'user', content: userInput });

      const messages = this.buildMessages(options.skills);

      // Consumimos el proveedor abstracto
      const response = await this.provider.generateCompletion(messages);

      this.chatHistory.push({ role: 'assistant', content: response });
      return response;
    } catch (error) {
      console.error(`[Agent ${this.name} Error]:`, error);
      throw error;
    }
  }

  /**
   * Ejecución estructurada: fuerza una salida JSON validada contra el esquema.
   * Si la salida no cumple, reintenta una vez inyectando feedback del error.
   */
  public async executeStructured<T>(
    userInput: string,
    schema: z.ZodType<T>,
    options: ExecuteOptions = {},
  ): Promise<T> {
    const responseFormat = this.buildResponseFormat(schema);

    this.chatHistory.push({ role: 'user', content: userInput });

    const messages = this.buildMessages(options.skills);
    let attempt = 0;

    while (attempt < MAX_STRUCTURED_ATTEMPTS) {
      attempt++;
      const raw = await this.provider.generateCompletion(messages, { responseFormat });

      try {
        const parsed = schema.parse(parseJsonLoose(raw));
        this.chatHistory.push({ role: 'assistant', content: raw });
        return parsed;
      } catch (error) {
        if (attempt >= MAX_STRUCTURED_ATTEMPTS) {
          throw new StructuredOutputError(this.name, attempt, raw, error);
        }
        messages.push(
          { role: 'assistant', content: raw },
          { role: 'user', content: buildSchemaFeedback(error) },
        );
      }
    }

    /* Inalcanzable: el bucle lanza o retorna */
    throw new StructuredOutputError(this.name, MAX_STRUCTURED_ATTEMPTS, '');
  }

  public clearMemory(): void {
    this.chatHistory = [{ role: 'system', content: this.systemPrompt }];
  }

  /**
   * Construye los mensajes a enviar: historial + skills activas anexadas al
   * system prompt, recortados al presupuesto de tokens de contexto.
   */
  private buildMessages(skillIds?: readonly string[]): ChatMessage[] {
    const messages = this.chatHistory.map((message) => ({ ...message }));
    const skillsBlock = this.skillRegistry.compose(skillIds);

    if (skillsBlock) {
      const systemIndex = messages.findIndex((message) => message.role === 'system');
      if (systemIndex !== -1) {
        messages[systemIndex] = {
          ...messages[systemIndex],
          content: messages[systemIndex].content + skillsBlock,
        };
      }
    }

    return truncateMessages(messages, this.maxContextTokens);
  }

  private buildResponseFormat<T>(schema: z.ZodType<T>): JsonSchemaResponseFormat {
    const jsonSchema = z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'output' });
    const safeName = this.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      type: 'json_schema',
      json_schema: { name: safeName, schema: jsonSchema as Record<string, unknown> },
    };
  }
}

function buildSchemaFeedback(error: unknown): string {
  const detail =
    error instanceof z.ZodError
      ? error.issues
          .map((issue) => `- ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
          .join('\n')
      : error instanceof Error
        ? error.message
        : String(error);

  return [
    'Tu respuesta anterior NO cumple el esquema JSON solicitado. Problemas detectados:',
    detail,
    'Responde nuevamente con ÚNICAMENTE un objeto JSON válido conforme al esquema. Sin markdown ni explicaciones adicionales.',
  ].join('\n');
}
