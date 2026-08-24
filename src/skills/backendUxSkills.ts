import type { Skill } from '@/core/Skill.js';

export const HEXAGONAL_NESTJS_SKILL: Skill = {
  id: 'hexagonal-nestjs',
  name: 'Arquitectura Hexagonal en NestJS',
  description: 'Estructura puertos/adaptadores con dominio desacoplado del framework.',
  instructions: `
Estructura toda solución backend siguiendo hexagonal:
- src/modules/<dominio>/{domain, application, infrastructure, presentation}.
- domain/: entidades, value objects, errores de dominio y puertos (interfaces) de repositorio. CERO imports de Nest, Prisma o HTTP.
- application/: casos de uso que orquestan dominio vía puertos. Testeables sin base de datos ni HTTP.
- infrastructure/: adaptadores salientes (repositorios Prisma/TypeORM, clientes HTTP, colas) que implementan puertos.
- presentation/: controladores Nest + DTOs; solo traducen HTTP ↔ caso de uso.
- Wiring con tokens de inyección ({ provide: 'UserRepository', useClass: ... }) para invertir dependencias.
- Regla de oro verificable: si mañana cambias Express por Fastify o Prisma por Mongoose, domain/application no cambian ni una línea.`,
};

export const OWASP_API_TOP10_SKILL: Skill = {
  id: 'owasp-api-top10',
  name: 'Checklist OWASP API Top 10',
  description: 'Mitigaciones concretas contra las 10 amenazas críticas a APIs (2023).',
  instructions: `
Audita cada diseño de API contra OWASP API Security Top 10 y declara mitigaciones:
1. BOLA/IDOR: autorización por recurso (no solo autenticación); validar ownership del objeto en cada endpoint con id.
2. Autenticación rota: rotación de refresh tokens, detección de reuso, expiraciones cortas, lockout progresivo.
3. Autorización a nivel de objeto/función: guards + policies centralizadas, nunca checks dispersos.
4. Consumo ilimitado de recursos: rate-limiting por identidad+IP, paginación obligatoria, límites de payload.
5. BFLA (funciones admin): endpoints administrativos con doble verificación de rol.
6. BOLA sensible: respuestas filtradas por campo según permiso (DTOs de salida diferenciados).
7. SSRF: nunca fetch de URLs provistas por cliente sin allowlist validada.
8. Misconfiguración: Helmet, CORS explícito, errores sin stack traces al cliente.
9. Inventario: versionado de API, documentación viva, deprecación.
10. Unsafe consumption de terceros: validar webhooks entrantes con firma HMAC y timestamps.`,
};

export const WCAG_FORMS_SKILL: Skill = {
  id: 'wcag-forms',
  name: 'Formularios Accesibles (WCAG 2.2)',
  description: 'Especificación de formularios navegables por teclado y lectores de pantalla.',
  instructions: `
En todo formulario especifica:
- Cada input con <label> asociado (no placeholders como label); grupos con fieldset/legend; autocomplete semántico en datos personales.
- Errores: mensaje visible junto al campo, aria-describedby vinculado, aria-invalid="true", y resumen superior con aria-live="assertive" que anuncia cuántos errores hay y enlace a cada campo inválido.
- El foco va al primer campo inválido tras submit fallido; el orden de tabulación sigue el orden visual.
- Validación en blur + submit (nunca on-input agresivo mientras escribe); éxito anunciado con role="status".
- Contraste mínimo 4.5:1 en textos de error (no rojo claro sobre blanco); estados focus visibles (outline no suprimido).
- Criterios WCAG aplicables declarados: 3.3.1 Error Identification, 3.3.3 Error Suggestion, 2.4.3 Focus Order, 1.3.5 Input Purpose.`,
};

export const API_ERRORS_RESILIENCE_SKILL: Skill = {
  id: 'api-errors-resilience',
  name: 'Errores tipados y resiliencia de API',
  description: 'Errores de dominio mapeados a HTTP, retries con backoff, timeouts e idempotencia.',
  instructions: `
Errores y resiliencia obligatorios en toda API:
- Errores tipados del dominio mapeados a códigos HTTP en UN solo filtro/handler centralizado; el cliente nunca recibe stack traces.
- Validación en la frontera (DTO/class-validator/zod) antes de tocar el dominio; errores 400 con detalle por campo.
- Todo cliente HTTP saliente con timeout explícito y retries con backoff exponencial + jitter para fallos transitorios; circuit breaker en integraciones críticas.
- Idempotencia en endpoints que mutan dinero o estado: cabecera Idempotency-Key aceptada y deduplicada; webhooks deduplicados por event id.
- Límite de tamaño de payload y timeouts en todos los endpoints.`,
};

export const DESIGN_TOKENS_STATES_SKILL: Skill = {
  id: 'design-tokens-states',
  name: 'Design tokens y contrato de estados',
  description: 'Tokens verificables (contraste, escalas) y estados completos por componente.',
  instructions: `
Toda especificación de UI declara tokens verificables y estados completos:
- Colores SIEMPRE con hex y ratio de contraste declarado (≥4.5:1 texto normal, ≥3:1 texto grande); nada de "azul primario" sin valor.
- Escala tipográfica modular y espaciado en base 4/8pt; radios y sombras como tokens nombrados, no valores sueltos por pantalla.
- Cada componente define sus variantes Y sus estados completos: default, hover, focus-visible, active, disabled, loading, vacío, error y overflow — un componente sin estados es una spec incompleta.
- Los tokens se expresan listos para Tailwind/CSS variables compatibles con React o Angular.`,
};
