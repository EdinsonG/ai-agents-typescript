import 'dotenv/config';
import { AGENT_IDS, AgentId, createAgent } from '@/agents/index.js';

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

function printUsage(): void {
  console.log(`Uso: node dist/index.js <agente> [requerimiento]

Agentes disponibles: ${AGENT_IDS.join(', ')}

Ejemplos:
  node dist/index.js po
  node dist/index.js react "Tabla de productos con filtros y paginación"`);
}

async function main() {
  const [agentArg, ...requestArgs] = process.argv.slice(2);
  const agentId = (agentArg ?? 'po') as AgentId;

  if (!AGENT_IDS.includes(agentId)) {
    console.error(`❌ Agente desconocido: "${agentArg ?? ''}"`);
    printUsage();
    return;
  }

  if (!GROQ_API_KEY) {
    console.error('❌ Error: La variable de entorno GROQ_API_KEY_AGENTS no está configurada.');
    return;
  }

  const request = requestArgs.join(' ').trim() || DEFAULT_REQUESTS[agentId];
  const agent = createAgent(agentId, GROQ_API_KEY);

  console.log(`🚀 [Core] Ejecutando agente: ${agent.displayName}...`);

  try {
    const response = await agent.execute(request);
    console.log('\n======================= ENTREGABLE GENERADO =======================\n');
    console.log(response);
    console.log('\n==================================================================');
  } catch (error) {
    console.error('❌ Error durante la ejecución del agente:', error);
  }
}

main();
