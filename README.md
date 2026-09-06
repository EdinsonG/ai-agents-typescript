# Core Multi-Agente de IA — TypeScript + Groq

Núcleo modular para construir, orquestar y escalar agentes de IA con TypeScript. Arquitectura basada en **SOLID**, inyección de dependencias y proveedor LLM con resiliencia de producción. Incluye **5 agentes expertos** con skills componibles, salidas estructuradas validadas y harness de evaluación medible.

> **[Guía de uso completa →](docs/GUIDE.md)** — instalación, configuración, escribir requerimientos, skills, pipeline, uso programático y más.

---

## Agentes disponibles

| Agente | Id | Métodos principales | Especialidad |
|--------|-----|---------------------|--------------|
| Technical Product Owner | `po` | `generateUserStory`, `generateUserStoryStructured` | Backlog, historias INVEST, Gherkin, priorización WSJF/RICE |
| Frontend React Expert | `react` | `implementFeature(Structured)`, `generateUnitTests`, `reviewCode` | React 19, App Router, RSC/CC, Tailwind v4, React Hook Form + zod, Zustand, next-intl por cookie |
| Backend Node Expert | `backend` | `designApi(Structured)`, `generateUnitTests`, `reviewCode` | NestJS/Express, arquitectura hexagonal, OWASP API Top 10 |
| UX/UI Design Expert | `uxui` | `designSolution(Structured)` | Design tokens, WCAG 2.2 AA, estados de UI completos |
| QA Expert | `qa` | `createTestPlan(Structured)`, `reviewCode(Structured)`, `bugBash(Structured)` | Planes de testing, revisión de código, bug bash, OWASP Testing Guide |

```bash
pnpm dev -- po "Requerimiento opcional"
pnpm dev -- react
pnpm dev -- qa "Módulo de checkout con pagos"
```

---

## Núcleo (`src/core/`)

| Módulo | Responsabilidad |
|--------|-----------------|
| `Agent.ts` | Clase base: memoria de conversación, ejecución libre y estructurada, skills al system prompt, presupuesto de tokens |
| `LLMProvider.ts` | Inferencia con **retries + backoff exponencial + jitter**, timeout por intento y política propia |
| `SkillRegistry.ts` | Registro central de skills activables por petición |
| `tokens.ts` | Estimación de tokens y truncado del historial respetando presupuesto |
| `errors.ts` | `LLMProviderError` tipada (`rate_limit · auth · bad_request · timeout · server · network`) con flag `retryable` |
| `json.ts` | Parser JSON tolerante (cercos de código, texto circundante) |

**Resiliencia**: reintenta solo errores transitorios (429/408/5xx/red); `auth` y `bad_request` fallan de inmediato. Presupuesto de contexto por agente (default 8000 tokens).

**Multi-proveedor**: funciona con Groq, OpenAI, DeepSeek, Together, Mistral, Ollama, Anthropic o cualquier endpoint OpenAI-compatible — sin SDKs, solo `fetch`.

---

## Skills componibles (`src/skills/`)

Packs de conocimiento experto que se inyectan **solo en la petición** que los solicita:

| Id | Dominio |
|----|---------|
| `pci-dss` | Pagos: tokenización, scope reduction, SCA/3DS |
| `wsjf`, `rice` | Priorización de backlog cuantitativa |
| `core-web-vitals` | Presupuestos LCP/INP/CLS en React/Next |
| `react-server-first` | Disciplina RSC vs Client Components, Server Actions |
| `hexagonal-nestjs` | Puertos/adaptadores con dominio puro |
| `owasp-api-top10` | Checklist de mitigaciones por amenaza |
| `api-errors-resilience` | Errores tipados mapeados a HTTP, retries, timeouts, idempotencia |
| `wcag-forms` | Formularios accesibles verificables |
| `design-tokens-states` | Tokens con contraste verificado y estados completos |
| `react-hook-form-zod` | Formularios con react-hook-form + zodResolver |
| `zustand-persist` | Stores Zustand por feature con persistencia |
| `next-intl-cookie` | i18n next-intl por cookie `NEXT_LOCALE`, sin prefijo URL |
| `next-server-cookies` | Cookies de servidor vía next/headers |
| `testing-strategies` | Estrategias diferenciadas: unit, integration, E2E, performance, security |
| `owasp-testing-guide` | Checklist de seguridad OWASP Testing Guide v4 |
| `api-contract-testing` | Testing de contratos APIs con Pact, OpenAPI y validación de esquemas |

Skills por defecto por agente (auto-activadas en métodos de implementación/pruebas/revisión):
- **Frontend React**: `react-hook-form-zod`, `zustand-persist`, `next-intl-cookie`, `next-server-cookies`
- **Backend Node**: `hexagonal-nestjs`, `owasp-api-top10`, `api-errors-resilience`
- **UX/UI**: `wcag-forms`, `design-tokens-states`
- **Technical PO**: sin defaults (skills situacionales)
- **QA Expert**: `testing-strategies`, `owasp-testing-guide`, `api-contract-testing`

```ts
await po.generateUserStory(requerimiento, { skills: ['pci-dss', 'wsjf'] });
```

---

## Salidas estructuradas

Cada agente expone métodos `*Structured` que devuelven objetos validados con zod:

```ts
const story = await po.generateUserStoryStructured('login con OAuth2');
story.estimation.storyPoints;   // 1 | 2 | 3 | 5 | 8
story.acceptanceCriteria[0];    // { scenario, given, when, then }
```

