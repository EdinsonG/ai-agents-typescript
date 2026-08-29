/**
 * Tipos de entregables estructurados generados por los agentes.
 * Los esquemas zod (fuente de verdad) viven junto a cada agente;
 * aquí solo se centralizan sus tipos inferidos para importación única.
 */

export type { ApiDesign } from '@/agents/BackendNode/schema.js';
export type { FrontendImplementationPlan } from '@/agents/FrontendReact/schema.js';
export type { UserStoryDeliverable } from '@/agents/TechnicalPO/schema.js';
export type { DesignSpec } from '@/agents/UXUI/schema.js';
