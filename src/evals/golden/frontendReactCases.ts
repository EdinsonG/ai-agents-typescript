import type { EvalCase } from '@/evals/types.js';

export const FRONTEND_REACT_CASES: EvalCase[] = [
  {
    id: 'react-dashboard-kanban-server-first',
    input:
      'Un dashboard Kanban con columnas arrastrables (drag & drop), filtros por estado y animaciones fluidas entre movimientos de tarjetas.',
    threshold: 65,
    rubric: [
      {
        id: 'decision-rsc-vs-client-explícita',
        requirement:
          'Distingue explícitamente qué componentes serían Server Components y cuáles Client Components ("use client"), justificando el uso del cliente solo donde hay interactividad real (drag & drop, filtros).',
      },
      {
        id: 'animaciones-con-reduced-motion',
        requirement:
          'La estrategia de animaciones con Motion contempla accesibilidad, mencionando prefer-reduced-motion o equivalente.',
      },
      {
        id: 'estados-de-ui-completos',
        requirement:
          'Considera estados de carga, error y vacío en la propuesta, no solo el camino feliz.',
      },
      {
        id: 'typescript-estricto-sin-any',
        requirement:
          'El enfoque de tipado es estricto: props tipadas y sin uso de any; si muestra código, este compila conceptualmente con strict mode.',
      },
    ],
  },
];
