import { containsAny } from '@/evals/contains.js';
import type { EvalCase } from '@/types/index.js';

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
  {
    id: 'uxui-onboarding-app-mobile',
    input:
      'Diseñar el flujo de onboarding de una app de finanzas personales: 3 pantallas de bienvenida, tutorial interactivo y primer paso de conexión bancaria.',
    threshold: 65,
    rubric: [
      {
        id: 'progresion-clara',
        requirement:
          'El flujo tiene una progresión lógica: bienvenida → valor → acción concreta. Cada paso tiene un objetivo claro.',
      },
      {
        id: 'skip-y-progress',
        requirement:
          'Permite saltar el onboarding (skip) y muestra progreso visual (dots, barra o pasos).',
      },
      {
        id: 'microcopy-convincente',
        requirement:
          'El copy de cada paso es conciso y beneficioso: explica qué gana el usuario, no qué hace la app.',
      },
      {
        id: 'manejo-de-permisos',
        requirement:
          'Explica por qué pide permisos (ej. acceso bancario) antes de solicitarlos, con opción de rechazo sin perder funcionalidad.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona progreso visual',
        test: (output) => containsAny(output, ['progress', 'paso', 'dots', 'indicator']),
      },
      {
        name: 'habla de permisos',
        test: (output) => containsAny(output, ['permiso', 'permission', 'acceso', 'authorization']),
      },
    ],
  },
  {
    id: 'uxui-dashboard-analiticas',
    input:
      'Rediseñar el dashboard de analíticas de una SaaS: 12 métricas clave, 3 gráficos principales y filtros de tiempo. Audiencia: gerentes no técnicos.',
    threshold: 65,
    rubric: [
      {
        id: 'jerarquia-visual',
        requirement:
          'Establece jerarquía visual clara: KPIs principales arriba, gráficos de tendencia en medio, detalles tabulares abajo.',
      },
      {
        id: 'filtros-intuitivos',
        requirement:
          'Los filtros de tiempo (hoy, semana, mes, trimestre, año) son accesibles con un clic, no ocultos en menús.',
      },
      {
        id: 'lenguaje-empresarial',
        requirement:
          'El copy usa terminología empresarial (MRR, churn, growth) en lugar de jerga técnica.',
      },
      {
        id: 'responsive-para-executivos',
        requirement:
          'El layout se adapta para tablet y móvil, priorizando los KPIs más importantes en pantallas pequeñas.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona KPIs o métricas',
        test: (output) => containsAny(output, ['kpi', 'métrica', 'metric', 'mrr', 'churn']),
      },
      {
        name: 'habla de filtros temporales',
        test: (output) => containsAny(output, ['filtro', 'filter', 'periodo', 'rango de fechas']),
      },
    ],
  },
  {
    id: 'uxui-sistema-notificaciones',
    input:
      'Diseñar el sistema de notificaciones de una plataforma de proyecto: alertas de deadline, menciones de equipo, actualizaciones de tareas y resumen diario.',
    threshold: 65,
    rubric: [
      {
        id: 'segmentacion-de-notificaciones',
        requirement:
          'Clasifica notificaciones por urgencia (critical, important, info) con estilo visual diferenciado.',
      },
      {
        id: 'canal-y-frecuencia',
        requirement:
          'Define canales (in-app, email, push) y frecuencia por tipo de notificación, evitando fatiga.',
      },
      {
        id: 'acciones-rapidas',
        requirement:
          'Permite acciones rápidas desde la notificación (marcar como leído, archivar, responder).',
      },
      {
        id: 'preferencias-de-usuario',
        requirement: 'El usuario puede personalizar qué notificaciones recibe y en qué canal.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona canales de notificación',
        test: (output) => containsAny(output, ['email', 'push', 'in-app', 'canal']),
      },
      {
        name: 'habla de preferencias',
        test: (output) =>
          containsAny(output, ['preferencia', 'preference', 'configuración', 'setting']),
      },
    ],
  },
  {
    id: 'uxui-accesibilidad-formulario',
    input:
      'Diseñar un formulario de solicitud de préstamo bancario: 8 campos, validación en tiempo real y pasos de verificación de identidad.',
    threshold: 65,
    rubric: [
      {
        id: 'campos-con-labels-claros',
        requirement:
          'Cada campo tiene un label descriptivo, placeholder de ejemplo yhelper text explicativo.',
      },
      {
        id: 'validacion-inline',
        requirement:
          'La validación es inline (success/error states) con mensajes accionables, no códigos de error.',
      },
      {
        id: 'grupos-logicos',
        requirement:
          'Los campos se agrupan lógicamente (datos personales, financieros, verificación) con separadores visuales.',
      },
      {
        id: 'focus-management',
        requirement:
          'El focus se mueve lógicamente entre campos (Tab order) y hay skip links para grupos de campos.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona labels y aria',
        test: (output) => containsAny(output, ['label', 'aria', 'helper text', 'placeholder']),
      },
      {
        name: 'habla de validación',
        test: (output) => containsAny(output, ['validación', 'validation', 'error', 'correcto']),
      },
    ],
  },
];
