# Core Multi-Agente de IA — TypeScript + Groq

Núcleo modular para construir, orquestar y escalar agentes de inteligencia artificial con TypeScript. Separa la lógica de negocio de la capa de inferencia mediante arquitectura basada en **SOLID**, inyección de dependencias y un proveedor LLM con resiliencia de producción.

Incluye una suite de **4 agentes expertos** especializados en roles reales de desarrollo de software, con **skills componibles**, **salidas estructuradas validadas** y un **harness de evaluación** medible.

---

## Agentes disponibles

| Agente | Id | Métodos principales | Especialidad |
|--------|-----|---------------------|--------------|
| Technical Product Owner | `po` | `generateUserStory`, `generateUserStoryStructured` | Backlog, historias INVEST, Gherkin, priorización |
| Frontend React Expert | `react` | `implementFeature(Structured)`, `generateUnitTests`, `reviewCode` | React 19, App Router, RSC/CC, Tailwind v4, Motion · Formularios con **React Hook Form + zod** · Estado/persistencia con **Zustand** · i18n con **next-intl por cookie** (sin prefijo de URL) · Cookies servidor vía **next/headers** |
| Backend Node Expert | `backend` | `designApi(Structured)`, `generateUnitTests`, `reviewCode` | NestJS/Express, arquitectura hexagonal, OWASP API Top 10 |
| UX/UI Design Expert | `uxui` | `designSolution(Structured)` | Design tokens, WCAG 2.2 AA, estados de UI completos |

### Ejecutar desde la terminal

```bash
pnpm dev -- po "Requerimiento opcional; si se omite se usa uno por defecto por agente"
pnpm dev -- react
```

---

## Núcleo (`src/core/`)

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

### Cualquier proveedor de modelos

El núcleo no depende de ningún SDK: la inferencia va sobre `InferenceClient`, un contrato que puedes implementar para integrar lo que quieras.

```ts
// 1. Cualquier endpoint OpenAI-compatible (Groq es el default)
new LLMProvider({ apiKey, model: 'llama-3.3-70b-versatile' });                        // Groq
new LLMProvider({ apiKey, model: 'gpt-4o', baseUrl: KNOWN_BASE_URLS.openai });        // OpenAI
new LLMProvider({ apiKey, model: 'deepseek-chat', baseUrl: KNOWN_BASE_URLS.deepseek });// DeepSeek
new LLMProvider({ apiKey: 'ollama', model: 'llama3.1', baseUrl: KNOWN_BASE_URLS.ollama }); // Local

// 2. Anthropic (protocolo Messages, json_schema traducido a prompt)
new LLMProvider({ apiKey, model: 'claude-sonnet-4-5', provider: 'anthropic' });

// 3. Tu propio cliente (escape total)
new LLMProvider({ apiKey, model: 'mi-modelo', client: miInferenceClient });

// Los agentes aceptan lo mismo:
new FrontendReactAgent(apiKey, model, undefined, { baseUrl: KNOWN_BASE_URLS.openai, provider: 'openai-compatible' });
```

`KNOWN_BASE_URLS` (src/core/clients) incluye Groq, OpenAI, DeepSeek, Together, Mistral, Ollama y Anthropic. La resiliencia, observabilidad y salidas estructuradas funcionan igual con todos.

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
| `wcag-forms` | Formularios accesibles verificables |
| `design-tokens-states` | Tokens con contraste verificado y estados completos por componente |
| `react-hook-form-zod` | Formularios con react-hook-form + zodResolver, esquemas compartidos |
| `zustand-persist` | Stores Zustand por feature con persistencia segura |
| `next-intl-cookie` | i18n next-intl por cookie `NEXT_LOCALE`, sin prefijo de URL |
| `next-server-cookies` | Cookies de servidor vía next/headers con opciones seguras |

Las skills viven en un **registro global centralizado** compartido por todos los agentes: cualquier agente puede activar cualquier skill (ej. el agente React usa `core-web-vitals`; UX/UI y React comparten `wcag-forms`) sin duplicar definiciones.

