/**
 * Contratos del núcleo de agentes: roles, mensajes y configuración.
 */

import type { InferenceClient, InferenceProviderKind } from './llm.js';

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
  /** Protocolo del adaptador de inferencia. Default: 'openai-compatible' (Groq) */
  provider?: InferenceProviderKind;
  /** Endpoint base del proveedor. Ver KNOWN_BASE_URLS en core/clients */
  baseUrl?: string;
  /** Límite de caracteres para input del usuario (previene prompt injection por longitud) */
  maxInputLength?: number;
  /** Cliente de inferencia propio (implementa InferenceClient) */
  client?: InferenceClient;
}

/** Subconjunto de configuración de inferencia que exponen los agentes concretos. */
export type AgentInferenceOptions = Pick<AgentConfig, 'provider' | 'baseUrl' | 'client'>;

// Opciones por petición: skills expertas a activar en esta ejecución
export interface ExecuteOptions {
  /** Ids de skills (registradas en el SkillRegistry) a inyectar en esta petición */
  skills?: readonly string[];
}
