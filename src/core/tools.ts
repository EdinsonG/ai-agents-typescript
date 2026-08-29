import { z } from 'zod';
import type { Tool, ToolContext, ToolCallResult } from '@/types/index.js';

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
 * Converts a Zod schema to a simplified JSON Schema description.
 */
function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const def = (schema as any)._def;

  // Zod v4: _def.type is the type name, _def.shape is an object (not a function)
  if (def.type === 'object' || def.typeName === 'ZodObject') {
    const shapeObj = typeof def.shape === 'function' ? def.shape() : def.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shapeObj as Record<string, z.ZodType>)) {
      const fieldDef = (value as any)._def;

      properties[key] = {
        type: fieldDef.type === 'string' || fieldDef.typeName === 'ZodString' ? 'string' : 'unknown',
        description: fieldDef.description,
      };

      if (!value.isOptional()) {
        required.push(key);
      }
    }

    return { type: 'object', properties, required };
  }

  return { type: 'object' };
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
      error: `Tool "${toolCall.name}" not found. Available: ${registry.getAll().map((t) => t.name).join(', ')}`,
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
