import { describe, expect, it } from 'vitest';
import {
  AGENT_IDS,
  BackendNodeAgent,
  createAgent,
  FrontendAngularAgent,
  FrontendReactAgent,
  TechnicalPOAgent,
  UXUIAgent,
} from '@/agents/index.js';
import { createCapturingProvider } from './mocks/mockProvider.js';

const CASES = [
  {
    name: 'TechnicalPOAgent',
    factory: (provider: any) => new TechnicalPOAgent('key', 'model', provider),
    method: 'generateUserStory' as const,
    promptKeyword: 'Product Owner',
  },
  {
    name: 'FrontendReactAgent',
    factory: (provider: any) => new FrontendReactAgent('key', 'model', provider),
    method: 'implementFeature' as const,
    promptKeyword: 'React 19',
  },
  {
    name: 'FrontendAngularAgent',
    factory: (provider: any) => new FrontendAngularAgent('key', 'model', provider),
    method: 'implementFeature' as const,
    promptKeyword: 'Angular 19',
  },
  {
    name: 'BackendNodeAgent',
    factory: (provider: any) => new BackendNodeAgent('key', 'model', provider),
    method: 'designApi' as const,
    promptKeyword: 'NestJS',
  },
  {
    name: 'UXUIAgent',
    factory: (provider: any) => new UXUIAgent('key', 'model', provider),
    method: 'designSolution' as const,
    promptKeyword: 'WCAG',
  },
];

describe.each(CASES)('$name', ({ factory, method, promptKeyword }) => {
  it('delega en el proveedor con system + user y registra la respuesta en memoria', async () => {
    const { provider, requests } = createCapturingProvider({ fixedResponse: 'RESPUESTA_MOCK' });
    const agent = factory(provider);

    const result = await agent[method]('requerimiento de prueba');

    expect(result).toBe('RESPUESTA_MOCK');
    expect(requests).toHaveLength(1);

    const messages = requests[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain(promptKeyword);
    expect(messages.at(-1)?.role).toBe('user');
    expect(messages.at(-1)?.content).toContain('requerimiento de prueba');

    const history = agent['chatHistory'];
    expect(history.at(-1)).toEqual({ role: 'assistant', content: 'RESPUESTA_MOCK' });
  });

  it('lanza error si la entrada está vacía', async () => {
    const { provider, requests } = createCapturingProvider({ fixedResponse: 'no debe llamarse' });
    const agent = factory(provider);

    await expect(agent[method]('   ')).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });

  it('clearMemory reinicia el historial al prompt de sistema', async () => {
    const { provider } = createCapturingProvider({ fixedResponse: 'ok' });
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