**Skills por defecto por agente** — se activan automáticamente en los métodos de implementación/pruebas/revisión (no en llamadas ligeras), para no gravar el system prompt:

| Agente | Skills auto-activadas |
|--------|----------------------|
| Frontend React | `react-hook-form-zod`, `zustand-persist`, `next-intl-cookie`, `next-server-cookies` |
| Backend Node | `hexagonal-nestjs`, `owasp-api-top10`, `api-errors-resilience` |
| UX/UI | `wcag-forms`, `design-tokens-states` |
| Technical PO | Sin defaults: sus skills (`wsjf`, `rice`, `pci-dss`) son situacionales y se piden explícitas |

```ts
await po.generateUserStory(requerimiento, { skills: ['pci-dss', 'wsjf'] });
```

Una skill desconocida lanza error listando las disponibles. Agregar una nueva = crear el objeto `Skill` y registrarlo.

---

## Salidas estructuradas

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

## Generación de pruebas unitarias

Los agentes de **React** y **Backend** generan suites de pruebas completas como entregable estructurado (`UnitTestSuite`): archivos de test ejecutables, librerías requeridas, comandos para correrlos y foco de cobertura.

```ts
const suite = await reactAgent.generateUnitTests('Componente TaskCard con drag & drop');
suite.testFiles[0].path;    // src/components/TaskCard.test.tsx
suite.testFiles[0].code;    // código completo listo para guardar y ejecutar
suite.runCommands;          // ['pnpm vitest run src/components/TaskCard.test.tsx']
```

Stack por especialidad: React (Vitest + Testing Library), Backend (Vitest/Jest + Supertest contra app factory, con casos 400/404/409).

---

## Autocrítica opt-in (`src/critique/`)

`CritiqueRunner` reutiliza el `LLMJudge` para el bucle **generar → juzgar → revisar**: genera con el agente, puntúa la salida contra tu rúbrica y, si queda bajo el umbral (default 80%), pide una revisión con el feedback de los veredictos. Devuelve siempre la mejor de las dos salidas.

```ts
const runner = new CritiqueRunner(new LLMJudge(apiKey));
const result = await runner.run(poAgent, requerimiento, {
  rubric: [
    { id: 'seguridad-concreta', requirement: 'Menciona medidas accionables, no genéricas' },
    { id: 'criterios-gherkin', requirement: '≥2 escenarios Dado/Cuando/Entonces' },
  ],
  threshold: 85,
  skills: ['pci-dss'],
});
result.output;       // mejor versión (original o revisada)
result.finalScore;   // puntuación final 0-100
result.revised;      // ¿hubo revisión?
```

Costo: hasta 2 llamadas del agente + 2 del juez por ejecución — úsalo en entregables críticos.

---

## Evaluación de calidad (`src/evals/`)

Harness de evals reproducible: casos dorados + juez LLM (temperatura 0, salida validada por esquema) + checks deterministas gratuitos.

```bash
pnpm evals
# exit code ≠ 0 si algún caso queda bajo su umbral → listo para CI
```

- Rúbricas con criterios verificables (ej. detecta si el agente infla estimaciones o da seguridad genérica).
- **Las 4 suites de agentes tienen cobertura**: PO, React, Backend y UX/UI.
- Reporte por caso con puntuación 0-100%, veredictos por criterio y justificaciones.
- Nuevos casos: agregar un objeto `EvalCase` en `src/evals/golden/`.

---

## Orquestación multi-agente (`src/orchestration/`)

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

## Estructura del proyecto

```
src/
├── agents/
│   ├── index.ts              # Barrel + fábrica createAgent(id)
│   ├── TechnicalPO/          # prompt · schema · agent
│   ├── FrontendReact/
│   ├── BackendNode/
│   └── UXUI/
├── core/                     # Agent · LLMProvider · Skills · tokens · errors
├── skills/                   # Skills expertas + registro global
├── types/                    # Contratos centralizados por dominio + barrel index.ts
├── orchestration/            # Pipeline PO → UX → Frontend/Backend + briefs
├── evals/                    # judge · runner · reporter · golden cases · cli
├── cli.ts                    # CLI que lee requirements.md
__tests__/                    # Tests unitarios (proveedores mockeados)
.github/workflows/ci.yml     # Biome · Build · Tests (+ Evals opcionales)
```

