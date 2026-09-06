# Guía de Uso — ai-agents-core

Guía paso a paso para ejecutar, configurar y sacar el máximo provecho a los agentes de IA.

---

## 1. Requisitos previos

- **Node.js 22+** (`node --version` para verificar)
- **pnpm** (incluido con Node vía `corepack enable pnpm`, o instálalo con `npm i -g pnpm`)
- **API key de Groq** (u otro proveedor compatible) — [groq.com](https://console.groq.com)

---

## 2. Instalación y configuración

```bash
git clone https://github.com/EdinsonG/ai-agents-typescript.git
cd ai-agents-typescript
pnpm install
```

Crea tu archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tu clave:

```env
GROQ_API_KEY_AGENTS=gsk_tu_clave_aquí
```

> Nunca commitees `.env`. Está en `.gitignore`.

---

## 3. Primer paso: ejecutar un agente

El punto de entrada es la CLI. Cada agente lee su requerimiento desde un archivo `requirements.md` en la raíz del proyecto.

### 3.1 Crear el archivo requirements.md

Crea `requirements.md` en la raíz del proyecto con el formato de secciones `##`.
Ver [`docs/requirements.example.md`](requirements.example.md) para un ejemplo completo con los 5 agentes.

```md
## po

Necesito un módulo de autenticación con user y password, OAuth2 (Google y GitHub),
JWT con refresh tokens, sesiones en Redis con expiración de 15 minutos.

Criterios de seguridad:
- Validación de inputs con zod
- Rate limiting por usuario (100 req/min)
```

### 3.2 Ejecutar

```bash
pnpm dev -- po
```

La CLI busca la sección `## po` en `requirements.md`, la envía al agente y muestra el resultado.

### 3.3 Agentes disponibles

| Comando | Agente |
|---------|--------|
| `pnpm dev -- po` | Technical Product Owner |
| `pnpm dev -- react` | Frontend React Expert |
| `pnpm dev -- backend` | Backend Node Expert |
| `pnpm dev -- uxui` | UX/UI Design Expert |
| `pnpm dev -- qa` | QA Expert |
| `pnpm dev -- pipeline` | Pipeline completo (PO → UX → Frontend + Backend) |

---

## 4. Escribir buenos requerimientos

La calidad del resultado depende directamente de la calidad del input. Estos son los patrones que funcionan mejor para cada agente:

### PO (`## po`)

```md
## po

Sistema de gestión de inventarios para cadena de tiendas:

- CRUD de productos con categorías, tallas, colores y precios
- Control de stock por sucursal con alertas de stock mínimo
- Registro de entradas y salidas con trazabilidad
- Roles: administrador, gerente de sucursal, operador de almacén
- Autenticación JWT con refresh tokens

Criterios de seguridad:
- Validación de todos los inputs con zod
- Rate limiting por usuario
```

**Tips:** incluye contexto de negocio, restricciones técnicas y criterios de seguridad cuando apliquen.

### React (`## react`)

```md
## react

Dashboard de inventario para gerentes de sucursal:

- Vista de resumen con KPIs: productos con bajo stock, valor total
- Tabla de productos con búsqueda, filtros y paginación
- Formulario de producto con edición en línea
- Modo oscuro y responsive (desktop + tablet)

Stack: React 19, TypeScript, Tailwind v4, App Router.
```

**Tips:** especifica el stack, menciona si hay formularios, animaciones, o i18n.

### Backend (`## backend`)

```md
## backend

API REST para gestión de inventarios:

- Endpoints CRUD para productos, categorías y movimientos
- Autenticación JWT con roles (admin, gerente, operador)
- Paginación y filtrado en listados
- Webhooks para notificar cambios de stock
- Health check y métricas para Prometheus

Base de datos: PostgreSQL 15. Cache: Redis.
```

**Tips:** menciona la base de datos, cache, requisitos de seguridad y observabilidad.

### UX/UI (`## uxui`)

```md
## uxui

Rediseño del módulo de inventario:

Problema actual:
- Tabla con 20 columnas, sin filtros
- Formulario de creación con 30 campos en una página

Objetivos:
- Reducir tiempo de búsqueda de 2 min a 10 seg
- Formulario en 3 pasos: datos → variantes → imágenes
- Accesibilidad WCAG 2.2 AA
```

**Tips:** describe el problema actual, los objetivos medibles y métricas de éxito.

### QA (`## qa`)

```md
## qa

Módulo de checkout con pago con tarjeta:

- Carrito de compras con cantidades
- Formulario de datos de envío
- Pasarela de pago con tarjeta (Stripe)
- Confirmación por email
```

**Tips:** describe el alcance del módulo para que el agente genere un plan de testing completo.

---

## 5. Skills: conocimiento experto inyectable

Las skills son packs de conocimiento especializado que se inyectan al system prompt **solo cuando la petición lo solicita**. Esto mantiene las respuestas enfocadas y ahorra tokens.

### 5.1 Skills disponibles

| Skill | Cuándo usarla |
|-------|---------------|
| `pci-dss` | Pagos, tarjetas, tokenización |
| `wsjf` / `rice` | Priorización de backlog |
| `core-web-vitals` | Performance en React/Next.js |
| `react-server-first` | Decisiones RSC vs Client Components |
| `hexagonal-nestjs` | Arquitectura backend con NestJS |
| `owasp-api-top10` | Seguridad en APIs REST |
| `api-errors-resilience` | Manejo de errores y retries |
| `wcag-forms` | Formularios accesibles |
| `design-tokens-states` | Design tokens y estados de UI |
| `react-hook-form-zod` | Formularios con React Hook Form |
| `zustand-persist` | Estado global con Zustand |
| `next-intl-cookie` | i18n con next-intl por cookie |
| `next-server-cookies` | Cookies de servidor con next/headers |
| `testing-strategies` | Estrategias de testing (unit/E2E/perf) |
| `owasp-testing-guide` | Auditorías de seguridad |
| `api-contract-testing` | Testing de contratos APIs |

### 5.2 Pasar skills a un agente

Las skills se pasan como opción en el segundo argumento:

```ts
const result = await poAgent.generateUserStory(requerimiento, {
  skills: ['pci-dss', 'wsjf'],
});
```

### 5.3 Skills por defecto

Cada agente activa automáticamente sus skills por defecto en métodos de implementación/pruebas/revisión:

| Agente | Skills auto-activadas |
|--------|----------------------|
| Frontend React | `react-hook-form-zod`, `zustand-persist`, `next-intl-cookie`, `next-server-cookies` |
| Backend Node | `hexagonal-nestjs`, `owasp-api-top10`, `api-errors-resilience` |
| UX/UI | `wcag-forms`, `design-tokens-states` |
| QA Expert | `testing-strategies`, `owasp-testing-guide`, `api-contract-testing` |
| Technical PO | Sin defaults (skills situacionales) |

### 5.4 Crear una skill personalizada

```ts
import { skillRegistry } from 'ai-agents-core';
import type { Skill } from 'ai-agents-core';

const mySkill: Skill = {
  id: 'mi-skill',
  name: 'Mi Skill Custom',
  description: 'Describe qué hace esta skill',
  instructions: `
    Instrucciones detalladas que se inyectan al system prompt.
    Sé específico: define reglas, patrones y anti-patrones.
  `,
};

skillRegistry.register(mySkill);

// Ahora úsala
await agent.execute('tarea', { skills: ['mi-skill'] });
```

---

## 6. Salidas estructuradas

Los métodos `*Structured` devuelven objetos TypeScript validados con zod en lugar de texto libre. Úsalos cuando el resultado alimente otro código.

### PO — UserStoryDeliverable

```ts
const story = await poAgent.generateUserStoryStructured('login con OAuth2');

story.title;                    // "Autenticación con OAuth2"
story.userStory.asA;            // "como usuario"
story.userStory.iWant;          // "quiero autenticarme con OAuth2"
story.userStory.soThat;         // "para acceder sin crear contraseña"
story.acceptanceCriteria[0];    // { scenario, given, when, then }
story.tasks[0];                 // { area: 'backend', description: '...' }
story.estimation.storyPoints;   // 1 | 2 | 3 | 5 | 8
```

### React — FrontendImplementationPlan

```ts
const plan = await reactAgent.implementFeatureStructured('dashboard de inventario');

plan.analysis[0];               // "Análisis de requerimientos..."
plan.components[0];             // { name, kind: 'server'|'client', responsibility }
plan.stateAndDataStrategy;      // { stateDecision, persistenceDetails, justification }
plan.formHandling;              // { hasForms, strategy, schemaLocation }
plan.tasks[0];                  // { area: 'components', description: '...' }
plan.storyPoints;               // 1 | 2 | 3 | 5 | 8
```

### Backend — ApiDesign

```ts
const api = await backendAgent.designApiStructured('API de inventario');

api.frameworkDecision;          // { framework: 'nestjs'|'express', justification }
api.endpoints[0];               // { method, path, purpose, authRequired, statusCodes }
api.dataModel[0];               // { entity, fields: [{ name, type, indexed }] }
api.securityMeasures[0];        // "Rate limiting por identidad+IP"
api.tasks[0];                   // { area: 'endpoints', description: '...' }
```

### UX/UI — DesignSpec

```ts
const design = await uxuiAgent.designSolutionStructured('rediseño de checkout');

design.uxAnalysis[0];           // "Análisis del estado actual..."
design.wireframeAscii;          // Wireframe en ASCII art
design.designTokens.colors[0];  // { name, hex, usage, contrastRatio }
design.components[0];           // { name, variants: [...], states: [...] }
design.accessibilityChecklist[0]; // "Labels asociados a cada input"
design.interfaceStates[0];      // "Estado vacío de la tabla"
```

### QA — TestPlan, CodeReview, BugBash

```ts
const plan = await qaAgent.createTestPlanStructured('módulo de checkout');
plan.strategies[0];             // { type: 'unit'|'integration'|'e2e'|..., scope, tools, priority }
plan.testCases[0];              // { id, name, type, precondition, steps, expectedResult, priority }
plan.coverageGoals;             // { statements: 80, branches: 75, functions: 90 }

const review = await qaAgent.reviewCodeStructured(codigoFuente);
review.issues[0];               // { severity, category, file, line, description, suggestion }
review.verdict;                 // 'approve' | 'request-changes' | 'needs-discussion'
review.overallScore;            // 1-10

const bugs = await qaAgent.bugBashStructured(descripcion);
bugs.bugs[0];                   // { severity, category, title, stepsToReproduce, expectedBehavior, actualBehavior }
```

---

## 7. Pipeline multi-agente

El pipeline ejecuta la suite completa: un requerimiento entra y sale el paquete de entregables de todos los roles.

### 7.1 Desde la CLI

```bash
pnpm dev -- pipeline "Checkout con pago con tarjeta"
```

### 7.2 Programáticamente

```ts
import {
  TechnicalPOAgent,
  UXUIAgent,
  FrontendReactAgent,
  BackendNodeAgent,
  ProductDeliveryPipeline,
} from 'ai-agents-core';

const apiKey = process.env.GROQ_API_KEY_AGENTS!;

const pipeline = new ProductDeliveryPipeline(
  new TechnicalPOAgent(apiKey),
  new UXUIAgent(apiKey),
  new FrontendReactAgent(apiKey),
  new BackendNodeAgent(apiKey),
);

const delivery = await pipeline.run('Checkout con pago con tarjeta', {
  stages: {
    uxui: true,       // incluir diseño UX
    frontend: true,   // incluir plan frontend
    backend: true,    // incluir diseño backend
  },
  skills: {
    po: ['pci-dss'],           // skills para la etapa PO
    uxui: ['wcag-forms'],      // skills para UX/UI
    frontend: ['core-web-vitals'],
    backend: ['owasp-api-top10'],
  },
});

// Resultado
delivery.story;             // UserStoryDeliverable
delivery.design;            // DesignSpec (undefined si stages.uxui = false)
delivery.frontend;          // FrontendImplementationPlan
delivery.api;               // ApiDesign
delivery.stageTimingsMs;    // { po: 12000, uxui: 15000, frontend: 18000, backend: 16000 }
```

### 7.3 Flujo del pipeline

```
requerimiento → PO (historia estructurada)
                    ↓ brief
              UX/UI (spec de diseño)
                    ↓ brief            ↓ brief
        Frontend React (plan)    Backend Node (API design)   ← en paralelo
```

Frontend y Backend se ejecutan en paralelo. Si uno falla, el otro continúa.

---

## 8. Uso programático (librería)

### 8.1 Crear un agente

```ts
import { TechnicalPOAgent } from 'ai-agents-core';

const agent = new TechnicalPOAgent(apiKey);
```

### 8.2 Ejecución libre (texto)

```ts
const result = await agent.execute('Crear historias de usuario para un carrito de compras');
console.log(result); // string con la respuesta
```

### 8.3 Ejecución multi-turno

```ts
const agent = new FrontendReactAgent(apiKey);

// Turno 1
await agent.execute('Crea un componente Button');

// Turno 2 — el agente recuerda el contexto anterior
await agent.execute('Agrédale estado de loading');

// Exportar sesión
const session = agent.exportSession();
console.log(session.history); // array de mensajes
```

### 8.4 Inyectar provider custom

```ts
import { LLMProvider, FrontendReactAgent, KNOWN_BASE_URLS } from 'ai-agents-core';

// Usar OpenAI en lugar de Groq
const provider = new LLMProvider({
  apiKey: openaiKey,
  model: 'gpt-4o',
  baseUrl: KNOWN_BASE_URLS.openai,
});

const agent = new FrontendReactAgent(apiKey, 'gpt-4o', provider);
```

### 8.5 Registrar tools personalizadas

```ts
import { BackendNodeAgent, type Tool } from 'ai-agents-core';
import { z } from 'zod';

const searchTool: Tool<{ query: string }> = {
  name: 'search_docs',
  description: 'Buscar en documentación técnica',
  parameters: z.object({
    query: z.string().describe('Término de búsqueda'),
  }),
  execute: async (params) => {
    return `Resultados para "${params.query}": ...`;
  },
};

const agent = new BackendNodeAgent(apiKey);
agent.tools.register(searchTool);

const result = await agent.execute('Busca cómo configurar connection pooling');
```

---

## 9. Autocrítica (CritiqueRunner)

Para entregables críticos, CritiqueRunner ejecuta el bucle **generar → juzgar → revisar**.

```ts
import { CritiqueRunner, LLMJudge, TechnicalPOAgent } from 'ai-agents-core';

const judge = new LLMJudge(apiKey);
const runner = new CritiqueRunner(judge);
const poAgent = new TechnicalPOAgent(apiKey);

const result = await runner.run(poAgent, 'Módulo de pagos con Stripe', {
  rubric: [
    {
      id: 'seguridad-concreta',
      requirement: 'Menciona medidas de seguridad accionables, no genéricas',
    },
    {
      id: 'criterios-gherkin',
      requirement: 'Incluye al menos 2 escenarios Gherkin (Dado/Cuando/Entonces)',
    },
    {
      id: 'tareas-por-capas',
      requirement: 'Desglosa tareas diferenciadas por capas (frontend/backend/testing)',
    },
  ],
  threshold: 85,        // umbral mínimo de calidad (default: 80)
  skills: ['pci-dss'],  // skills a inyectar
});

result.output;       // mejor versión (original o revisada)
result.finalScore;   // puntuación final 0-100
result.revised;      // true si hubo revisión
result.verdicts;     // veredictos por criterio
```

**Costo:** hasta 2 llamadas del agente + 2 del juez por ejecución. Úsalo para entregables críticos.

---

## 10. Evaluaciones (evals)

El harness de evals valida la calidad de los agentes contra casos dorados.

### 10.1 Correr evals

```bash
pnpm evals
```

- Consume API de Groq real (no mocks)
- Exit code ≠ 0 si algún caso queda bajo su umbral → listo para CI
- Por defecto ejecuta las 5 suites: PO, React, Backend, UX/UI, QA

### 10.2 Correr una suite específica

```bash
pnpm evals -- --suite "Backend"
```

### 10.3 Agregar un caso dorado

Crea o edita un archivo en `src/evals/golden/`:

```ts
import type { EvalCase } from '@/types/index.js';

export const MY_CASES: EvalCase[] = [
  {
    id: 'mi-caso-descriptivo',
    input: 'Descripción del requerimiento de prueba',
    skills: ['pci-dss'],           // skills a inyectar (opcional)
    threshold: 70,                 // umbral mínimo (default: 70)
    rubric: [
      {
        id: 'criterio-1',
        requirement: 'Descripción del criterio (más de 20 caracteres)',
      },
      {
        id: 'criterio-2',
        requirement: 'Otro criterio verificable',
      },
    ],
    deterministicChecks: [         // checks gratuitos sin LLM (opcional)
      {
        name: 'contiene palabra clave',
        test: (output) => output.toLowerCase().includes('seguridad'),
      },
    ],
  },
];
```

Luego impórtalo en el CLI de evals (`src/evals/cli.ts`) y agrégalo al array `SUITES`.

---

## 11. Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `GROQ_API_KEY_AGENTS` | — | API key de Groq (requerida) |
| `AI_AGENT_DEFAULT_MODEL` | `llama-3.3-70b-versatile` | Modelo por defecto |
| `AI_AGENT_DEFAULT_TEMPERATURE` | `2` (= 0.2) | Temperature (dividir entre 10) |
| `AI_AGENT_MAX_RETRIES` | `3` | Reintentos ante errores transitorios |
| `AI_AGENT_BASE_DELAY_MS` | `500` | Delay base para backoff exponencial |
| `AI_AGENT_MAX_DELAY_MS` | `8000` | Delay máximo para backoff |
| `AI_AGENT_TIMEOUT_MS` | `60000` | Timeout por intento (ms) |
| `AI_AGENT_MAX_CONTEXT_TOKENS` | `32000` | Presupuesto de tokens por contexto |
| `AI_AGENT_MAX_INPUT_LENGTH` | `10000` | Límite de caracteres en input |
| `AI_AGENT_MAX_REVISIONS` | `2` | Máximo de revisiones en autocrítica |
| `AI_AGENT_PIPELINE_STAGE_TIMEOUT_MS` | `120000` | Timeout por etapa del pipeline |

---

## 12. Solución de problemas

### "Error: No se encontró el archivo requirements.md"

Crea `requirements.md` en la raíz del proyecto con las secciones `## po`, `## react`, etc.

### "Error: La variable de entorno GROQ_API_KEY_AGENTS no está configurada"

Asegúrate de que `.env` exista en la raíz y contenga tu API key.

### "Error: Agente desconocido"

Verifica el ID: `po`, `react`, `backend`, `uxui`, `qa`, o `pipeline`.

### "StructuredOutputError"

El modelo devolvió JSON inválido. El sistema reintenta una vez con feedback del error. Si persiste, simplifica el requerimiento o intenta con otro modelo.

### El agente responde en inglés

Los prompts del sistema están en español. Si responde en inglés, agrega explícitamente "Responde en español" al requerimiento.

### Timeout en el pipeline

Cada etapa tiene un timeout de 120s por defecto. Aumenta con `AI_AGENT_PIPELINE_STAGE_TIMEOUT_MS=180000`.

---

## 13. Comandos rápidos de referencia

| Comando | Qué hace |
|---------|----------|
| `pnpm dev -- po` | Ejecuta el agente PO con su sección de requirements.md |
| `pnpm dev -- react` | Ejecuta el agente React |
| `pnpm dev -- backend` | Ejecuta el agente Backend |
| `pnpm dev -- uxui` | Ejecuta el agente UX/UI |
| `pnpm dev -- qa` | Ejecuta el agente QA |
| `pnpm dev -- pipeline` | Ejecuta el pipeline completo |
| `pnpm build` | Compila a `dist/` |
| `pnpm start` | Ejecuta la compilación |
| `pnpm test` | Tests unitarios (sin red) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm evals` | Evalúa los agentes contra casos dorados |
| `pnpm lint` | Verifica código con Biome |
| `pnpm lint:fix` | Corrige problemas automáticamente |
| `pnpm format` | Formatea el código |
| `pnpm docs` | Genera documentación API con TypeDoc |
