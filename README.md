# Core Multi-Agente de IA — TypeScript + Groq

Núcleo modular para construir, orquestar y escalar agentes de inteligencia artificial con TypeScript. Separa la lógica de negocio de la capa de inferencia mediante arquitectura basada en **SOLID**, inyección de dependencias y un proveedor LLM con resiliencia de producción.

Incluye una suite de **5 agentes expertos** especializados en roles reales de desarrollo de software, con **skills componibles**, **salidas estructuradas validadas** y un **harness de evaluación** medible.

---

## 🤖 Agentes disponibles

| Agente | Id | Métodos principales | Especialidad |
|--------|-----|---------------------|--------------|
| Technical Product Owner | `po` | `generateUserStory`, `generateUserStoryStructured` | Backlog, historias INVEST, Gherkin, priorización |
| Frontend React Expert | `react` | `implementFeature(Structured)`, `generateUnitTests`, `reviewCode` | React 19, App Router, RSC/CC, Tailwind v4, Motion · Formularios con **React Hook Form + zod** · Estado/persistencia con **Zustand** · i18n con **next-intl por cookie** (sin prefijo de URL) · Cookies servidor vía **next/headers** |
| Frontend Angular Expert | `angular` | `implementFeature(Structured)`, `generateUnitTests`, `reviewCode` | Angular 19+, signals, standalone + OnPush, @if/@for/@defer |
| Backend Node Expert | `backend` | `designApi(Structured)`, `generateUnitTests`, `reviewCode` | NestJS/Express, arquitectura hexagonal, OWASP API Top 10 |
| UX/UI Design Expert | `uxui` | `designSolution(Structured)` | Design tokens, WCAG 2.2 AA, estados de UI completos |

### Ejecutar desde la terminal

```bash
pnpm dev -- po "Requerimiento opcional; si se omite se usa uno por defecto por agente"
pnpm dev -- react
```

---

## 🧩 Núcleo (`src/core/`)

| Módulo | Responsabilidad |
|--------|-----------------|
| `Agent.ts` | Clase base abstracta: memoria de conversación, ejecución libre y estructurada, inyección de skills al system prompt, presupuesto de tokens |
| `LLMProvider.ts` | Capa de inferencia Groq con **retries + backoff exponencial + jitter**, timeout por intento y política propia (el SDK no reintenta) |
| `SkillRegistry.ts` | Registro central de skills expertas activables por petición |
| `tokens.ts` | Estimación aproximada de tokens y truncado del historial respetando el presupuesto (nunca muta la memoria interna) |
| `errors.ts` | `LLMProviderError` tipada: `rate_limit · auth · bad_request · timeout · server · network` con flag `retryable`; `StructuredOutputError` para salidas inválidas |
| `json.ts` | Parser JSON tolerante (cercos de código, texto circundante) |

### Fiabilidad incluida

```ts
new LLMProvider({
  apiKey,
  model: 'llama-3.3-70b-versatile',
  resilience: { maxRetries: 3, baseDelayMs: 500, maxDelayMs: 8000, timeoutMs: 60_000 },
});
```

- Reintenta solo errores transitorios (429/408/5xx/red); `auth` y `bad_request` fallan de inmediato.
- Presupuesto de contexto por agente (`maxContextTokens`, default 8000): conserva el system prompt, descarta los mensajes más antiguos y nunca el último.

---

## 🎓 Skills componibles (`src/skills/`)

Packs de conocimiento experto que se inyectan **solo en la petición** que los solicita:

| Id | Dominio |
|----|---------|
| `pci-dss` | Pagos: tokenización, scope reduction, SCA/3DS |
| `wsjf`, `rice` | Priorización de backlog cuantitativa |
| `core-web-vitals` | Presupuestos LCP/INP/CLS en React/Next |
| `react-server-first` | Disciplina RSC vs Client Components, Server Actions |
| `angular-signals` | Patrones idiomáticos de signals |
| `hexagonal-nestjs` | Puertos/adaptadores con dominio puro |
| `owasp-api-top10` | Checklist de mitigaciones por amenaza |
| `wcag-forms` | Formularios accesibles verificables |

```ts
await po.generateUserStory(requerimiento, { skills: ['pci-dss', 'wsjf'] });
```

Una skill desconocida lanza error listando las disponibles. Agregar una nueva = crear el objeto `Skill` y registrarlo.

---

## 📦 Salidas estructuradas

Cada agente expone métodos `*Structured` que devuelven objetos TypeScript validados con zod (no texto libre):

```ts
const story = await po.generateUserStoryStructured('login con OAuth2');
story.estimation.storyPoints;   // 1 | 2 | 3 | 5 | 8 — garantizado por esquema
story.acceptanceCriteria[0];    // { scenario, given, when, then }
```

Cómo funciona:
1. El esquema zod se convierte a JSON Schema y se solicita salida nativa `json_schema` a Groq.
2. Si la respuesta no valida, se reintenta una vez inyectando feedback del error al modelo.
3. Tras agotar intentos: `StructuredOutputError` con `lastRawOutput` para depurar.

---

## 🧪 Generación de pruebas unitarias

Los agentes de **React**, **Angular** y **Backend** generan suites de pruebas completas como entregable estructurado (`UnitTestSuite`): archivos de test ejecutables, librerías requeridas, comandos para correrlos y foco de cobertura.

```ts
const suite = await reactAgent.generateUnitTests('Componente TaskCard con drag & drop');
suite.testFiles[0].path;    // src/components/TaskCard.test.tsx
suite.testFiles[0].code;    // código completo listo para guardar y ejecutar
suite.runCommands;          // ['pnpm vitest run src/components/TaskCard.test.tsx']
```

