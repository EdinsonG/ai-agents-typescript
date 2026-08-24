/**
 * Contratos del núcleo de agentes: roles, mensajes y configuración.
 */

// Tipos de roles permitidos en el historial de conversación
export type AgentRole = 'system' | 'user' | 'assistant';

// Interfaz para la estructura de los mensajes en memoria
export interface ChatMessage {
  role: AgentRole;
  content: string;
}

// Configuración requerida para inicializar cualquier agente base
export interface AgentConfig {
  name: string;
  systemPrompt: string;
  apiKey: string;
  model?: string;
  temperature?: number;
  /** Presupuesto aproximado de tokens para los mensajes enviados al proveedor */
  maxContextTokens?: number;
}

// Opciones por petición: skills expertas a activar en esta ejecución
export interface ExecuteOptions {
  /** Ids de skills (registradas en el SkillRegistry) a inyectar en esta petición */
  skills?: readonly string[];
}