El esquema zod se convierte a JSON Schema y se solicita salida nativa `json_schema`. Si la respuesta no valida, se reintenta una vez inyectando feedback del error.

---

## Generación de pruebas unitarias

Los agentes **React** y **Backend** generan suites completas como entregable estructurado (`UnitTestSuite`): archivos de test, librerías, comandos y foco de cobertura.

- **React**: Vitest + Testing Library
- **Backend**: Vitest/Jest + Supertest contra app factory (casos 400/404/409)

---

## Autocrítica opt-in (`src/critique/`)

`CritiqueRunner` ejecuta el bucle **generar → juzgar → revisar**: genera con el agente, puntúa contra tu rúbrica y, si queda bajo el umbral (default 80%), pide revisión. Devuelve siempre la mejor salida.

```ts
const runner = new CritiqueRunner(new LLMJudge(apiKey));
const result = await runner.run(poAgent, requerimiento, {
  rubric: [
    { id: 'seguridad-concreta', requirement: 'Menciona medidas accionables' },
    { id: 'criterios-gherkin', requirement: '≥2 escenarios Dado/Cuando/Entonces' },
  ],
  threshold: 85,
  skills: ['pci-dss'],
});
```

Costo: hasta 2 llamadas del agente + 2 del juez por ejecución.

---

## Evaluación de calidad (`src/evals/`)

Harness de evals reproducible: casos dorados + juez LLM (temperatura 0) + checks deterministas.

```bash
pnpm evals  # exit code ≠ 0 si algún caso queda bajo umbral → listo para CI
```

5 suites de agentes (PO, React, Backend, UX/UI, QA). Nuevos casos: agregar `EvalCase` en `src/evals/golden/`.

---

## Orquestación multi-agente (`src/orchestration/`)

`ProductDeliveryPipeline` encadena la suite completa:

```
requerimiento → PO (historia estructurada)
                    ↓ brief
              UX/UI (spec de diseño)
                    ↓ brief            ↓ brief
        Frontend React (plan)    Backend Node (API design)   ← en paralelo
```

```ts
const pipeline = new ProductDeliveryPipeline(poAgent, uxuiAgent, reactAgent, backendAgent);
const delivery = await pipeline.run('Checkout con pago con tarjeta', {
  stages: { uxui: true, frontend: true, backend: true },
  skills: { po: ['pci-dss'] },
});
delivery.story;             // UserStoryDeliverable
delivery.design;            // DesignSpec
delivery.frontend;          // FrontendImplementationPlan
delivery.api;               // ApiDesign
```

```bash
pnpm dev -- pipeline "Checkout con pago con tarjeta"
```

---

## Estructura del proyecto

```
src/
├── agents/          # PO · FrontendReact · BackendNode · UXUI · QAExpert
├── core/            # Agent · LLMProvider · Skills · tokens · errors
├── skills/          # Skills expertas + registro global
├── types/           # Contratos centralizados por dominio
├── orchestration/   # Pipeline PO → UX → Frontend/Backend + briefs
├── evals/           # judge · runner · reporter · golden cases · cli
├── critique/        # CritiqueRunner + LLMJudge
├── cli.ts           # CLI que lee requirements.md
__tests__/           # Tests unitarios (proveedores mockeados)
```

---

## Tecnologías

**Node.js 22+** · **pnpm** · **TypeScript 6** · **Multi-proveedor vía `fetch`** (Groq, OpenAI, DeepSeek, Together, Mistral, Ollama, Anthropic) · **zod 4** · **Vitest** · **Biome 2**

---

## GitFlow y protección de ramas

| Rama | Rol | Protección |
|------|-----|------------|
| `main` | Producción. Solo recibe PRs desde `develop`/`hotfix/*` | PR obligatorio, CI requerido, sin force-push |
| `develop` | Integración diaria | CI requerido en cada push |
| `feature/*` | Nacen de `develop`, vuelven a `develop` | — |
| `hotfix/*` | Nacen de `main`, van a `main` y se retroportan a `develop` | — |

---

## Instalación rápida

```bash
git clone <repositorio> && cd ai-agents-typescript
pnpm install
cp .env.example .env   # luego edita tu clave de Groq
```

```env
GROQ_API_KEY_AGENTS=your_groq_api_key_here
```

---

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev -- <agente> [requerimiento]` | Ejecuta un agente de la suite |
| `pnpm dev -- pipeline [requerimiento]` | Pipeline completo PO → UX → Frontend + Backend |
| `pnpm build` / `pnpm start` | Compilar / Ejecutar |
| `pnpm test` / `pnpm test:watch` | Pruebas unitarias (sin red) |
| `pnpm evals` | Suites doradas contra Groq real (consume API) |
| `pnpm lint` / `pnpm lint:fix` / `pnpm format` | Calidad de código con Biome |

---

## Integración continua

El workflow `.github/workflows/ci.yml` ejecuta en cada push/PR a `main`:

1. `pnpm audit --audit-level high` (bloquea vulnerabilidades altas)
2. Biome → Build → Tests unitarios
3. **Evals opcionales**: activar con variable de repositorio `RUN_EVALS=true` + secret `GROQ_API_KEY_AGENTS`

---

## Mejores prácticas

- Preferir métodos `*Structured` cuando el resultado consume otro código
- Activar skills solo donde aporten valor (menos tokens, respuestas más enfocadas)
- Añadir casos dorados al modificar prompts/skills y comparar con `pnpm evals`
- Nunca commitear `.env`; usar `.env.example` como plantilla
