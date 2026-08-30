import { describe, expect, it } from 'vitest';
import { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import { QAExpertAgent } from '@/agents/QAExpert/QAExpertAgent.js';
import { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { mergeSkillOptions } from '@/core/SkillRegistry.js';
import { skillRegistry } from '@/skills/index.js';
import { createCapturingProvider } from './mocks/mockProvider.js';

const AGENTS = [
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
  {
    name: 'QAExpertAgent',
    make: (provider: LLMProvider) => new QAExpertAgent('key', 'mock', provider),
    defaults: ['testing-strategies', 'owasp-testing-guide', 'api-contract-testing'],
    freeMethod: 'createTestPlan' as const,
    input: 'API de pagos con Stripe',
  },
] as const;

describe.each(AGENTS)('$name: skills por defecto', ({ make, defaults, freeMethod, input }) => {
  it('sus skills por defecto existen en el registro global compartido', () => {
    expect(() => skillRegistry.resolve(defaults)).not.toThrow();
  });

  it(`${freeMethod} inyecta automáticamente las skills del stack`, async () => {
    const { provider, requests } = createCapturingProvider();
    const agent = make(provider);

    await agent[freeMethod](input);

    const system = requests[0][0].content;
    expect(system).toContain('SKILL ACTIVA');
    for (const id of defaults) {
      expect(system).toContain(`(${id})`);
    }
    expect(requests).toHaveLength(1);
  });

  it('execute directo NO inyecta las skills salvo petición explícita', async () => {
    const { provider, requests } = createCapturingProvider();
    const agent = make(provider);

    await agent.execute('pregunta conceptual');

    expect(requests[0][0].content).not.toContain('SKILL ACTIVA');
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
