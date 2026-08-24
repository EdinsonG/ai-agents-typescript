import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT } from '@/agents/FrontendReact/prompt.js';
import {
  type FrontendImplementationPlan,
  ImplementationPlanSchema,
} from '@/agents/FrontendReact/schema.js';

const STACK_KEYWORDS = [
  'React Hook Form',
  'zodResolver',
  'Zustand',
  'next-intl',
  'NEXT_LOCALE',
  'next/headers',
  'App Router',
  'prefijo de locale',
] as const;

describe('FrontendReactAgent: stack por defecto', () => {
  it('declara en el system prompt las decisiones obligatorias de stack', () => {
    for (const keyword of STACK_KEYWORDS) {
      expect(SYSTEM_PROMPT).toContain(keyword);
    }
    expect(SYSTEM_PROMPT).toContain('STACK POR DEFECTO');
  });

  it('el prompt prohíbe rutas con prefijo de idioma y cookies sensibles en cliente', () => {
    expect(SYSTEM_PROMPT).toMatch(/nunca rutas duplicadas \/es \/en/i);
    expect(SYSTEM_PROMPT).toMatch(/jam[áa]s tocar cookies sensibles desde el cliente/i);
  });

  it('valida un plan que usa el stack por defecto (zustand, cookie, RHF+zod)', () => {
    const plan: FrontendImplementationPlan = {
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

    const parsed = ImplementationPlanSchema.parse(plan);
    expect(parsed.stateAndDataStrategy.stateDecision).toBe('zustand');
    expect(parsed.i18nStrategy.localeDetection).toBe('cookie');
    expect(parsed.formHandling.strategy).toContain('zodResolver');
  });

  it('rechaza planes sin las nuevas decisiones de stack', () => {
    const incomplete = {
      analysis: ['a', 'b'],
      components: [{ name: 'X', kind: 'client', responsibility: 'y' }],
      folderStructure: 'src',
      stateAndDataStrategy: { stateDecision: 'local-state', justification: 'simple' },
      performanceNotes: ['p1', 'p2'],
      accessibilityNotes: ['a1', 'a2'],
      animationNotes: 'n/a',
      tasks: [
        { area: 'components', description: 't1' },
        { area: 'data', description: 't2' },
        { area: 'styles-animation', description: 't3' },
        { area: 'testing', description: 't4' },
      ],
      storyPoints: 2,
      risks: ['r'],
    };

    // Sin formHandling, i18nStrategy ni serverCookiesUsage debe fallar
    expect(() => ImplementationPlanSchema.parse(incomplete)).toThrow();
  });
});
