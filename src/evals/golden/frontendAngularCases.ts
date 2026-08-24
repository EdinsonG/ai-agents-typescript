import { containsAny } from '@/evals/contains.js';
import type { EvalCase } from '@/evals/types.js';

export const FRONTEND_ANGULAR_CASES: EvalCase[] = [
  {
    id: 'angular-tabla-admin-server-side',
    input:
      'Una tabla administrativa con paginación server-side, ordenamiento por columna, búsqueda con debounce y edición en línea de usuarios.',
    threshold: 65,
    rubric: [
      {
        id: 'standalone-onpush-idiomatico',
        requirement:
          'Usa componentes standalone y ChangeDetectionStrategy.OnPush (o zoneless); no propone NgModules ni change detection por defecto.',
      },
      {
        id: 'sintaxis-moderna-signals',
        requirement:
          'Emplea la sintaxis moderna de Angular: signals/computed, input()/output(), control de flujo @if/@for con track; evita decoradores legacy como @Input/@Output.',
      },
      {
        id: 'reactividad-sin-fugas',
        requirement:
          'Gestiona las suscripciones RxJS sin fugas de memoria (takeUntilDestroyed, async pipe o conversión a signal) y aplica debounce a la búsqueda.',
      },
      {
        id: 'tipado-estricto-formularios',
        requirement:
          'La edición en línea usa Reactive Forms tipados (typed forms) o edición basada en signals tipadas, sin any.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona standalone u OnPush',
        test: (output) => containsAny(output, ['standalone', 'onpush', 'zoneless']),
      },
      {
        name: 'usa sintaxis moderna de control de flujo',
        test: (output) => containsAny(output, ['@if', '@for', 'signal']),
      },
    ],
  },
];