**Contratos de tipos:** todos centralizados en `src/types/` por dominio (`agent`, `llm`, `skill`, `tool`, `evals`, `testing`, `deliverables`, `orchestration`, `observability`, `critique`) y exportados desde `src/types/index.ts`. Importa siempre desde ahí:

```ts
import type { ChatMessage, Skill, EvalCase, UserStoryDeliverable } from '@/types/index.js';
```

---

## Tecnologías

- **Node.js 20+** — Runtime ESM nativo (`type: module`)
- **pnpm** — Gestor de paquetes rápido y eficiente en disco
- **TypeScript 6** — Compilación estricta a `dist/` con alias `@/*`
- **Multi-proveedor vía `fetch`** — Sin SDKs: Groq, OpenAI, DeepSeek, Together, Mistral, Ollama, Anthropic o cualquier endpoint
- **zod 4** — Esquemas de validación y conversión a JSON Schema
- **Vitest** — Pruebas unitarias sin red (proveedores mockeados)
- **Biome 2** — Linting y formateo en una sola herramienta ultrarrápida

---

## GitFlow y protección de ramas

| Rama | Rol | Protección |
|------|-----|------------|
| `main` | Producción. Solo recibe PRs desde `develop` (u `hotfix/*`). Se etiqueta con `v1.x.x` | PR obligatorio (sin push directo, aplica a admin), CI `Lint · Build · Tests` requerido, sin force-push ni borrado |
| `develop` | Integración. Trabajo diario | CI requerido en cada push, sin force-push ni borrado |
| `feature/*` | Cortas, nacen de `develop`, vuelven a `develop` | — |
| `hotfix/*` | Nacen de `main`, van a `main` y se retroportan a `develop` | — |

```bash
# Flujo diario
git switch develop && git switch -c feature/mi-cambio
git push -u origin feature/mi-cambio        # CI corre en el push
# PR feature/mi-cambio → develop (merge cuando CI esté verde)

# Liberar: PR develop → main, luego
git tag v1.x.x && git push origin v1.x.x    # sobre main tras el merge
```

---

## Instalación rápida

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

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev -- <agente> [requerimiento]` | Compila y ejecuta un agente de la suite |
| `pnpm dev -- pipeline [requerimiento]` | Ejecuta el pipeline completo PO → UX → Frontend + Backend |
| `pnpm build` | Genera JavaScript en `dist/` |
| `pnpm start` | Ejecuta compilación existente |
| `pnpm test` / `pnpm test:watch` | Pruebas unitarias (sin red) |
| `pnpm evals` | Suites doradas de los 4 agentes contra Groq real (consume API) |
| `pnpm lint` / `pnpm lint:fix` / `pnpm format` | Calidad de código con Biome |

---

## Integración continua

El workflow `.github/workflows/ci.yml` ejecuta en cada push/PR a `main`:

1. `pnpm audit --audit-level high` (bloquea vulnerabilidades altas)
2. Biome → Build → Tests unitarios
3. **Evals opcionales**: se activan creando la variable de repositorio `RUN_EVALS=true` y el secret `GROQ_API_KEY_AGENTS`. Consumen API de Groq, por eso están detrás de un flag.

---

## Mejores prácticas

- Prompt y lógica de cada agente separados en su carpeta
- Preferir los métodos `*Structured` cuando el resultado lo consume otro código
- Activar skills solo donde aporten valor (menos tokens, respuestas más enfocadas)
- Añadir casos dorados al modificar prompts/skills y comparar con `pnpm evals`
- Nunca commitear `.env`; usar `.env.example` como plantilla
