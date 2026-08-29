import { containsAny } from '@/evals/contains.js';
import type { DeterministicCheck, EvalCase } from '@/types/index.js';

const AUTH_INPUT =
  'Necesito un módulo de autenticación con user y password, además de soporte para OAuth2 (Google y GitHub), manejo seguro de JWT y refresh tokens, sesiones en Redis con expiración de 15 minutos, previniendo XSS, CSRF e inyección SQL.';

const CHECKS: DeterministicCheck[] = [
  {
    name: 'incluye criterios de aceptación en formato Gherkin',
    test: (output) => containsAny(output, ['dado que', 'escenario']),
  },
  {
    name: 'incluye desglose de tareas',
    test: (output) => containsAny(output, ['tarea', 'task', 'frontend', 'backend']),
  },
];

export const TECHNICAL_PO_CASES: EvalCase[] = [
  {
    id: 'po-auth-oauth2-con-skills-de-seguridad',
    input: AUTH_INPUT,
    skills: ['pci-dss'],
    threshold: 70,
    rubric: [
      {
        id: 'historia-usuario-completa',
        requirement:
          'Incluye una historia de usuario con las tres partes explícitas: rol de usuario (como), acción (quiero) y valor de negocio (para).',
      },
      {
        id: 'criterios-gherkin-suficientes',
        requirement:
          'Presenta al menos 2 escenarios Gherkin (Dado/Cuando/Entonces), cubriendo un camino feliz y un caso de error o seguridad.',
      },
      {
        id: 'seguridad-concreta-no-generica',
        requirement:
          'Menciona medidas de seguridad específicas y accionables (ej. rate-limiting, sanitización con zod, rotación de refresh tokens, tokenización), sin quedarse en frases genéricas como "aplicar buenas prácticas".',
      },
      {
        id: 'tareas-por-capas',
        requirement:
          'Desglosa tareas diferenciadas por capas (frontend/backend/base de datos/testing) listas para tablero Kanban.',
      },
      {
        id: 'estimacion-justificada',
        requirement:
          'Asigna story points de la escala Fibonacci (1,2,3,5,8) con una justificación técnica breve.',
      },
    ],
    deterministicChecks: CHECKS,
  },
  {
    id: 'po-funcionalidad-simple-sin-seguridad-excesiva',
    input:
      'Queremos añadir un modo oscuro a la aplicación web existente que ya tiene un design system con tokens.',
    threshold: 60,
    rubric: [
      {
        id: 'historia-usuario-completa',
        requirement: 'Incluye historia de usuario completa (rol, acción y valor).',
      },
      {
        id: 'proporcion-alcance-estimacion',
        requirement:
          'La estimación es proporcional al alcance simple del requerimiento (story points bajos, típicamente 1-3); no infla la complejidad.',
      },
    ],
  },
  {
    id: 'po-migracion-base-datos',
    input:
      'Migrar la base de datos de MySQL 5.7 a PostgreSQL 15 con zero-downtime: esquema de 200 tablas, 50M de registros, y dependencias entre tablas.',
    threshold: 70,
    rubric: [
      {
        id: 'estrategia-de-migracion',
        requirement:
          'Propone una estrategia clara (big bang, strangler fig o dual-write) con justificación basada en el tamaño de los datos.',
      },
      {
        id: 'plan-de-rollback',
        requirement:
          'Define un plan de rollback por si algo falla: backup, replicación reversa o blue-green deployment.',
      },
      {
        id: 'testing-de-datos',
        requirement:
          'Incluye validación de integridad de datos post-migración: checksums, conteos y comparación de muestras.',
      },
      {
        id: 'ventana-de-mantenimiento',
        requirement:
          'Estima la ventana de mantenimiento necesaria y propone estrategias para minimizar el downtime.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona herramienta de migración',
        test: (output) =>
          containsAny(output, ['pgloader', 'aws dms', 'flyway', 'liquibase', 'schema']),
      },
      {
        name: 'habla de backup',
        test: (output) => containsAny(output, ['backup', 'respaldo', 'dump', 'snapshot']),
      },
    ],
  },
  {
    id: 'po-api-publica-rate-limiting',
    input:
      'Diseñar la especificación de una API pública con rate limiting por tier (free, pro, enterprise), documentación OpenAPI y políticas de versionado.',
    threshold: 70,
    rubric: [
      {
        id: 'rate-limiting-por-tier',
        requirement:
          'Define límites de tasa por tier (ej. 100/min free, 1000/min pro, unlimited enterprise) con headers de respuesta (X-RateLimit-*).',
      },
      {
        id: 'versionado-de-api',
        requirement:
          'Propone estrategia de versionado (URL path /v1, header o query param) con política de deprecación.',
      },
      {
        id: 'documentacion-openapi',
        requirement:
          'Incluye esquema OpenAPI/Swagger con schemas de request/response, autenticación y ejemplos.',
      },
      {
        id: 'manejo-de-errores',
        requirement:
          'Define formato de errores consistente (RFC 7807 o similar) con códigos de error específicos.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona OpenAPI o Swagger',
        test: (output) => containsAny(output, ['openapi', 'swagger', 'oas']),
      },
      {
        name: 'habla de rate limiting',
        test: (output) => containsAny(output, ['rate limit', 'rate-limit', 'throttl', '429']),
      },
    ],
  },
  {
    id: 'po-feature-flags-y-experimentacion',
    input:
      'Implementar sistema de feature flags para lanzamiento gradual de funcionalidades, con experimentos A/B y métricas de impacto.',
    threshold: 70,
    rubric: [
      {
        id: 'tipos-de-flags',
        requirement:
          'Distingue entre flags de experimento (temporales), de operación (permanent) y de release (gradual rollout).',
      },
      {
        id: 'targeting-y-segmentacion',
        requirement:
          'Define reglas de targeting: por porcentaje, usuario específico, empresa o atributo personalizado.',
      },
      {
        id: 'metricas-de-exito',
        requirement:
          'Establece métricas de éxito por experimento (conversion rate, engagement, revenue) con período de observación.',
      },
      {
        id: 'limpieza-de-flags',
        requirement:
          'Incluye proceso para limpiar flags obsoletos (feature flag lifecycle) para evitar deuda técnica.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona feature flags',
        test: (output) => containsAny(output, ['feature flag', 'feature toggle', 'flag', 'toggle']),
      },
      {
        name: 'habla de A/B testing',
        test: (output) => containsAny(output, ['a/b', 'experimento', 'experiment', 'variant']),
      },
    ],
  },
  {
    id: 'po-micro-frontends',
    input:
      'Arquitectura de micro-frontends para plataforma educativa: 4 equipos trabajando en paralelo, necesitan deploy independiente y shared components.',
    threshold: 70,
    rubric: [
      {
        id: 'estrategia-de-composicion',
        requirement:
          'Elige estrategia de composición (build-time, server-side o runtime via Module Federation) con justificación.',
      },
      {
        id: 'shared-components',
        requirement:
          'Define cómo se comparten componentes comunes (design system) entre micro-frontends sin duplicación.',
      },
      {
        id: 'comunicacion-entre-mfs',
        requirement:
          'Propone mecanismo de comunicación entre micro-frontends (Custom Events, Shared State o API gateway).',
      },
      {
        id: 'deploy-independiente',
        requirement:
          'Cada micro-frontend se puede deployar independientemente sin afectar a los demás.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona micro-frontends',
        test: (output) =>
          containsAny(output, ['micro-frontend', 'micro frontend', 'module federation']),
      },
      {
        name: 'habla de equipos',
        test: (output) => containsAny(output, ['equipo', 'team', 'independiente', 'autonomo']),
      },
    ],
  },
];
