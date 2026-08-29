#!/usr/bin/env node
import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import { AGENT_IDS, type AgentId, createAgent } from '@/agents/index.js';
import { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
import { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import { globalCollector } from '@/observability/collector.js';
import { formatUsageSummary } from '@/observability/reporter.js';
import { ProductDeliveryPipeline } from '@/orchestration/index.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY_AGENTS;
const REQUIREMENTS_FILE = 'requirements.md';

const FILE_FORMAT_EXAMPLE = `# Requerimientos del Proyecto

Cada sección define el requerimiento para un agente o pipeline.
El texto después del encabezado se usa como input del agente.

## po
Necesito un módulo de autenticación con user y password, además de soporte
para OAuth2 que soporte Google y GitHub, con manejo seguro de JWT y refresh
tokens, tiempo de sesión almacenado en redis con expiración de 15 minutos.

## react
Un dashboard Kanban con columnas arrastrables (drag & drop), filtros por
estado y animaciones fluidas entre movimientos de tarjetas.

## backend
API REST para gestión de suscripciones con cobros recurrentes: planes,
ciclos de facturación, webhooks de pasarela de pago con idempotencia
y reintentos.

## uxui
Rediseño del checkout de un e-commerce: actualmente 5 pasos y el 60%
abandona el carrito; buscamos reducir fricción y abandono.

## pipeline
Módulo de checkout con pago con tarjeta: carrito, datos de envío,
pasarela de pago segura y confirmación por email.
`;

function printUsage(): void {
  console.log(`Uso: ai-agents <agente|pipeline>

Agentes disponibles: ${AGENT_IDS.join(', ')}, pipeline (PO → UX → Frontend + Backend)

El agente lee su requerimiento desde ${REQUIREMENTS_FILE}.

Ejemplo de uso:
  1. Crea el archivo ${REQUIREMENTS_FILE} (ver formato más abajo)
  2. Ejecuta: ai-agents po
  3. Ejecuta: ai-agents pipeline`);
}

function printFileNotFound(): void {
  console.error(`❌ Error: No se encontró el archivo "${REQUIREMENTS_FILE}".`);
  console.error('');
  console.error('Crea el archivo con los requerimientos de tu proyecto:');
  console.error('');
  console.error('--- Inicio del formato ---');
  console.error(FILE_FORMAT_EXAMPLE);
  console.error('--- Fin del formato ---');
  console.error('');
  console.error(`Cada sección (## po, ## react, etc.) define el input para ese agente.`);
}

function parseRequirements(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection: string | null = null;
  const currentContent: string[] = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(\S+)\s*$/);
    if (match) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = match[1].toLowerCase();
      currentContent.length = 0;
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

function loadRequirement(target: string): string | null {
  if (!existsSync(REQUIREMENTS_FILE)) return null;

  const content = readFileSync(REQUIREMENTS_FILE, 'utf-8');
  const sections = parseRequirements(content);

  return sections[target] ?? null;
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
  console.log(
    `⏱️  Etapas: ${Object.entries(delivery.stageTimingsMs)
      .map(([stage, ms]) => `${stage} ${ms}ms`)
      .join(' · ')}`,
  );
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
  const [agentArg] = process.argv.slice(2);
  const target = agentArg ?? '';

  if (!GROQ_API_KEY) {
    console.error('❌ Error: La variable de entorno GROQ_API_KEY_AGENTS no está configurada.');
    return;
  }

  if (!target) {
    printUsage();
    return;
  }

  if (!AGENT_IDS.includes(target as AgentId) && target !== 'pipeline') {
    console.error(`❌ Agente desconocido: "${target}"`);
    printUsage();
    return;
  }

  const requirement = loadRequirement(target);

  if (!requirement) {
    printFileNotFound();
    return;
  }

  try {
    if (target === 'pipeline') {
      await runPipeline(requirement, GROQ_API_KEY);
    } else {
      await runAgent(target as AgentId, requirement, GROQ_API_KEY);
    }

    console.log(`\n${formatUsageSummary(globalCollector.summary())}`);
  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
  }
}

main();
