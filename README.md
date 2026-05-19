# Core de Agentes de IA con TypeScript y Node.js

Este proyecto ofrece un núcleo modular para construir, orquestar y escalar agentes de inteligencia artificial con TypeScript. Está diseñado para separar la lógica de negocio de la capa de inferencia, usando una arquitectura basada en principios **SOLID** y una capa de proveedor abstracta.

Actualmente incluye un agente especializado: el **Technical Product Owner Agent**, enfocado en transformar requerimientos de producto en entregables técnicos y artefactos ágiles.

---

## 🏗️ Estructura del Proyecto

```
src/
├── agents/
│   └── TechnicalPO/
│       ├── prompt.ts
│       └── TechnicalPOAgent.ts
├── core/
│   ├── Agent.ts
│   └── LLMProvider.ts
├── types/
│   └── index.ts
└── index.ts
```

| Archivo | Descripción |
|---------|------------|
| `src/core/Agent.ts` | Clase base que maneja el flujo de mensajes y la ejecución del agente |
| `src/core/LLMProvider.ts` | Capa de abstracción para Groq y llamadas al modelo |
| `src/agents/TechnicalPO/` | Agente específico con prompt y lógica de negocio |
| `src/types/index.ts` | Definiciones de tipos para mensajes, configuración y roles |

---

## 🛠️ Tecnologías

- **Node.js** — Runtime con soporte ESM nativo (`type: module`)
- **TypeScript** — 6.0.3 con compilación estricta a `dist/`
- **Groq SDK** — Inferencia de LLM con modelo `llama-3.3-70b-versatile`
- **ESLint + Prettier** — Validación y formateo automático de código
- **Vitest** — Framework de pruebas unitarias

---

## 🚀 Instalación rápida

### 1. Clonar el repositorio

```bash
git clone <repositorio> && cd ai-agents-typescript
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia la plantilla de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` e ingresa tu clave de API de Groq:

```env
GROQ_API_KEY_AGENTS=your_groq_api_key_here
```

> **Nota:** El archivo `.env` no se subirá a git por seguridad.

---

## 💻 Comandos disponibles

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Compila y ejecuta el proyecto |
| `npm run build` | Genera código JavaScript en `dist/` |
| `npm run start` | Ejecuta compilación existente sin recompilar |
| `npm run lint` | Valida código con ESLint |
| `npm run lint:fix` | Corrige automáticamente problemas detectados |
| `npm run format` | Formatea código con Prettier |
| `npm run test` | Ejecuta pruebas unitarias |
| `npm run test:watch` | Ejecuta pruebas en modo observación |

---

## 🎯 Uso: Tu primer agente

El **Technical Product Owner Agent** transforma requerimientos abstractos en historias de usuario estructuradas, especificaciones técnicas y criterios de aceptación.

### Personalizar el requerimiento

Abre `src/index.ts` y modifica la variable `featureRequest`:

```typescript
const featureRequest =
  'Tu requerimiento de producto aquí: [funcionalidad, restricciones técnicas, etc.]';
```

### Ejemplo práctico

```typescript
const featureRequest =
  'Necesito un módulo de autenticación OAuth2 que soporte Google y GitHub, con manejo seguro de JWT y refresh tokens con expiración de 7 días.';

const response = await poAgent.generateUserStory(featureRequest);
console.log(response);
```

### Ejecutar el agente

```bash
npm run dev
```

### Resultado esperado

El agente genera un documento técnico con:

1. **Historia de Usuario** — Formato "Como [rol], Quiero [acción], Para [beneficio]"
2. **Contexto Técnico** — Arquitectura sugerida, patrones, seguridad y buenas prácticas
3. **Criterios de Aceptación** — Escenarios Gherkin (Happy Path + casos borde)
4. **Desglose de Tareas** — Subtareas por capas (Frontend, Backend, BD, Testing)
5. **Estimación** — Story Points en escala Fibonacci con justificación

---

## 🔧 Configuración

- **Rutas de alias** — Se usa `@/` para importaciones limpias (ej: `@/core/Agent.js`)
- **TypeScript** — `tsconfig.json` cubre `src/` para compilación
- **ESLint** — `tsconfig.eslint.json` permite analizar tests y configuraciones
- **Entorno** — `dotenv` carga automáticamente variables desde `.env`

---

## 📌 Mejores prácticas

- ✅ Mantén el prompt y lógica de cada agente separados
- ✅ Usa `.env.example` como plantilla; nunca commits `.env`
- ✅ Ejecuta `npm run lint` antes de cambios importantes
- ✅ Escribe pruebas para nuevos agentes en `__tests__/`
- ✅ Usa rutas con alias `@/` en lugar de rutas relativas

---
