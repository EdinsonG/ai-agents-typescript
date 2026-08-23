import { containsAny } from '@/evals/contains.js';
import { DeterministicCheck, EvalCase } from '@/evals/types.js';

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
];
