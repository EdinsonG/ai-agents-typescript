import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REACT_STACK_SKILLS,
  FrontendReactAgent,
} from '@/agents/FrontendReact/FrontendReactAgent.js';
import { SYSTEM_PROMPT } from '@/agents/FrontendReact/prompt.js';
import {
  type FrontendImplementationPlan,
  ImplementationPlanSchema,
} from '@/agents/FrontendReact/schema.js';
import { skillRegistry } from '@/skills/index.js';
import { createCapturingProvider } from './mocks/mockProvider.js';

function validPlan(): FrontendImplementationPlan {
  return {
    analysis: ['requiere formularios', 'múltiples idiomas'],
    components: [{ name: 'CheckoutForm', kind: 'client', responsibility: 'formulario' }],
    folderStructure: 'src/features/checkout',
    stateAndDataStrategy: {
      stateDecision: 'zustand',
      persistenceDetails: 'persist en localStorage para borrador del formulario',
      justification: 'borrador persistente sin servidor',
    },
    formHandling: {
      hasForms: true,
      strategy: 'react-hook-form + zodResolver',
      schemaLocation: 'src/features/checkout/schema.ts',
    },
    i18nStrategy: {
      multilingual: true,
      localeDetection: 'cookie',
      details: 'next-intl leyendo NEXT_LOCALE vía next/headers',
    },
    serverCookiesUsage: 'await cookies() en Server Action para fijar NEXT_LOCALE',
    performanceNotes: ['server component para resumen', 'useTransition en filtros'],
    accessibilityNotes: ['labels asociados', 'aria-invalid en errores'],
    animationNotes: 'transiciones sutiles con reduced motion',
    tasks: [
      { area: 'components', description: 'CheckoutForm' },
      { area: 'data', description: 'server action submit' },
      { area: 'styles-animation', description: 'estados con Tailwind' },
      { area: 'testing', description: 'vitest + RTL' },
    ],
    storyPoints: 3,
    risks: ['negociación inicial de locale'],
  };
}

describe('FrontendReactAgent: stack como skills centralizadas', () => {
  it('el system prompt es un puntero ligero: ids de skills sin el detalle pesado', () => {
    expect(SYSTEM_PROMPT).toContain('react-hook-form-zod');
    expect(SYSTEM_PROMPT).toContain('zustand-persist');
    expect(SYSTEM_PROMPT).toContain('next-intl-cookie');
    expect(SYSTEM_PROMPT).toContain('next-server-cookies');
    expect(SYSTEM_PROMPT).toContain('App Router');

    expect(SYSTEM_PROMPT).not.toContain('zodResolver');
    expect(SYSTEM_PROMPT).not.toContain('NEXT_LOCALE');
    expect(SYSTEM_PROMPT.length).toBeLessThan(6000);
  });

  it('las 4 skills del stack existen en el registro global compartido', () => {
    const resolved = skillRegistry.resolve(DEFAULT_REACT_STACK_SKILLS);

    expect(resolved).toHaveLength(4);
    const allInstructions = resolved.map((skill) => skill.instructions).join('\n');
    expect(allInstructions).toContain('zodResolver');
    expect(allInstructions).toContain('persist');
    expect(allInstructions).toContain('NEXT_LOCALE');
    expect(allInstructions).toContain('next/headers');
    expect(allInstructions).toMatch(/NUNCA navegación a una ruta duplicada/);
  });

  it('implementFeatureStructured inyecta el stack automáticamente junto a skills extra sin duplicados', async () => {
    const result = createCapturingProvider({
      captureSystemAndUser: true,
      fixedResponse: JSON.stringify(validPlan()),
    });
    const agent = new FrontendReactAgent('key', 'mock', result.provider);

    await agent.implementFeatureStructured('checkout', {
      skills: ['core-web-vitals', 'zustand-persist'],
    });

    expect(result.lastSystemMessage).toContain('SKILL ACTIVA');
    expect(result.lastSystemMessage).toContain('(zustand-persist)');
    expect(result.lastSystemMessage).toContain('(core-web-vitals)');
    expect(result.lastSystemMessage!.match(/SKILL ACTIVA/g)).toHaveLength(5);

    const history = agent['chatHistory'];
    expect(history[0].content).not.toContain('SKILL ACTIVA');
  });

  it('execute directo NO activa el stack salvo petición explícita', async () => {
    const result = createCapturingProvider({ captureSystemAndUser: true });
    const agent = new FrontendReactAgent('key', 'mock', result.provider);

    await agent.execute('¿Qué es un Server Component?');

    expect(result.lastSystemMessage).not.toContain('SKILL ACTIVA');
  });
});

describe('FrontendReactAgent: esquema con decisiones de stack', () => {
  it('valida un plan que usa el stack por defecto (zustand, cookie, RHF+zod)', () => {
    const parsed = ImplementationPlanSchema.parse(validPlan());
    expect(parsed.stateAndDataStrategy.stateDecision).toBe('zustand');
    expect(parsed.i18nStrategy.localeDetection).toBe('cookie');
    expect(parsed.formHandling.strategy).toContain('zodResolver');
  });

  it('rechaza planes sin las nuevas decisiones de stack', () => {
    const incomplete = {
      ...validPlan(),
      formHandling: undefined,
      i18nStrategy: undefined,
      serverCookiesUsage: undefined,
    };

    expect(() => ImplementationPlanSchema.parse(incomplete)).toThrow();
  });
});
