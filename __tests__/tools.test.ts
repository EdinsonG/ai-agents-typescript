import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ToolRegistry, executeToolCall } from '@/core/tools.js';
import type { Tool } from '@/core/tools.js';

describe('ToolRegistry', () => {
  it('registers and retrieves a tool', () => {
    const registry = new ToolRegistry();
    const tool: Tool<{ city: string }> = {
      name: 'get_weather',
      description: 'Get weather for a city',
      parameters: z.object({ city: z.string() }),
      execute: async (params) => `Weather in ${params.city}: sunny`,
    };

    registry.register(tool);

    expect(registry.has('get_weather')).toBe(true);
    expect(registry.get('get_weather')).toBe(tool);
    expect(registry.getAll()).toHaveLength(1);
  });

  it('throws when registering duplicate tool', () => {
    const registry = new ToolRegistry();
    const tool: Tool = {
      name: 'dup',
      description: 'dup',
      parameters: z.object({}),
      execute: async () => 'ok',
    };

    registry.register(tool);
    expect(() => registry.register(tool)).toThrow('already registered');
  });

  it('builds JSON schema for registered tools', () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'search',
      description: 'Search something',
      parameters: z.object({ query: z.string() }),
      execute: async () => 'results',
    });

    const schema = registry.buildToolSchemas();
    const parsed = JSON.parse(schema);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('search');
    expect(parsed[0].description).toBe('Search something');
    expect(parsed[0].parameters.type).toBe('object');
    expect(parsed[0].parameters.properties.query.type).toBe('string');
  });

  it('returns empty string when no tools registered', () => {
    const registry = new ToolRegistry();
    expect(registry.buildToolSchemas()).toBe('');
  });
});

describe('executeToolCall', () => {
  it('executes a registered tool successfully', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'echo',
      description: 'Echo input',
      parameters: z.object({ message: z.string() }),
      execute: async (params) => `Echo: ${params.message}`,
    });

    const result = await executeToolCall(
      { name: 'echo', arguments: JSON.stringify({ message: 'hello' }) },
      registry,
      { agentName: 'test', userInput: 'test', history: [] },
    );

    expect(result.success).toBe(true);
    expect(result.result).toBe('Echo: hello');
    expect(result.toolName).toBe('echo');
  });

  it('returns error for unknown tool', async () => {
    const registry = new ToolRegistry();

    const result = await executeToolCall(
      { name: 'unknown', arguments: '{}' },
      registry,
      { agentName: 'test', userInput: 'test', history: [] },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error on invalid JSON arguments', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'noop',
      description: 'Noop',
      parameters: z.object({}),
      execute: async () => 'ok',
    });

    const result = await executeToolCall(
      { name: 'noop', arguments: 'not-json' },
      registry,
      { agentName: 'test', userInput: 'test', history: [] },
    );

    expect(result.success).toBe(false);
  });

  it('returns error on schema validation failure', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'required_field',
      description: 'Needs name',
      parameters: z.object({ name: z.string() }),
      execute: async () => 'ok',
    });

    const result = await executeToolCall(
      { name: 'required_field', arguments: '{}' },
      registry,
      { agentName: 'test', userInput: 'test', history: [] },
    );

    expect(result.success).toBe(false);
  });

  it('returns error when tool execution throws', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'fail',
      description: 'Always fails',
      parameters: z.object({}),
      execute: async () => {
        throw new Error('boom');
      },
    });

    const result = await executeToolCall(
      { name: 'fail', arguments: '{}' },
      registry,
      { agentName: 'test', userInput: 'test', history: [] },
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('boom');
  });
});
