import type { ResilienceOptions } from '@/core/LLMProvider.js';

// Tipos de roles permitidos en el historial de conversación
export type AgentRole = 'system' | 'user' | 'assistant';

// Interfaz para la estructura de los mensajes en memoria
export interface ChatMessage {
  role: AgentRole;
  content: string;
}

// Opciones de configuración para el proveedor de LLM
export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  /** Política de reintentos, backoff y timeout */
  resilience?: ResilienceOptions;
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

// Formato de respuesta estructurada soportado por el proveedor
export interface JsonSchemaResponseFormat {
  type: 'json_schema';
  json_schema: { name: string; schema: Record<string, unknown> };
}
