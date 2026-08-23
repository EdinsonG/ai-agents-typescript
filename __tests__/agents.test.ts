import { describe, expect, it } from 'vitest';
import { LLMProvider } from '@/core/LLMProvider.js';
import type { ChatMessage } from '@/types/index.js';
import {
  AGENT_IDS,
  BackendNodeAgent,
  FrontendAngularAgent,
  FrontendReactAgent,
  TechnicalPOAgent,
  UXUIAgent,
  createAgent,
} from '@/agents/index.js';

class MockProvider extends LLMProvider {
  public calls: ChatMessage[][] = [];

  constructor(private readonly cannedResponse: string) {
    super({ apiKey: 'test-key', model: 'mock-model' });
  }

  public async generateCompletion(messages: ChatMessage[]): Promise<string> {
    this.calls.push(structuredClone(messages));
    return this.cannedResponse;
  }
}

const CASES = [
  {
    name: 'TechnicalPOAgent',
    factory: (provider: MockProvider) => new TechnicalPOAgent('key', 'model', provider),
    method: 'generateUserStory' as const,
    promptKeyword: 'Product Owner',
  },
  {
    name: 'FrontendReactAgent',
    factory: (provider: MockProvider) => new FrontendReactAgent('key', 'model', provider),
    method: 'implementFeature' as const,
    promptKeyword: 'React 19',
  },
  {
    name: 'FrontendAngularAgent',
    factory: (provider: MockProvider) => new FrontendAngularAgent('key', 'model', provider),
    method: 'implementFeature' as const,
    promptKeyword: 'Angular 19',
  },
  {
    name: 'BackendNodeAgent',
    factory: (provider: MockProvider) => new BackendNodeAgent('key', 'model', provider),
    method: 'designApi' as const,
    promptKeyword: 'NestJS',
  },
  {
    name: 'UXUIAgent',
    factory: (provider: MockProvider) => new UXUIAgent('key', 'model', provider),
    method: 'designSolution' as const,
    promptKeyword: 'WCAG',
  },
];

describe.each(CASES)('$name', ({ factory, method, promptKeyword }) => {
  it('delega en el proveedor con system + user y registra la respuesta en memoria', async () => {
    const provider = new MockProvider('RESPUESTA_MOCK');
    const agent = factory(provider);

    const result = await agent[method]('requerimiento de prueba');

    expect(result).toBe('RESPUESTA_MOCK');
    expect(provider.calls).toHaveLength(1);

    const messages = provider.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain(promptKeyword);
    expect(messages.at(-1)?.role).toBe('user');
    expect(messages.at(-1)?.content).toContain('requerimiento de prueba');

    const history = agent['chatHistory'];
    expect(history.at(-1)).toEqual({ role: 'assistant', content: 'RESPUESTA_MOCK' });
  });

  it('lanza error si la entrada está vacía', async () => {
    const provider = new MockProvider('no debe llamarse');
    const agent = factory(provider);

    await expect(agent[method]('   ')).rejects.toThrow();
    expect(provider.calls).toHaveLength(0);
  });

  it('clearMemory reinicia el historial al prompt de sistema', async () => {
    const provider = new MockProvider('ok');
    const agent = factory(provider);

    await agent[method]('algo');

    agent.clearMemory();

    const history = agent['chatHistory'];
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('system');
  });
});

describe('createAgent', () => {
  it('crea el agente correcto para cada id', () => {
    expect(createAgent('po', 'key')).toBeInstanceOf(TechnicalPOAgent);
    expect(createAgent('react', 'key')).toBeInstanceOf(FrontendReactAgent);
    expect(createAgent('angular', 'key')).toBeInstanceOf(FrontendAngularAgent);
    expect(createAgent('backend', 'key')).toBeInstanceOf(BackendNodeAgent);
    expect(createAgent('uxui', 'key')).toBeInstanceOf(UXUIAgent);
  });

  it('expone ids estables de agentes', () => {
    expect(AGENT_IDS).toEqual(['po', 'react', 'angular', 'backend', 'uxui']);
  });
});
