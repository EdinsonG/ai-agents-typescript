import type { EvalCase } from '@/types/index.js';

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
  {
    id: 'react-formulario-multi-paso-wizard',
    input:
      'Formulario de registro multi-paso con 4 secciones: datos personales, dirección, preferencias y confirmación. Validación en cada paso con posibilidad de retroceder.',
    threshold: 65,
    rubric: [
      {
        id: 'estado-persistido-entre-pasos',
        requirement:
          'El estado del formulario se mantiene entre pasos (useState, useReducer o form library) y se puede navigar hacia atrás sin perder datos.',
      },
      {
        id: 'validacion-por-paso',
        requirement:
          'Valida cada paso individualmente antes de avanzar, usando zod, yup o validación manual con mensajes claros.',
      },
      {
        id: 'accesibilidad-navegacion',
        requirement:
          'Soporte de teclado para navegación entre pasos y aria-labels en botones de avanzar/retroceder.',
      },
      {
        id: 'componentes-reutilizables',
        requirement:
          'Los campos del formulario son componentes reutilizables (Input, Select, Button) con interfaz consistente.',
      },
    ],
  },
  {
    id: 'react-tabla-datos-sorting-filtering',
    input:
      'Tabla de datos con sorting por columnas, filtering por texto y paginación client-side. 1000 filas de datos mock.',
    threshold: 65,
    rubric: [
      {
        id: 'sorting-multi-columna',
        requirement:
          'Soporta sorting por múltiples columnas con indicador visual de dirección (asc/desc).',
      },
      {
        id: 'debounced-search',
        requirement:
          'El filtro de texto usa debounce para evitar re-renders excesivos en cada tecla.',
      },
      {
        id: 'virtualizacion-o-paginacion',
        requirement:
          'Implementa paginación o virtualización (react-window/virtual) para manejar el volumen de datos sin degradar rendimiento.',
      },
      {
        id: 'estados-vacios',
        requirement:
          'Muestra un estado vacío amigable cuando no hay resultados de búsqueda.',
      },
    ],
  },
  {
    id: 'react-auth-flow-completo',
    input:
      'Flujo de autenticación completo: login, registro, recuperación de contraseña y persistencia de sesión con refresh tokens.',
    threshold: 65,
    rubric: [
      {
        id: 'contexto-de-auth',
        requirement:
          'Usa React Context o librería de estado (zustand, jotai) para proveer el estado de autenticación a toda la app.',
      },
      {
        id: 'protected-routes',
        requirement:
          'Implementa rutas protegidas que redirigen a login si el usuario no está autenticado.',
      },
      {
        id: 'refresh-token-automático',
        requirement:
          'Maneja refresh tokens automáticamente antes de que expire el access token.',
      },
      {
        id: 'manejo-de-errores',
        requirement:
          'Muestra errores específicos por campo (email inválido, contraseña débil) y no genéricos.',
      },
    ],
  },
  {
    id: 'react-dashboard-graficos-responsive',
    input:
      'Dashboard con 4 gráficos: línea temporal, barras por categoría, doughnut de distribución y KPIs numéricos. Responsive para mobile y desktop.',
    threshold: 65,
    rubric: [
      {
        id: 'libreria-de-graficos',
        requirement:
          'Selecciona una librería de gráficos adecuada (Recharts, Victory, Nivo o visx) y justifica la elección.',
      },
      {
        id: 'responsive-layout',
        requirement:
          'Los gráficos se adaptan a diferentes tamaños de pantalla usando CSS Grid o Flexbox con breakpoints.',
      },
      {
        id: 'skeleton-loading',
        requirement:
          'Muestra skeleton loaders mientras los datos de los gráficos se cargan.',
      },
      {
        id: 'tooltip-interactivo',
        requirement:
          'Cada gráfico tiene tooltips interactivos con datos detallados al hacer hover.',
      },
    ],
  },
];
