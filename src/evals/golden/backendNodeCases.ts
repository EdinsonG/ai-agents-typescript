import { containsAny } from '@/evals/contains.js';
import type { EvalCase } from '@/evals/types.js';

export const BACKEND_NODE_CASES: EvalCase[] = [
  {
    id: 'backend-suscripciones-webhooks',
    input:
      'API REST para gestión de suscripciones con cobros recurrentes: planes, ciclos de facturación, webhooks de pasarela de pago con idempotencia y reintentos.',
    skills: ['owasp-api-top10'],
    threshold: 65,
    rubric: [
      {
        id: 'seguridad-concreta-no-generica',
        requirement:
          'Menciona medidas específicas y accionables: rate-limiting por identidad/IP, validación de payloads con esquema (zod/class-validator/DTOs) y verificación de firma HMAC en los webhooks entrantes; sin frases genéricas tipo "buenas prácticas".',
      },
      {
        id: 'idempotencia-y-reintentos',
        requirement:
          'Explica cómo garantiza idempotencia del webhook (clave de idempotencia o deduplicación por event id) y una estrategia de reintentos con backoff para cobros fallidos.',
      },
      {
        id: 'arquitectura-por-capas',
        requirement:
          'Separa dominio/aplicación/infraestructura (hexagonal o modular) y declara que el dominio no depende del framework ni de la base de datos.',
      },
      {
        id: 'modelo-datos-consistente',
        requirement:
          'Define entidades con campos e índices relevantes (ej. unique en customer+periodo) y menciona transacciones o consistencia entre cobro y suscripción.',
      },
    ],
    deterministicChecks: [
      {
        name: 'incluye endpoints concretos',
        test: (output) => containsAny(output, ['post ', 'get ', '/api', '/subscription']),
      },
      {
        name: 'aborda seguridad explícitamente',
        test: (output) => containsAny(output, ['rate-limit', 'hmac', 'firma', 'webhook']),
      },
    ],
  },
];
