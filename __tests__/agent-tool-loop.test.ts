import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Agent } from '@/core/Agent.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import { SkillRegistry } from '@/core/SkillRegistry.js';
import { ToolRegistry } from '@/core/tools.js';
import type { CompletionResult, InferenceClient } from '@/types/index.js';

/**
 * Creates a fake client that returns a sequence of responses.
 * First call returns tool_call JSON, second call returns final text.
 */
function createToolCallThenTextClient(
  toolCallJson: string,
  finalResponse: string,
): InferenceClient {
  let callCount = 0;
  return {
    async complete(): Promise<CompletionResult> {
      callCount++;
      const content = callCount === 1 ? toolCallJson : finalResponse;
      return {
        content,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    },
  };
}

/** Creates a fake client that always returns the same response. */
function createFakeClient(response: string): InferenceClient {
  return {
    async complete(): Promise<CompletionResult> {
      return {
        content: response,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    },
  };
}

class TestAgent extends Agent {
  constructor(
    apiKey: string,
    provider: LLMProvider,
    toolRegistry: ToolRegistry = new ToolRegistry(),
  ) {
    super(
      {
        name: 'Test Agent',
        apiKey,
        systemPrompt: 'You are a test agent.',
      },
      provider,
      new SkillRegistry(),
      toolRegistry,
    );
  }
}

describe('Agent tool calling loop end-to-end', () => {
  it('executes tool when LLM returns tool_call JSON and continues to final response', async () => {
    const toolCallJson = JSON.stringify({
      tool_call: {
        name: 'get_weather',
        arguments: JSON.stringify({ city: 'Madrid' }),
      },
    });

    const client = createToolCallThenTextClient(toolCallJson, 'El clima en Madrid es soleado.');
    const provider = new LLMProvider({ apiKey: 'test', model: 'test', client });

    const registry = new ToolRegistry();
    registry.register({
      name: 'get_weather',
      description: 'Get weather',
      parameters: z.object({ city: z.string() }),
      execute: async (params) => `Sunny in ${params.city}`,
    });

    const agent = new TestAgent('test', provider, registry);
    const result = await agent.execute('¿Qué tiempo hace en Madrid?');

    expect(result).toBe('El clima en Madrid es soleado.');
    // History: system, user, assistant (final response) — tool calls are in builtMessages only
    const history = agent.getHistory();
    expect(history).toHaveLength(3);
    expect(history[0].role).toBe('system');
    expect(history[1].role).toBe('user');
    expect(history[2].role).toBe('assistant');
    expect(history[2].content).toBe('El clima en Madrid es soleado.');
  });

  it('returns text directly when LLM does not return a tool_call', async () => {
    const client = createFakeClient('Respuesta directa del agente.');
    const provider = new LLMProvider({ apiKey: 'test', model: 'test', client });

    const agent = new TestAgent('test', provider);
    const result = await agent.execute('Hola');

    expect(result).toBe('Respuesta directa del agente.');
  });

  it('stops after MAX_TOOL_ROUNDS and returns final response', async () => {
    // Always return tool_call — should exhaust rounds
    const toolCallJson = JSON.stringify({
      tool_call: { name: 'noop', arguments: '{}' },
    });

    let callCount = 0;
    const client: InferenceClient = {
      async complete(): Promise<CompletionResult> {
        callCount++;
        if (callCount <= 5) {
          return {
            content: toolCallJson,
            usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
          };
        }
        return {
          content: 'Final after max rounds',
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        };
      },
    };

    const provider = new LLMProvider({ apiKey: 'test', model: 'test', client });

    const registry = new ToolRegistry();
    registry.register({
      name: 'noop',
      description: 'Noop',
      parameters: z.object({}),
      execute: async () => 'ok',
    });

    const agent = new TestAgent('test', provider, registry);
    const result = await agent.execute('Test');

    expect(result).toBe('Final after max rounds');
    expect(callCount).toBe(6); // 5 tool rounds + 1 final
  });

  it('handles tool execution failure gracefully', async () => {
    const toolCallJson = JSON.stringify({
      tool_call: { name: 'failing_tool', arguments: '{}' },
    });

    const client = createToolCallThenTextClient(toolCallJson, 'Tool failed but I recovered.');
    const provider = new LLMProvider({ apiKey: 'test', model: 'test', client });

    const registry = new ToolRegistry();
    registry.register({
      name: 'failing_tool',
      description: 'Always fails',
      parameters: z.object({}),
      execute: async () => {
        throw new Error('Tool crashed');
      },
    });

    const agent = new TestAgent('test', provider, registry);
    const result = await agent.execute('Use the tool');

    expect(result).toBe('Tool failed but I recovered.');
  });

  it('builds system prompt with tool schemas when tools are registered', () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'search',
      description: 'Search docs',
      parameters: z.object({ query: z.string() }),
      execute: async () => 'results',
    });

    const client = createFakeClient('ok');
    const provider = new LLMProvider({ apiKey: 'test', model: 'test', client });
    const agent = new TestAgent('test', provider, registry);

    const history = agent.getHistory();
    const systemPrompt = history[0].content;
    expect(systemPrompt).toContain('HERRAMIENTAS DISPONIBLES');
    expect(systemPrompt).toContain('search');
  });
});
