import { describe, expect, it } from 'vitest';
import { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
import { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import { ProductDeliveryPipeline } from '@/orchestration/pipeline.js';
import type { ChatMessage, GenerateCompletionOptions } from '@/types/index.js';

const STORY_JSON = JSON.stringify({
  title: 'Autenticación OAuth2',
  userStory: { asA: 'usuario', iWant: 'iniciar sesión', soThat: 'acceder a mi cuenta' },
  technicalContext: {
    componentization: 'Componente LoginForm',
    cleanCodeAndStateManagement: 'Hook useAuth',
    securityCompliance: 'Rate-limiting y sanitización con zod',
  },
  acceptanceCriteria: [
    {
      scenario: 'Login exitoso',
      given: 'credenciales válidas',
      when: 'envía formulario',
      then: 'recibe JWT',
    },
    {
      scenario: 'Credenciales inválidas',
      given: 'password incorrecta',
      when: 'envía formulario',
      then: 'error 401',
    },
  ],
  tasks: [
    { area: 'frontend', description: 'LoginForm con validación' },
    { area: 'backend', description: 'POST /auth/login' },
    { area: 'database', description: 'índice en users.email' },
    { area: 'testing', description: 'tests de integración' },
  ],
  estimation: { storyPoints: 3, justification: 'complejidad media' },
});

const DESIGN_JSON = JSON.stringify({
  uxAnalysis: ['usuarios móviles', 'flujo actual confuso'],
  solutionSummary: 'Formulario centrado con feedback inline',
  wireframeAscii: '+----+',
  designTokens: {
    colors: [
      { name: 'primario', hex: '#2563EB', usage: 'CTA', contrastRatio: 4.8 },
      { name: 'texto', hex: '#111827', usage: 'texto', contrastRatio: 15 },
      { name: 'error', hex: '#B91C1C', usage: 'errores', contrastRatio: 6.2 },
    ],
    typographyScale: 'escala modular 1.25',
    spacingScale: 'base 8px',
  },
  components: [
    { name: 'Button', variants: ['primary', 'ghost'], states: ['default', 'hover', 'disabled'] },
  ],
  accessibilityChecklist: [
    'foco visible',
    'aria-describedby',
    'contraste AA',
    'orden de tabulación',
  ],
  interfaceStates: ['default', 'hover', 'loading', 'empty', 'error'],
  successMetrics: ['task success 90%', 'SUS 80'],
  acceptanceCriteria: [
    { given: 'x', when: 'y', then: 'z' },
    { given: 'a', when: 'b', then: 'c' },
  ],
});

const FRONTEND_JSON = JSON.stringify({
  analysis: ['requiere drag & drop', 'filtros client-side'],
  components: [{ name: 'KanbanBoard', kind: 'client', responsibility: 'tablero interactivo' }],
  folderStructure: 'src/features/kanban',
  stateAndDataStrategy: {
    stateDecision: 'zustand',
    persistenceDetails: 'persist en localStorage solo para columnas favoritas; nunca tokens',
    justification: 'estado efímero de UI con persistencia parcial',
  },
  formHandling: {
    hasForms: true,
    strategy: 'react-hook-form + zodResolver (@hookform/resolvers/zod)',
    schemaLocation: 'src/features/kanban/schema.ts compartido cliente/servidor',
  },
  i18nStrategy: {
    multilingual: true,
    localeDetection: 'cookie',
    details: 'next-intl con cookie NEXT_LOCALE, sin prefijo de URL; cambio vía Server Action',
  },
  serverCookiesUsage:
    'Lectura de preferencias con await cookies() en layout del servidor; escritura solo en Server Actions',
  performanceNotes: ['virtualizar columnas', 'memo en tarjetas'],
  accessibilityNotes: ['teclado para mover tarjetas', 'aria-live en filtros'],
  animationNotes: 'layout animations con reduced motion',
  tasks: [
    { area: 'components', description: 'Board' },
    { area: 'data', description: 'server actions' },
    { area: 'styles-animation', description: 'motion' },
    { area: 'testing', description: 'vitest' },
  ],
  storyPoints: 5,
  risks: ['librería DnD'],
});

const API_JSON = JSON.stringify({
  summary: 'API de autenticación',
  frameworkDecision: { framework: 'nestjs', justification: 'estructura modular' },
  endpoints: [
    {
      method: 'POST',
      path: '/auth/login',
      purpose: 'login',
      authRequired: false,
      statusCodes: [200, 401],
    },
  ],
  dataModel: [{ entity: 'User', fields: [{ name: 'email', type: 'string', indexed: true }] }],
  securityMeasures: ['rate-limiting por IP', 'bcrypt para passwords', 'rotación de refresh tokens'],
  errorHandlingStrategy: 'errores tipados dominio→HTTP',
  cachingStrategy: 'sesiones en Redis',
  tasks: [
    { area: 'endpoints', description: 'controladores' },
    { area: 'domain', description: 'casos de uso' },
    { area: 'database', description: 'migraciones' },
    { area: 'security', description: 'guards JWT' },
    { area: 'testing', description: 'supertest' },
  ],
  storyPoints: 3,
  risks: ['consistencia de sesiones'],
});

class ScriptedProvider extends LLMProvider {
  public requests: ChatMessage[][] = [];

  constructor(private readonly scripted: string[]) {
    super({ apiKey: 'key', model: 'mock' });
  }

  public override async generateCompletion(
    messages: ChatMessage[],
    _options?: GenerateCompletionOptions,
  ): Promise<string> {
    this.requests.push(structuredClone(messages));
    return this.scripted[Math.min(this.requests.length - 1, this.scripted.length - 1)];
  }
}

function makeAgents() {
  const poProvider = new ScriptedProvider([STORY_JSON]);
  const uxuiProvider = new ScriptedProvider([DESIGN_JSON]);
  const frontendProvider = new ScriptedProvider([FRONTEND_JSON]);
  const backendProvider = new ScriptedProvider([API_JSON]);

  const pipeline = new ProductDeliveryPipeline(
    new TechnicalPOAgent('key', 'mock', poProvider),
    new UXUIAgent('key', 'mock', uxuiProvider),
    new FrontendReactAgent('key', 'mock', frontendProvider),
    new BackendNodeAgent('key', 'mock', backendProvider),
  );

  return { pipeline, poProvider, uxuiProvider, frontendProvider, backendProvider };
}

describe('ProductDeliveryPipeline', () => {
  it('ejecuta todas las etapas y devuelve el paquete completo', async () => {
    const { pipeline } = makeAgents();

    const delivery = await pipeline.run('checkout con pago con tarjeta');

    expect(delivery.story.title).toBe('Autenticación OAuth2');
    expect(delivery.design?.solutionSummary).toContain('feedback inline');
    expect(delivery.frontend?.components[0].name).toBe('KanbanBoard');
    expect(delivery.api?.frameworkDecision.framework).toBe('nestjs');

    expect(Object.keys(delivery.stageTimingsMs).sort()).toEqual([
      'backend',
      'frontend',
      'po',
      'uxui',
    ]);
  });

  it('el brief de frontend incluye la historia y el diseño del UX/UI', async () => {
    const { pipeline, frontendProvider } = makeAgents();

    await pipeline.run('checkout con pago');

    const lastUserMessage = frontendProvider.requests[0].at(-1)!.content;
    expect(lastUserMessage).toContain('Autenticación OAuth2');
    expect(lastUserMessage).toContain('#2563EB');
    expect(lastUserMessage).toContain('TAREAS FRONTEND DEFINIDAS POR EL PRODUCT OWNER');
    expect(lastUserMessage).toContain('aria-describedby');
  });

  it('el brief de backend incluye los requisitos de seguridad del PO', async () => {
    const { pipeline, backendProvider } = makeAgents();

    await pipeline.run('checkout con pago');

    const lastUserMessage = backendProvider.requests[0].at(-1)!.content;
    expect(lastUserMessage).toContain('Rate-limiting y sanitización con zod');
    expect(lastUserMessage).toContain('(database) índice en users.email');
  });

  it('permite saltar etapas opcionales', async () => {
    const { pipeline, poProvider, uxuiProvider, frontendProvider, backendProvider } = makeAgents();

    const delivery = await pipeline.run('requerimiento simple', {
      stages: { uxui: false, frontend: false, backend: false },
    });

    expect(delivery.story.title).toBe('Autenticación OAuth2');
    expect(delivery.design).toBeUndefined();
    expect(delivery.frontend).toBeUndefined();
    expect(delivery.api).toBeUndefined();

    expect(poProvider.requests).toHaveLength(1);
    expect(uxuiProvider.requests).toHaveLength(0);
    expect(frontendProvider.requests).toHaveLength(0);
    expect(backendProvider.requests).toHaveLength(0);
    expect(Object.keys(delivery.stageTimingsMs)).toEqual(['po']);
  });

  it('lanza error si el requerimiento está vacío sin consumir el proveedor', async () => {
    const { pipeline, poProvider } = makeAgents();

    await expect(pipeline.run('   ')).rejects.toThrow(/no puede estar vacío/);
    expect(poProvider.requests).toHaveLength(0);
  });
});
