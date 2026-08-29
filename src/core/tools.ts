import { z } from 'zod';
import type { Tool, ToolCallResult, ToolContext } from '@/types/index.js';

/**
 * Registry of available tools for an agent.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return [...this.tools.values()];
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Builds a JSON schema description of all tools for the LLM.
   */
  buildToolSchemas(): string {
    const tools = this.getAll();
    if (tools.length === 0) return '';

    const schemas = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters),
    }));

    return JSON.stringify(schemas, null, 2);
  }
}

/**
 * Converts a Zod schema to JSON Schema using Zod v4's built-in converter.
 */
function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' }) as Record<
    string,
    unknown
  >;
}

/**
 * Executes a tool call from the LLM response.
 */
export async function executeToolCall(
  toolCall: { name: string; arguments: string },
  registry: ToolRegistry,
  context: ToolContext,
): Promise<ToolCallResult> {
  const tool = registry.get(toolCall.name);

  if (!tool) {
    return {
      toolName: toolCall.name,
      params: {},
      result: '',
      success: false,
      error: `Tool "${toolCall.name}" not found. Available: ${registry
        .getAll()
        .map((t) => t.name)
        .join(', ')}`,
    };
  }

  try {
    const params = JSON.parse(toolCall.arguments);
    const validated = tool.parameters.parse(params);
    const result = await tool.execute(validated, context);

    return {
      toolName: toolCall.name,
      params,
      result,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      toolName: toolCall.name,
      params: {},
      result: '',
      success: false,
      error: message,
    };
  }
}
