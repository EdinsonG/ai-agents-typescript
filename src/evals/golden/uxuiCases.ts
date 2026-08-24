import { containsAny } from '@/evals/contains.js';
import type { EvalCase } from '@/evals/types.js';

export const UXUI_CASES: EvalCase[] = [
  {
    id: 'uxui-checkout-abandono',
    input:
      'Rediseño del checkout de un e-commerce: actualmente 5 pasos y el 60% abandona el carrito; buscamos reducir fricción y abandono.',
    skills: ['wcag-forms'],
    threshold: 65,
    rubric: [
      {
        id: 'diagnostico-y-reduccion-friccion',
        requirement:
          'Diagnostica causas probables del abandono y propone una reducción concreta de fricción (ej. pasar de 5 pasos a menos, guest checkout, autocompletado), no consejos vagos de "mejorar usabilidad".',
      },
      {
        id: 'tokens-con-contraste-verificado',
        requirement:
          'Especifica colores con valores hex concretos y declara sus ratios de contraste (mínimo 4.5:1 para texto normal), no solo nombres de color.',
      },
      {
        id: 'estados-completos',
        requirement:
          'Cubre estados más allá del camino feliz: loading, vacío, error y límite/overflow, además de hover/focus.',
      },
      {
        id: 'validacion-y-metricas',
        requirement:
          'Define métricas de éxito medibles (tasa de abandono objetivo, tiempo en tarea, task success) y un método de validación (test de usabilidad o A/B).',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona accesibilidad WCAG o contraste',
        test: (output) => containsAny(output, ['wcag', 'contraste']),
      },
      {
        name: 'cubre estados de la interfaz',
        test: (output) => containsAny(output, ['loading', 'error', 'vacío', 'empty']),
      },
    ],
  },
];
