import type { Skill } from '@/types/index.js';

export const TESTING_STRATEGIES_SKILL: Skill = {
  id: 'testing-strategies',
  name: 'Estrategias de Testing',
  description: 'Estrategias diferenciadas: unit, integration, E2E, performance y security testing.',
  instructions: `
Define estrategias de testing según el contexto:
- Unitarias: mockear dependencias externas, testing de lógica pura, edge cases y error paths. Cubrir ramas significativas.
- Integración: testear contratos entre componentes, APIs con supertest, bases de datos efímeras o mocked.
- E2E: flujos completos de usuario con Playwright/Cypress, happy paths y escenarios críticos.
- Performance: load testing con k6/Artillery, métricas p50/p95/p99, análisis de cuellos de botella.
- Security: OWASP ZAP, testing de auth/authz, inyección, XSS, CSRF.
- Análisis de riesgos: priorizar áreas de mayor impacto y probabilidad de fallo.
- Quality gates: definir criterios de calidad para cada fase del pipeline.`,
};

export const OWASP_TESTING_GUIDE_SKILL: Skill = {
  id: 'owasp-testing-guide',
  name: 'OWASP Testing Guide',
  description: 'Checklist de seguridad basado en OWASP Testing Guide v4.',
  instructions: `
Aplica OWASP Testing Guide para auditorías de seguridad:
1. Autenticación: testing de fuerza bruta, rotación de tokens, expiración, lockout.
2. Autorización: BOLA/IDOR, escalada de privilegios, testing de roles.
3. Input validation: XSS, SQL/NoSQL injection, command injection, SSRF.
4. Configuration: headers de seguridad, CORS, error handling, secrets management.
5. Cryptography: storage seguro,传输层安全, hashing de contraseñas.
6. Business logic: bypass de controles, race conditions, idempotencia.
7. Client-side: CSRF, clickjacking, postMessage security.
- Para cada hallazgo: severity (critical/major/minor), pasos para reproducir, fix sugerido.`,
};

export const API_CONTRACT_TESTING_SKILL: Skill = {
  id: 'api-contract-testing',
  name: 'API Contract Testing',
  description: 'Testing de contratos APIs con Pact, OpenAPI y validación de esquemas.',
  instructions: `
Implementa contract testing para APIs:
- Consumer-driven contracts: definir expectativas del consumidor antes de implementar el provider.
- Pact o equivalente: generar y verificar contratos entre servicios.
- Schema validation: validar request/response contra OpenAPI/JSON Schema.
- Backward compatibility: detectar breaking changes automáticamente.
- CI/CD integration: contratos como parte del pipeline, no como paso manual.
- Mock servers: simular providers para testing de consumidores aislados.
- Versionado: estrategia de versionado semántico para APIs REST.`,
};