Stack por especialidad: React (Vitest + Testing Library), Angular (Vitest/Jest + TestBed + HttpTestingController), Backend (Vitest/Jest + Supertest contra app factory, con casos 400/404/409).

---

## 📊 Evaluación de calidad (`src/evals/`)

Harness de evals reproducible: casos dorados + juez LLM (temperatura 0, salida validada por esquema) + checks deterministas gratuitos.

```bash
pnpm evals
# exit code ≠ 0 si algún caso queda bajo su umbral → listo para CI
```

- Rúbricas con criterios verificables (ej. detecta si el agente infla estimaciones o da seguridad genérica).
- **Las 5 suites de agentes tienen cobertura**: PO (2 casos), React, Angular, Backend y UX/UI.
- Reporte por caso con puntuación 0-100%, veredictos por criterio y justificaciones.
- Nuevos casos: agregar un objeto `EvalCase` en `src/evals/golden/`.

---

## 🔗 Orquestación multi-agente (`src/orchestration/`)

`ProductDeliveryPipeline` encadena la suite completa: un requerimiento entra y sale el paquete de entregables de todos los roles.

```
requerimiento → PO (historia estructurada)
                    ↓ brief
              UX/UI (spec de diseño)
                    ↓ brief            ↓ brief
        Frontend React (plan)    Backend Node (API design)   ← en paralelo
```

Cada etapa recibe un *brief* generado a partir de los entregables estructurados previos: el frontend recibe historia + tareas + tokens/colores/estados del diseño; el backend recibe los requisitos de seguridad y tareas de datos.

```ts
const pipeline = new ProductDeliveryPipeline(poAgent, uxuiAgent, reactAgent, backendAgent);
const delivery = await pipeline.run('Checkout con pago con tarjeta', {
  stages: { uxui: true, frontend: true, backend: true }, // etapas opcionales
  skills: { po: ['pci-dss'] },                            // skills por etapa
});
delivery.story;             // UserStoryDeliverable
delivery.design;            // DesignSpec
delivery.frontend;          // FrontendImplementationPlan
delivery.api;               // ApiDesign
delivery.stageTimingsMs;    // duración por etapa
```

Desde la terminal:

```bash
pnpm dev -- pipeline "Checkout con pago con tarjeta"
```

---

## 🏗️ Estructura del proyecto

```
src/
├── agents/
│   ├── index.ts              # Barrel + fábrica createAgent(id)
│   ├── TechnicalPO/          # prompt · schema · agent
│   ├── FrontendReact/
│   ├── FrontendAngular/
│   ├── BackendNode/
│   └── UXUI/
├── core/                     # Agent · LLMProvider · Skills · tokens · errors
├── skills/                   # 9 skills expertas + registro global
├── orchestration/            # Pipeline PO → UX → Frontend/Backend + briefs
├── evals/                    # judge · runner · reporter · golden cases · cli
├── types/
└── index.ts                  # Demo CLI multi-agente y pipeline
__tests__/                    # 67 tests unitarios (proveedor mockeado)
.github/workflows/ci.yml      # Biome · Build · Tests (+ Evals opcionales)
```

**Agregar un sexto agente:** carpeta con `prompt.ts` + `schema.ts` + clase que extienda `Agent`, y una entrada en `src/agents/index.ts`.

---

## 🛠️ Tecnologías

- **Node.js 20+** — Runtime ESM nativo (`type: module`)
- **pnpm** — Gestor de paquetes rápido y eficiente en disco
- **TypeScript 6** — Compilación estricta a `dist/` con alias `@/*`
- **Groq SDK** — Inferencia `llama-3.3-70b-versatile` con salidas estructuradas
- **zod 4** — Esquemas de validación y conversión a JSON Schema
- **Vitest** — Pruebas unitarias sin red (proveedores mockeados)
- **Biome 2** — Linting y formateo en una sola herramienta ultrarrápida

---

## 🚀 Instalación rápida

Requiere pnpm (incluido con Node vía `corepack enable pnpm`, o instálalo con `npm i -g pnpm`).

```bash
git clone <repositorio> && cd ai-agents-typescript
pnpm install
cp .env.example .env   # luego edita tu clave de Groq
```

Variables de entorno (`.env`, nunca se commitea):

```env
GROQ_API_KEY_AGENTS=your_groq_api_key_here
```

---

## 💻 Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev -- <agente> [requerimiento]` | Compila y ejecuta un agente de la suite |
| `pnpm dev -- pipeline [requerimiento]` | Ejecuta el pipeline completo PO → UX → Frontend + Backend |
| `pnpm build` | Genera JavaScript en `dist/` |
| `pnpm start` | Ejecuta compilación existente |
| `pnpm test` / `pnpm test:watch` | Pruebas unitarias (sin red) |
| `pnpm evals` | Suites doradas de los 5 agentes contra Groq real (consume API) |
| `pnpm lint` / `pnpm lint:fix` / `pnpm format` | Calidad de código con Biome |

---

## 🔄 Integración continua

El workflow `.github/workflows/ci.yml` ejecuta en cada push/PR a `main`:

1. `pnpm audit --audit-level high` (bloquea vulnerabilidades altas)
2. Biome → Build → Tests unitarios
3. **Evals opcionales**: se activan creando la variable de repositorio `RUN_EVALS=true` y el secret `GROQ_API_KEY_AGENTS`. Consumen API de Groq, por eso están detrás de un flag.

---

## 📌 Mejores prácticas

- ✅ Prompt y lógica de cada agente separados en su carpeta
- ✅ Preferir los métodos `*Structured` cuando el resultado lo consume otro código
- ✅ Activar skills solo donde aporten valor (menos tokens, respuestas más enfocadas)
- ✅ Añadir casos dorados al modificar prompts/skills y comparar con `pnpm evals`
- ✅ Nunca commitear `.env`; usar `.env.example` como plantilla
