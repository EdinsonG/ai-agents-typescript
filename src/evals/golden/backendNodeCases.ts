import { containsAny } from '@/evals/contains.js';
import type { EvalCase } from '@/types/index.js';

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
  {
    id: 'backend-cola-tareas-worker',
    input:
      'Sistema de procesamiento asíncrono de imágenes: cola de tareas con workers que redimensionan, comprimen y generan thumbnails. Necesita manejo de fallos, reintentos y métricas.',
    threshold: 65,
    rubric: [
      {
        id: 'cola-con-reintentos',
        requirement:
          'Describe una cola de tareas (BullMQ, Redis, SQS o similar) con configuración de reintentos con backoff exponencial y dead-letter queue para fallos persistentes.',
      },
      {
        id: 'worker-isolados',
        requirement:
          'Los workers están aislados del servidor HTTP y pueden escalarse independientemente (procesos separados o serverless).',
      },
      {
        id: 'metricas-y-monitoreo',
        requirement:
          'Incluye métricas de procesamiento: tiempo de cola, tasa de éxito/fallo, número de workers activos.',
      },
      {
        id: 'validacion-input',
        requirement:
          'Valida el input antes de procesar (tipo de archivo, tamaño máximo, dimensiones permitidas).',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona tecnología de cola',
        test: (output) => containsAny(output, ['bull', 'redis', 'sqs', 'queue', 'cola']),
      },
      {
        name: 'describe manejo de errores',
        test: (output) => containsAny(output, ['retry', 'reintento', 'dead-letter', 'fallo', 'error']),
      },
    ],
  },
  {
    id: 'backend-api-graphql-subscriptions',
    input:
      'API GraphQL con subscriptions en tiempo real para un chat gráfico: mensajes, typing indicators y presencia de usuarios.',
    threshold: 65,
    rubric: [
      {
        id: 'schema-graphql-completo',
        requirement:
          'Define el schema GraphQL con types, inputs, queries, mutations y subscriptions relevantes (onMessage, onTyping, onPresenceChange).',
      },
      {
        id: 'resolvers-separados',
        requirement:
          'Separa resolvers por dominio (message, user, presence) y usa dataloaders para evitar N+1 queries.',
      },
      {
        id: 'subscriptions-con-autenticacion',
        requirement:
          'Las subscriptions validan el token de autenticación en la conexión y filtran eventos por usuario/kanal.',
      },
      {
        id: 'escalabilidad',
        requirement:
          'Menciona uso de PubSub (Redis PubSub, Kafka) para escalar subscriptions más allá de una instancia.',
      },
    ],
    deterministicChecks: [
      {
        name: 'define tipos GraphQL',
        test: (output) => containsAny(output, ['type ', 'input ', 'subscription', 'query']),
      },
      {
        name: 'menciona subscriptions',
        test: (output) => containsAny(output, ['subscription', 'subscribe', 'onMessage', 'real-time']),
      },
    ],
  },
  {
    id: 'backend-microservicios-api-gateway',
    input:
      'Arquitectura de microservicios para e-commerce: catálogo, carrito, pedidos y pagos. Necesita API gateway, service discovery y comunicación asíncrona.',
    threshold: 65,
    rubric: [
      {
        id: 'api-gateway',
        requirement:
          'Define un API gateway que centraliza autenticación, rate limiting y routing a microservicios internos.',
      },
      {
        id: 'comunicacion-asincrona',
        requirement:
          'Usa mensajería asíncrona (Kafka, RabbitMQ o NATS) para eventos cross-service (ej. pedido creado → pago iniciado).',
      },
      {
        id: 'service-discovery',
        requirement:
          'Menciona service discovery (Consul, Eureka, DNS-based) o un patrón de dirección de servicios.',
      },
      {
        id: 'resiliencia',
        requirement:
          'Incluye circuit breaker, bulkhead o timeout para fallas en llamadas entre servicios.',
      },
    ],
    deterministicChecks: [
      {
        name: 'enumera microservicios',
        test: (output) => containsAny(output, ['catálogo', 'catalogo', 'carrito', 'pedido', 'pago']),
      },
      {
        name: 'menciona gateway',
        test: (output) => containsAny(output, ['gateway', 'api gateway', 'proxy']),
      },
    ],
  },
  {
    id: 'backend-caching-strategy',
    input:
      'API de alto tráfico para servicio de recomendaciones: necesita caché multinivel (in-memory + Redis), invalidación por eventos y warm-up.',
    threshold: 65,
    rubric: [
      {
        id: 'cache-multinivel',
        requirement:
          'Describe al menos dos niveles de caché: in-memory (L1) para acceso ultra-rápido y Redis (L2) para compartir entre instancias.',
      },
      {
        id: 'invalidacion-por-eventos',
        requirement:
          'Explica estrategia de invalidación: TTL, invalidación por evento (pub/sub) o write-through/write-behind.',
      },
      {
        id: 'cache-warm-up',
        requirement:
          'Incluye estrategia de warm-up para popular caché con datos populares al inicio del servicio.',
      },
      {
        id: 'metricas-cache',
        requirement:
          'Mide hit rate, miss rate y latencia del cache para monitorear efectividad.',
      },
    ],
    deterministicChecks: [
      {
        name: 'menciona Redis',
        test: (output) => containsAny(output, ['redis', 'cache', 'caché']),
      },
      {
        name: 'describe invalidación',
        test: (output) => containsAny(output, ['invalidat', 'ttl', 'expir', 'evict']),
      },
    ],
  },
];
