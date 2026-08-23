import 'dotenv/config';
import { AGENT_IDS, AgentId, createAgent } from '@/agents/index.js';
import { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
import { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import { ProductDeliveryPipeline } from '@/orchestration/index.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY_AGENTS;

const DEFAULT_REQUESTS: Record<AgentId, string> = {
  po: 'Necesito un módulo de autenticación con user y password, además de soporte para OAuth2 que soporte Google y GitHub, con manejo seguro de JWT y refresh tokens, tiempo de sesión almacenado en redis con expiración de 15 minutos, y que se implemente siguiendo las mejores prácticas de seguridad para prevenir ataques comunes como XSS, CSRF e inyecciones SQL.',
  react:
    'Un dashboard Kanban con columnas arrastrables (drag & drop), filtros por estado y animaciones fluidas entre movimientos de tarjetas.',
  angular:
    'Una tabla administrativa con paginación server-side, ordenamiento por columna, búsqueda con debounce y edición en línea de usuarios.',
  backend:
    'API REST para gestión de suscripciones con cobros recurrentes: planes, ciclos de facturación, webhooks de pasarela de pago con idempotencia y reintentos.',
  uxui: 'Rediseño del checkout de un e-commerce: actualmente 5 pasos y el 60% abandona el carrito; buscamos reducir fricción y abandono.',
};

const PIPELINE_DEFAULT =
  'Módulo de checkout con pago con tarjeta: carrito, datos de envío, pasarela de pago segura y confirmación por email.';

function printUsage(): void {
  console.log(`Uso: node dist/index.js <agente|pipeline> [requerimiento]

Agentes disponibles: ${AGENT_IDS.join(', ')}, pipeline (PO → UX → Frontend + Backend)

Ejemplos:
  node dist/index.js po
  node dist/index.js react "Tabla de productos con filtros y paginación"
  node dist/index.js pipeline "Checkout con pago con tarjeta"`);
}

async function runPipeline(requirement: string, apiKey: string): Promise<void> {
  const pipeline = new ProductDeliveryPipeline(
    new TechnicalPOAgent(apiKey),
    new UXUIAgent(apiKey),
    new FrontendReactAgent(apiKey),
    new BackendNodeAgent(apiKey),
  );

  console.log('🚀 [Pipeline] PO → UX/UI → Frontend + Backend...');

  const delivery = await pipeline.run(requirement);

  console.log('\n======================= PAQUETE DE ENTREGABLES =======================\n');
  console.log(JSON.stringify(delivery, null, 2));
  console.log('\n======================================================================');
  console.log(`⏱️  Etapas: ${Object.entries(delivery.stageTimingsMs)
    .map(([stage, ms]) => `${stage} ${ms}ms`)
    .join(' · ')}`);
}

async function runAgent(agentId: AgentId, request: string, apiKey: string): Promise<void> {
  const agent = createAgent(agentId, apiKey);
  console.log(`🚀 [Core] Ejecutando agente: ${agent.displayName}...`);

  const response = await agent.execute(request);
  console.log('\n======================= ENTREGABLE GENERADO =======================\n');
  console.log(response);
  console.log('\n==================================================================');
}

async function main() {
  const [agentArg, ...requestArgs] = process.argv.slice(2);
  const target = agentArg ?? 'po';

  if (!GROQ_API_KEY) {
    console.error('❌ Error: La variable de entorno GROQ_API_KEY_AGENTS no está configurada.');
    return;
  }

  const request = requestArgs.join(' ').trim();

  try {
    if (target === 'pipeline') {
      await runPipeline(request || PIPELINE_DEFAULT, GROQ_API_KEY);
      return;
    }

    const agentId = target as AgentId;
    if (!AGENT_IDS.includes(agentId)) {
      console.error(`❌ Agente desconocido: "${target}"`);
      printUsage();
      return;
    }

    await runAgent(agentId, request || DEFAULT_REQUESTS[agentId], GROQ_API_KEY);
  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
  }
}

main();
