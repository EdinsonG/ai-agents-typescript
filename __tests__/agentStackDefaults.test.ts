import { describe, expect, it } from 'vitest';
import { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import { FrontendAngularAgent } from '@/agents/FrontendAngular/FrontendAngularAgent.js';
import { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import { mergeSkillOptions } from '@/core/SkillRegistry.js';
import { skillRegistry } from '@/skills/index.js';
import type { ChatMessage } from '@/types/index.js';

class CapturingProvider extends LLMProvider {
  public requests: ChatMessage[][] = [];

  constructor() {
    super({ apiKey: 'key', model: 'mock' });
  }

  public override async generateCompletion(messages: ChatMessage[]): Promise<string> {
    this.requests.push(structuredClone(messages));
    return 'RESPUESTA_LIBRE';
  }
}

const AGENTS = [
  {
    name: 'FrontendAngularAgent',
    make: (provider: LLMProvider) => new FrontendAngularAgent('key', 'mock', provider),
    defaults: ['angular-standalone-modern', 'angular-signals', 'angular-typed-forms'],
    freeMethod: 'implementFeature' as const,
    input: 'tabla de usuarios',
  },
  {
    name: 'BackendNodeAgent',
    make: (provider: LLMProvider) => new BackendNodeAgent('key', 'mock', provider),
    defaults: ['hexagonal-nestjs', 'owasp-api-top10', 'api-errors-resilience'],
    freeMethod: 'designApi' as const,
    input: 'API de suscripciones',
  },
  {
    name: 'UXUIAgent',
    make: (provider: LLMProvider) => new UXUIAgent('key', 'mock', provider),
    defaults: ['wcag-forms', 'design-tokens-states'],
    freeMethod: 'designSolution' as const,
    input: 'checkout en 3 pasos',
  },
] as const;

describe.each(AGENTS)('$name: skills por defecto', ({ make, defaults, freeMethod, input }) => {
  it('sus skills por defecto existen en el registro global compartido', () => {
    expect(() => skillRegistry.resolve(defaults)).not.toThrow();
  });

  it(`${freeMethod} inyecta automáticamente las skills del stack`, async () => {
    const provider = new CapturingProvider();
    const agent = make(provider);

    await agent[freeMethod](input);

    const system = provider.requests[0][0].content;
    expect(system).toContain('SKILL ACTIVA');
    for (const id of defaults) {
      expect(system).toContain(`(${id})`);
    }
    expect(provider.requests).toHaveLength(1);
  });

  it('execute directo NO inyecta las skills salvo petición explícita', async () => {
    const provider = new CapturingProvider();
    const agent = make(provider);

    await agent.execute('pregunta conceptual');

    expect(provider.requests[0][0].content).not.toContain('SKILL ACTIVA');
  });
});

describe('mergeSkillOptions', () => {
  it('combina defaults con skills del usuario sin duplicados y con prioridad de orden', () => {
    const merged = mergeSkillOptions({ skills: ['pci-dss', 'owasp-api-top10'] }, [
      'owasp-api-top10',
      'api-errors-resilience',
    ]);

    expect(merged.skills).toEqual(['pci-dss', 'owasp-api-top10', 'api-errors-resilience']);
  });

  it('con solo defaults las incluye todas', () => {
    const merged = mergeSkillOptions({}, ['a', 'b']);
    expect(merged.skills).toEqual(['a', 'b']);
  });

  it('no muta las opciones originales', () => {
    const original: { skills?: string[] } = { skills: ['x'] };
    void mergeSkillOptions(original, ['y']);
    expect(original.skills).toEqual(['x']);
  });
});
